-- Academic year and semester on attempts.
alter table public.course_attempts add column if not exists academic_year text;
alter table public.course_attempts add column if not exists semester integer;
