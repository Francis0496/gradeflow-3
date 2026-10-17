-- Migration: Schema Governance, Institutions, Grading Policies, RPC, and Row Level Security
-- Product: GradeFlow 3.0 | Sierra EduTech Solutions Limited

-- 1. INSTITUTIONS & CAMPUSES
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  country text not null default 'Sierra Leone',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (institution_id, name)
);

-- Seed University of Sierra Leone and IPAM campus
insert into public.institutions (name, short_name, country)
values ('University of Sierra Leone', 'USL', 'Sierra Leone')
on conflict (name) do nothing;

insert into public.campuses (institution_id, name)
select id, 'Institute of Public Administration and Management (IPAM)'
from public.institutions
where short_name = 'USL'
on conflict (institution_id, name) do nothing;

-- Ensure faculties reference institution
alter table public.faculties add column if not exists institution_id uuid references public.institutions(id);
update public.faculties
set institution_id = (select id from public.institutions where short_name = 'USL' limit 1)
where institution_id is null;

-- 2. PROFILES & ROLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  programme_id uuid references public.programmes(id),
  academic_level text default 'Year 1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'lecturer', 'department_admin', 'registry_officer', 'institution_admin', 'platform_admin', 'admin')),
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- 3. COURSE ATTEMPTS & ACADEMIC RECORDS
create table if not exists public.course_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  credit_hours numeric not null default 3.0,
  ca_score numeric check (ca_score is null or (ca_score >= 0 and ca_score <= 100)),
  exam_score numeric check (exam_score is null or (exam_score >= 0 and exam_score <= 100)),
  total_score numeric,
  raw_total numeric,
  rounded_total integer,
  letter_grade text not null,
  grade_point numeric not null,
  quality_points numeric not null,
  academic_year text not null default '2025/2026',
  semester integer not null default 1 check (semester in (1, 2)),
  is_verified boolean not null default false,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. VERSIONED GRADING POLICIES
create table if not exists public.grading_policies (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id),
  name text not null,
  version text not null default '2018.1',
  ca_weight numeric not null default 0.30,
  exam_weight numeric not null default 0.70,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.grade_bands (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references public.grading_policies(id) on delete cascade,
  min_score numeric not null,
  max_score numeric not null,
  letter_grade text not null,
  grade_point numeric not null,
  created_at timestamptz default now()
);

-- 5. AUDIT LOGS FOR GOVERNANCE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- 6. RPC: CLAIM FIRST ADMIN
-- Allows the first registered user to claim administrator privileges safely
create or replace function public.claim_first_admin()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  admin_count integer;
begin
  caller_id := auth.uid();
  if caller_id is null then
    return 'Unauthorized';
  end if;

  select count(*) into admin_count
  from public.role_assignments
  where role in ('admin', 'institution_admin', 'platform_admin');

  if admin_count > 0 then
    -- Check if caller is already admin
    if exists (select 1 from public.role_assignments where user_id = caller_id and role in ('admin', 'institution_admin', 'platform_admin')) then
      return 'ok';
    end if;
    return 'Admin already claimed';
  end if;

  insert into public.role_assignments (user_id, role)
  values (caller_id, 'admin')
  on conflict (user_id, role) do nothing;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
  values (caller_id, 'CLAIM_FIRST_ADMIN', 'role_assignments', caller_id::text, jsonb_build_object('role', 'admin'));

  return 'ok';
end;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
alter table public.institutions enable row level security;
alter table public.campuses enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.programmes enable row level security;
alter table public.courses enable row level security;
alter table public.programme_courses enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.course_attempts enable row level security;
alter table public.grading_policies enable row level security;
alter table public.grade_bands enable row level security;
alter table public.audit_logs enable row level security;

-- Public/Catalog reading policies (read-only for all users)
create policy "institutions_read" on public.institutions for select using (true);
create policy "campuses_read" on public.campuses for select using (true);
create policy "faculties_read" on public.faculties for select using (true);
create policy "departments_read" on public.departments for select using (true);
create policy "programmes_read" on public.programmes for select using (true);
create policy "courses_read" on public.courses for select using (true);
create policy "grading_policies_read" on public.grading_policies for select using (true);
create policy "grade_bands_read" on public.grade_bands for select using (true);

-- Profiles: Students manage own profile; Admins can view all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id or
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'institution_admin', 'platform_admin', 'registry_officer')
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Role assignments: users can inspect own role; admins manage roles
create policy "role_assignments_select_own_or_admin" on public.role_assignments
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'institution_admin', 'platform_admin')
    )
  );

create policy "role_assignments_admin_all" on public.role_assignments
  for all using (
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'institution_admin', 'platform_admin')
    )
  );

-- Course Attempts: STRICT TENANT & STUDENT ISOLATION
-- A student can ONLY see and manage their own course attempts
create policy "attempts_select_own" on public.course_attempts
  for select using (
    auth.uid() = student_id or
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')
    )
  );

create policy "attempts_insert_own" on public.course_attempts
  for insert with check (auth.uid() = student_id);

create policy "attempts_update_own" on public.course_attempts
  for update using (
    auth.uid() = student_id and is_verified = false
  ) with check (
    auth.uid() = student_id and is_verified = false
  );

create policy "attempts_delete_own" on public.course_attempts
  for delete using (
    auth.uid() = student_id and is_verified = false
  );

-- Audit logs: Insertable by authenticated users; readable only by admins
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (auth.uid() is not null);

create policy "audit_logs_select_admin" on public.audit_logs
  for select using (
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'platform_admin')
    )
  );
