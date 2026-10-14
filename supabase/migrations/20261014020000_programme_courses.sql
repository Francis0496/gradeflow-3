-- Link courses to programmes (many-to-many).
create table if not exists public.programme_courses (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  year integer,
  semester integer,
  primary key (programme_id, course_id)
);

alter table public.programme_courses enable row level security;

create policy "programme_courses_select" on public.programme_courses
  for select using (true);

create policy "programme_courses_admin_write" on public.programme_courses
  for all using (
    exists (
      select 1 from public.role_assignments
      where user_id = auth.uid() and role in ('admin', 'institution_admin')
    )
  );
