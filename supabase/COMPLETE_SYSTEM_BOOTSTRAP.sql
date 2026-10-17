-- ==============================================================================
-- GRADEFLOW 3.0: COMPLETE SYSTEM BOOTSTRAP MIGRATION & SEED SCRIPT
-- Product: GradeFlow 3.0 | Sierra EduTech Solutions Limited
-- Target: Institute of Public Administration and Management (IPAM), USL
-- 
-- INSTRUCTIONS FOR SUPABASE CONSOLE:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yaiqyxvuqssbnfmxrykh/sql/new
-- 2. Paste the entire content of this script into the SQL Editor.
-- 3. Click "Run" (or press Ctrl + Enter).
-- 4. Return to GradeFlow and click "Claim First Administrator Access".
-- ==============================================================================

-- 0. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

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

-- 2. ACADEMIC STRUCTURE: FACULTIES, DEPARTMENTS, PROGRAMMES
create table if not exists public.faculties (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (faculty_id, name)
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  name text not null unique,
  duration_years integer default 4,
  award_type text not null default 'honours',
  created_at timestamptz default now()
);

-- 3. COURSE CATALOGUE & CURRICULUM LINKS
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  credit_hours numeric(3,1) not null default 3.0,
  credits numeric(3,1) not null default 3.0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.programme_courses (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  semester_number integer not null default 1,
  year integer default 1,
  semester integer default 1,
  is_core boolean not null default true,
  kind text not null default 'Core',
  created_at timestamptz default now(),
  primary key (programme_id, course_id)
);

-- 4. USER PROFILES & ROLE-BASED ACCESS CONTROL
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  programme_id uuid references public.programmes(id) on delete set null,
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

-- 5. VERSIONED GRADING POLICIES & 10-TIER SCALE BANDS
create table if not exists public.grading_policies (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  name text not null,
  version text not null default '2018.1',
  ca_weight numeric(3,2) not null default 0.30,
  exam_weight numeric(3,2) not null default 0.70,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique (institution_id, version)
);

create table if not exists public.grade_bands (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.grading_policies(id) on delete cascade,
  min_score numeric(5,2) not null,
  max_score numeric(5,2) not null,
  letter_grade text not null,
  grade_point numeric(3,2) not null,
  created_at timestamptz default now()
);

-- 6. COURSE ATTEMPTS & ACADEMIC RECORDS
create table if not exists public.course_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  credit_hours numeric(3,1) not null default 3.0,
  ca_score numeric(5,2),
  exam_score numeric(5,2),
  total_score numeric(5,2),
  raw_total numeric(5,2),
  rounded_total integer,
  letter_grade text not null,
  grade_point numeric(3,2) not null,
  quality_points numeric(6,2) not null,
  academic_year text not null default '2025/2026',
  semester integer not null default 1,
  is_verified boolean not null default true,
  created_at timestamptz default now()
);

-- 7. AUDIT LOGS FOR GOVERNANCE & COMPLIANCE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ==============================================================================
-- 7B. COLUMN RECONCILIATION FOR PRE-EXISTING TABLES (Prevents ERROR 42703)
-- ==============================================================================
alter table public.institutions add column if not exists short_name text;
alter table public.institutions add column if not exists country text default 'Sierra Leone';
alter table public.institutions add column if not exists is_active boolean default true;

alter table public.faculties add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
alter table public.faculties add column if not exists is_active boolean default true;

alter table public.departments add column if not exists faculty_id uuid references public.faculties(id) on delete cascade;

alter table public.programmes add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.programmes add column if not exists duration_years integer default 4;
alter table public.programmes add column if not exists award_type text default 'honours';
alter table public.programmes add column if not exists degree_type text default 'BSc';
alter table public.programmes add column if not exists total_semesters integer default 8;

-- Handle legacy NOT NULL constraints on programmes
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'programmes' and column_name = 'degree_type'
  ) then
    alter table public.programmes alter column degree_type set default 'BSc';
    alter table public.programmes alter column degree_type drop not null;
    update public.programmes set degree_type = 'BSc' where degree_type is null;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'programmes' and column_name = 'total_semesters'
  ) then
    alter table public.programmes alter column total_semesters set default 8;
    alter table public.programmes alter column total_semesters drop not null;
    update public.programmes set total_semesters = 8 where total_semesters is null;
  end if;
end $$;

alter table public.courses add column if not exists credit_hours numeric(3,1) default 3.0;
alter table public.courses add column if not exists credits numeric(3,1) default 3.0;
alter table public.courses add column if not exists is_active boolean default true;

alter table public.programme_courses add column if not exists semester_number integer default 1;
alter table public.programme_courses add column if not exists year integer default 1;
alter table public.programme_courses add column if not exists semester integer default 1;
alter table public.programme_courses add column if not exists is_core boolean default true;
alter table public.programme_courses add column if not exists kind text default 'Core';

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists programme_id uuid references public.programmes(id) on delete set null;
alter table public.profiles add column if not exists academic_level text default 'Year 1';

alter table public.grading_policies add column if not exists institution_id uuid references public.institutions(id) on delete cascade;
alter table public.grading_policies add column if not exists version text default '2018.1';
alter table public.grading_policies add column if not exists ca_weight numeric(3,2) default 0.30;
alter table public.grading_policies add column if not exists exam_weight numeric(3,2) default 0.70;
alter table public.grading_policies add column if not exists is_active boolean default true;

-- Ensure grading_policies version is text (converts legacy integer column)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'grading_policies' and column_name = 'version' and data_type <> 'text'
  ) then
    alter table public.grading_policies alter column version type text using version::text;
    alter table public.grading_policies alter column version set default '2018.1';
  end if;
exception when others then null;
end $$;

alter table public.grade_bands add column if not exists policy_id uuid references public.grading_policies(id) on delete cascade;
alter table public.grade_bands add column if not exists min_score numeric(5,2);
alter table public.grade_bands add column if not exists max_score numeric(5,2);
alter table public.grade_bands add column if not exists letter_grade text;
alter table public.grade_bands add column if not exists letter text;
alter table public.grade_bands add column if not exists grade_point numeric(3,2);

alter table public.course_attempts add column if not exists credit_hours numeric(3,1) default 3.0;
alter table public.course_attempts add column if not exists ca_score numeric(5,2);
alter table public.course_attempts add column if not exists exam_score numeric(5,2);
alter table public.course_attempts add column if not exists total_score numeric(5,2);
alter table public.course_attempts add column if not exists raw_total numeric(5,2);
alter table public.course_attempts add column if not exists rounded_total integer;
alter table public.course_attempts add column if not exists letter_grade text;
alter table public.course_attempts add column if not exists letter text;
alter table public.course_attempts add column if not exists grade_point numeric(3,2);
alter table public.course_attempts add column if not exists quality_points numeric(6,2);
alter table public.course_attempts add column if not exists academic_year text default '2025/2026';
alter table public.course_attempts add column if not exists semester integer default 1;
alter table public.course_attempts add column if not exists is_verified boolean default true;

-- Sync values from legacy columns if they exist and remove obsolete unique constraints
do $$
begin
  -- Drop obsolete unique constraints that conflict with modern multi-tier schema
  alter table public.grade_bands drop constraint if exists grade_bands_policy_id_letter_key;
  alter table public.grade_bands drop constraint if exists grade_bands_policy_id_letter_grade_key;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'grade_bands' and column_name = 'letter') then
    alter table public.grade_bands alter column letter drop not null;
    alter table public.grade_bands alter column letter drop default;
    execute 'update public.grade_bands set letter_grade = letter where letter_grade is null and letter is not null and letter <> ''''';
    execute 'update public.grade_bands set letter = letter_grade where (letter is null or letter = '''') and letter_grade is not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'course_attempts' and column_name = 'letter') then
    alter table public.course_attempts alter column letter drop not null;
    alter table public.course_attempts alter column letter drop default;
    execute 'update public.course_attempts set letter_grade = letter where letter_grade is null and letter is not null and letter <> ''''';
    execute 'update public.course_attempts set letter = letter_grade where (letter is null or letter = '''') and letter_grade is not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'credits') then
    alter table public.courses alter column credits drop not null;
    execute 'update public.courses set credit_hours = credits where (credit_hours is null or credit_hours = 0) and credits is not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'user_id') then
    alter table public.audit_logs add column if not exists actor_id uuid references auth.users(id) on delete set null;
    execute 'update public.audit_logs set actor_id = user_id where actor_id is null and user_id is not null';
  end if;
exception when others then null;
end $$;

-- 8. RPC: CLAIM FIRST ADMINISTRATOR
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
    return 'Unauthorized: Please sign in first to claim admin privileges.';
  end if;

  select count(*) into admin_count
  from public.role_assignments
  where role in ('admin', 'institution_admin', 'platform_admin');

  if admin_count > 0 then
    if exists (select 1 from public.role_assignments where user_id = caller_id and role in ('admin', 'institution_admin', 'platform_admin')) then
      return 'ok';
    end if;
    return 'Admin privileges have already been claimed by another user.';
  end if;

  insert into public.role_assignments (user_id, role)
  values (caller_id, 'admin')
  on conflict (user_id, role) do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (caller_id, 'claim_first_admin', 'role_assignments', caller_id::text, jsonb_build_object('role', 'admin', 'claimed_at', now()));

  return 'ok';
end;
$$;

grant execute on function public.claim_first_admin() to authenticated, anon;

-- 9. USER PROFILE AUTO-PROVISIONING TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS)
alter table public.institutions enable row level security;
alter table public.campuses enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.programmes enable row level security;
alter table public.courses enable row level security;
alter table public.programme_courses enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.grading_policies enable row level security;
alter table public.grade_bands enable row level security;
alter table public.course_attempts enable row level security;
alter table public.audit_logs enable row level security;

-- Public/Authenticated Read Policies
create policy "Allow public read on institutions" on public.institutions for select using (true);
create policy "Allow public read on campuses" on public.campuses for select using (true);
create policy "Allow public read on faculties" on public.faculties for select using (true);
create policy "Allow public read on departments" on public.departments for select using (true);
create policy "Allow public read on programmes" on public.programmes for select using (true);
create policy "Allow public read on courses" on public.courses for select using (true);
create policy "Allow public read on programme_courses" on public.programme_courses for select using (true);
create policy "Allow public read on grading_policies" on public.grading_policies for select using (true);
create policy "Allow public read on grade_bands" on public.grade_bands for select using (true);

-- User Profile & Role Policies
create policy "Allow users to read profiles" on public.profiles for select using (auth.uid() is not null);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow users to read own roles" on public.role_assignments for select using (auth.uid() = user_id or exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'platform_admin')));

-- Student Course Attempts Policies
create policy "Students can view own attempts" on public.course_attempts for select using (auth.uid() = student_id or exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "Students can insert own attempts" on public.course_attempts for insert with check (auth.uid() = student_id or exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "Students can update own attempts" on public.course_attempts for update using (auth.uid() = student_id or exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "Students can delete own attempts" on public.course_attempts for delete using (auth.uid() = student_id or exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));

-- Admin Write Policies for Catalogue & Structure
create policy "Admins can manage courses" on public.courses for all using (exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "Admins can manage programme_courses" on public.programme_courses for all using (exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "Admins can view audit logs" on public.audit_logs for select using (exists (select 1 from public.role_assignments where user_id = auth.uid() and role in ('admin', 'institution_admin', 'registry_officer')));
create policy "System can write audit logs" on public.audit_logs for insert with check (true);

-- ==============================================================================
-- 10A. AUTOMATIC DEDUPLICATION CLEANUP
-- Cleans duplicate rows from previous partial migrations before creating unique indexes
-- ==============================================================================
do $$
begin
  -- Deduplicate programme_courses keeping the newest record
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'programme_courses') then
    delete from public.programme_courses a
    using public.programme_courses b
    where a.ctid < b.ctid
      and a.programme_id = b.programme_id
      and a.course_id = b.course_id;
  end if;

  -- Deduplicate role_assignments
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'role_assignments') then
    delete from public.role_assignments a
    using public.role_assignments b
    where a.ctid < b.ctid
      and a.user_id = b.user_id
      and a.role = b.role;
  end if;

  -- Deduplicate grade_bands and clean up any empty string letter artifacts
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'grade_bands') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'grade_bands' and column_name = 'letter') then
      delete from public.grade_bands where letter = '' or letter is null;
    end if;
    delete from public.grade_bands a
    using public.grade_bands b
    where a.ctid < b.ctid
      and a.policy_id = b.policy_id
      and a.letter_grade = b.letter_grade;
  end if;

  -- Deduplicate grading_policies
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'grading_policies') then
    delete from public.grading_policies a
    using public.grading_policies b
    where a.ctid < b.ctid
      and a.institution_id = b.institution_id
      and a.version = b.version;
  end if;

  -- Deduplicate campuses
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'campuses') then
    delete from public.campuses a
    using public.campuses b
    where a.ctid < b.ctid
      and a.institution_id = b.institution_id
      and a.name = b.name;
  end if;
end $$;

-- ==============================================================================
-- 10B. IDEMPOTENT CONSTRAINTS & UNIQUE INDEXES (Prevents PostgreSQL 42P10 errors)
-- ==============================================================================
create unique index if not exists institutions_name_idx on public.institutions (name);
create unique index if not exists campuses_inst_name_idx on public.campuses (institution_id, name);
create unique index if not exists faculties_id_idx on public.faculties (id);
create unique index if not exists faculties_name_idx on public.faculties (name);
create unique index if not exists departments_id_idx on public.departments (id);
create unique index if not exists departments_fac_name_idx on public.departments (faculty_id, name);
create unique index if not exists programmes_id_idx on public.programmes (id);
create unique index if not exists programmes_name_idx on public.programmes (name);
create unique index if not exists grading_policies_id_idx on public.grading_policies (id);
create unique index if not exists grading_policies_inst_ver_idx on public.grading_policies (institution_id, version);
create unique index if not exists grade_bands_id_idx on public.grade_bands (id);
create unique index if not exists grade_bands_policy_letter_idx on public.grade_bands (policy_id, letter_grade);
create unique index if not exists courses_code_idx on public.courses (code);
create unique index if not exists role_assignments_user_role_idx on public.role_assignments (user_id, role);
create unique index if not exists programme_courses_pkey_idx on public.programme_courses (programme_id, course_id);

-- ==============================================================================
-- 11. INITIAL SEED DATA: UNIVERSITY OF SIERRA LEONE & IPAM FIST CURRICULUM
-- (Dynamically resolves foreign keys and upserts against natural unique keys)
-- ==============================================================================

-- 1. Institution
insert into public.institutions (name, short_name, country)
values ('University of Sierra Leone', 'USL', 'Sierra Leone')
on conflict (name) do update set
  short_name = excluded.short_name,
  country = excluded.country;

-- 2. Campus
insert into public.campuses (institution_id, name)
select i.id, 'Institute of Public Administration and Management (IPAM)'
from public.institutions i
where i.name = 'University of Sierra Leone'
on conflict (institution_id, name) do nothing;

-- 3. Faculties
insert into public.faculties (institution_id, name, is_active)
select i.id, f.name, f.is_active
from public.institutions i
cross join (values
  ('Faculty of Information Systems & Technology', true),
  ('Faculty of Accounting & Finance', false),
  ('Faculty of Business Administration & Entrepreneurship', false),
  ('Faculty of Leadership & Governance', false)
) as f(name, is_active)
where i.name = 'University of Sierra Leone'
on conflict (name) do update set
  institution_id = excluded.institution_id,
  is_active = excluded.is_active;

-- 4. Departments
insert into public.departments (faculty_id, name)
select f.id, d.name
from public.faculties f
cross join (values
  ('Department of Information Technology'),
  ('Department of Information Systems'),
  ('Department of Computer Networking')
) as d(name)
where f.name = 'Faculty of Information Systems & Technology'
on conflict (faculty_id, name) do nothing;

-- 5. Programmes
insert into public.programmes (department_id, name, duration_years, award_type, degree_type)
select d.id, p.name, 4, 'honours', 'BSc'
from public.departments d
join (values
  ('Department of Information Technology', 'BSc. Information Technology'),
  ('Department of Information Systems', 'BSc. Information Systems'),
  ('Department of Computer Networking', 'BSc. Computer Networking')
) as p(dept, name) on d.name = p.dept
on conflict (name) do update set
  department_id = excluded.department_id,
  duration_years = excluded.duration_years,
  award_type = excluded.award_type,
  degree_type = coalesce(excluded.degree_type, public.programmes.degree_type, 'BSc');

-- 6. Versioned 10-Tier Grading Scale Policy
insert into public.grading_policies (institution_id, name, version, ca_weight, exam_weight, is_active)
select i.id, 'IPAM 10-Tier Scale', '2018.1', 0.30, 0.70, true
from public.institutions i
where i.name = 'University of Sierra Leone'
on conflict (institution_id, version) do update set
  name = excluded.name,
  ca_weight = excluded.ca_weight,
  exam_weight = excluded.exam_weight,
  is_active = excluded.is_active;

-- 7. Grade Scale Bands
insert into public.grade_bands (policy_id, min_score, max_score, letter_grade, letter, grade_point)
select
  gp.id,
  b.min_score,
  b.max_score,
  b.letter_grade,
  b.letter_grade,
  b.grade_point
from public.grading_policies gp
cross join (values
  (70.00, 100.00, 'A', 4.00),
  (65.00, 69.99, 'B+', 3.75),
  (60.00, 64.99, 'B', 3.25),
  (55.00, 59.99, 'B-', 3.00),
  (50.00, 54.99, 'C+', 2.75),
  (45.00, 49.99, 'C', 2.50),
  (40.00, 44.99, 'C-', 2.00),
  (35.00, 39.99, 'D', 1.50),
  (30.00, 34.99, 'E', 1.00),
  (0.00, 29.99, 'F', 0.00)
) as b(min_score, max_score, letter_grade, grade_point)
where gp.version = '2018.1'
on conflict (policy_id, letter_grade) do update set
  min_score = excluded.min_score,
  max_score = excluded.max_score,
  letter = excluded.letter,
  grade_point = excluded.grade_point;

-- 8. 27 Approved Official IPAM Courses
insert into public.courses (code, title, credit_hours, credits, is_active) values
  ('DIT111', 'Introduction to Computing & Information Technology', 3.0, 3.0, true),
  ('DIT112', 'Programming Fundamentals in C', 3.0, 3.0, true),
  ('MAT111', 'Discrete Mathematics for Computing', 3.0, 3.0, true),
  ('ENG111', 'Communication & Study Skills in English', 3.0, 3.0, true),
  ('DIT121', 'Data Structures & Algorithms Analysis', 3.0, 3.0, true),
  ('DIT122', 'Object-Oriented Programming with Java', 3.0, 3.0, true),
  ('DIT123', 'Computer Architecture & Digital Logic', 3.0, 3.0, true),
  ('GEN121', 'African Studies & Contemporary Civilization', 3.0, 3.0, true),
  ('DIT211', 'Data Communications & Computer Networking 1', 3.0, 3.0, true),
  ('DIS211', 'Web Design, Technologies & Standards', 3.0, 3.0, true),
  ('DIS212', 'Database Systems Design & SQL 1', 3.0, 3.0, true),
  ('MAT211', 'Probability & Statistics for Computing', 3.0, 3.0, true),
  ('DIT221', 'Operating Systems & System Administration', 3.0, 3.0, true),
  ('DIT222', 'Object-Oriented Analysis & Design with UML', 3.0, 3.0, true),
  ('DIS221', 'Advanced Database Management Systems 2', 3.0, 3.0, true),
  ('DIS222', 'E-Commerce Engineering & Web Platforms', 3.0, 3.0, true),
  ('DIT311', 'Software Engineering Principles & Lifecycle', 3.0, 3.0, true),
  ('DIT312', 'Network Security & Applied Cryptography', 3.0, 3.0, true),
  ('DIS311', 'Enterprise Information Systems Architecture', 3.0, 3.0, true),
  ('DIT321', 'Mobile Application Development (Android/Flutter)', 3.0, 3.0, true),
  ('DIT322', 'Cloud Computing Architecture & Virtualization', 3.0, 3.0, true),
  ('DIS321', 'Big Data Technologies & Analytics', 3.0, 3.0, true),
  ('DIT411', 'Final Year Capstone Research Project 1', 3.0, 3.0, true),
  ('DIT412', 'Artificial Intelligence & Machine Learning', 3.0, 3.0, true),
  ('DIS411', 'IT Project Management & Agile Methodologies', 3.0, 3.0, true),
  ('DIT421', 'Final Year Capstone Research Project 2', 6.0, 6.0, true),
  ('DIT422', 'Cyber Security Law, Ethics & Professional Practice', 3.0, 3.0, true)
on conflict (code) do update set
  title = excluded.title,
  credit_hours = excluded.credit_hours,
  credits = excluded.credits,
  is_active = excluded.is_active;

-- 9. Curriculum Programme Links (BSc. Information Technology)
insert into public.programme_courses (programme_id, course_id, semester_number, year, semester, is_core, kind)
select
  p.id,
  c.id,
  m.sem_num,
  m.yr,
  m.sem,
  m.core,
  case when m.core then 'Core' else 'Elective' end
from (values
  ('DIT111', 1, 1, 1, true),
  ('DIT112', 1, 1, 1, true),
  ('MAT111', 1, 1, 1, true),
  ('ENG111', 1, 1, 1, true),
  ('DIT121', 2, 1, 2, true),
  ('DIT122', 2, 1, 2, true),
  ('DIT123', 2, 1, 2, true),
  ('GEN121', 2, 1, 2, true),
  ('DIT211', 3, 2, 1, true),
  ('DIS211', 3, 2, 1, true),
  ('DIS212', 3, 2, 1, true),
  ('MAT211', 3, 2, 1, true),
  ('DIT221', 4, 2, 2, true),
  ('DIT222', 4, 2, 2, true),
  ('DIS221', 4, 2, 2, true),
  ('DIS222', 4, 2, 2, true),
  ('DIT311', 5, 3, 1, true),
  ('DIT312', 5, 3, 1, true),
  ('DIS311', 5, 3, 1, true),
  ('DIT321', 6, 3, 2, true),
  ('DIT322', 6, 3, 2, true),
  ('DIS321', 6, 3, 2, true),
  ('DIT411', 7, 4, 1, true),
  ('DIT412', 7, 4, 1, true),
  ('DIS411', 7, 4, 1, true),
  ('DIT421', 8, 4, 2, true),
  ('DIT422', 8, 4, 2, true)
) as m(code, sem_num, yr, sem, core)
join public.courses c on c.code = m.code
cross join (
  select id from public.programmes where name = 'BSc. Information Technology' limit 1
) p
on conflict (programme_id, course_id) do update set
  semester_number = excluded.semester_number,
  year = excluded.year,
  semester = excluded.semester,
  is_core = excluded.is_core,
  kind = excluded.kind;
