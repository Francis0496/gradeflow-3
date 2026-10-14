-- Optional column for soft-delete of courses.
alter table public.courses add column if not exists is_active boolean not null default true;
