-- Faculties, departments, programmes, courses, and IPAM catalogue seed.
create table if not exists public.faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id),
  name text not null,
  unique (faculty_id, name)
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id),
  name text not null,
  duration_years integer default 4,
  award_type text not null default 'honours'
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  credits numeric not null default 3,
  is_active boolean not null default true,
  unique (code)
);

create table if not exists public.programme_courses (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  year integer,
  semester integer,
  kind text default 'Core',
  primary key (programme_id, course_id)
);

alter table public.courses add column if not exists is_active boolean not null default true;
alter table public.programme_courses add column if not exists year integer;
alter table public.programme_courses add column if not exists semester integer;
alter table public.programme_courses add column if not exists kind text default 'Core';
alter table public.programmes add column if not exists award_type text default 'honours';
alter table public.programmes add column if not exists duration_years integer default 4;
alter table public.course_attempts add column if not exists raw_total numeric;
alter table public.course_attempts add column if not exists rounded_total integer;

-- Faculties
insert into public.faculties (name, is_active) values
  ('Faculty of Information Systems & Technology', true),
  ('Faculty of Accounting & Finance', false),
  ('Faculty of Business Administration & Entrepreneurship', false),
  ('Faculty of Leadership & Governance', false)
on conflict (name) do nothing;

-- Departments under FIST
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

-- Programmes
insert into public.programmes (department_id, name, duration_years, award_type)
select d.id, p.name, 4, 'honours'
from public.departments d
join (values
  ('Department of Information Technology', 'BSc. Information Technology'),
  ('Department of Information Systems', 'BSc. Information Systems'),
  ('Department of Computer Networking', 'BSc. Computer Networking')
) as p(dept, name) on d.name = p.dept
where not exists (select 1 from public.programmes x where x.name = p.name);

-- Courses (unique by code)
insert into public.courses (code, title, credits) values
  ('DAA112', 'Mathematics for IT', 3),
  ('DHM111', 'Critical Thinking Skills', 3),
  ('DIT111', 'Computer Programming', 3),
  ('DPA111', 'Communication Skills', 3),
  ('DSD111', 'Academic Success Skills', 3),
  ('DIS211', 'Web Design', 3),
  ('DIS212', 'Database Systems 1', 3),
  ('DIS213', 'Data Structures & Algorithms', 3),
  ('DIS214', 'System Analysis & Design', 3),
  ('DIT211', 'Computer Networking 1', 3),
  ('DSD215', 'Technical Writing', 3),
  ('DIT311', 'Professional IT Practice', 3),
  ('DIT312', 'Integrated Systems and Technology', 3),
  ('DIT313', 'Cybersecurity Essentials', 3),
  ('DSD321', 'Research Methods', 3),
  ('DIT413', 'Cloud Computing', 3),
  ('DIT414', 'Virtualization', 3),
  ('DIT415', 'Advanced Cybersecurity', 3),
  ('DIT416', 'Artificial Intelligence', 3),
  ('ITM411', 'Data Analytics', 3),
  ('ITM412', 'User Experience Design', 3),
  ('DIT419', 'Elective Module', 3),
  ('DIS317', 'ICT Project Management', 3),
  ('DSD311', 'IS Ethics & Sustainability', 3),
  ('DHM418', 'Business Process Management', 3),
  ('DID414', 'Information Visualization', 3),
  ('ISM411', 'IS Strategy', 3),
  ('IT412', 'UX Design', 3),
  ('DCN111', 'Programming Foundation', 3),
  ('CNM211', 'Intro to Linux', 3),
  ('CNM213', 'Network Access', 3)
on conflict (code) do update set title = excluded.title, credits = excluded.credits;

-- Programme-course links
insert into public.programme_courses (programme_id, course_id, year, semester, kind)
select p.id, c.id, l.year, 1, l.kind
from (values
  ('BSc. Information Technology', 'DAA112', 1, 'Core'),
  ('BSc. Information Technology', 'DHM111', 1, 'Elective'),
  ('BSc. Information Technology', 'DIT111', 1, 'Elective'),
  ('BSc. Information Technology', 'DPA111', 1, 'Elective'),
  ('BSc. Information Technology', 'DSD111', 1, 'Elective'),
  ('BSc. Information Technology', 'DIS211', 2, 'Core'),
  ('BSc. Information Technology', 'DIS212', 2, 'Core'),
  ('BSc. Information Technology', 'DIS214', 2, 'Core'),
  ('BSc. Information Technology', 'DIT211', 2, 'Core'),
  ('BSc. Information Technology', 'DSD215', 2, 'Core'),
  ('BSc. Information Technology', 'DIT311', 3, 'Core'),
  ('BSc. Information Technology', 'DIT312', 3, 'Core'),
  ('BSc. Information Technology', 'DIT313', 3, 'Core'),
  ('BSc. Information Technology', 'DSD321', 3, 'Core'),
  ('BSc. Information Technology', 'DIT413', 4, 'Elective'),
  ('BSc. Information Technology', 'DIT414', 4, 'Elective'),
  ('BSc. Information Technology', 'DIT415', 4, 'Core'),
  ('BSc. Information Technology', 'DIT416', 4, 'Elective'),
  ('BSc. Information Technology', 'ITM411', 4, 'Core'),
  ('BSc. Information Technology', 'ITM412', 4, 'Core'),
  ('BSc. Information Systems', 'DAA112', 1, 'Core'),
  ('BSc. Information Systems', 'DHM111', 1, 'Elective'),
  ('BSc. Information Systems', 'DIT111', 1, 'Elective'),
  ('BSc. Information Systems', 'DPA111', 1, 'Elective'),
  ('BSc. Information Systems', 'DSD111', 1, 'Elective'),
  ('BSc. Information Systems', 'DIT419', 1, 'Elective'),
  ('BSc. Information Systems', 'DIS211', 2, 'Core'),
  ('BSc. Information Systems', 'DIS212', 2, 'Core'),
  ('BSc. Information Systems', 'DIS213', 2, 'Core'),
  ('BSc. Information Systems', 'DIS214', 2, 'Core'),
  ('BSc. Information Systems', 'DSD215', 2, 'Core'),
  ('BSc. Information Systems', 'DIS317', 3, 'Core'),
  ('BSc. Information Systems', 'DIT313', 3, 'Core'),
  ('BSc. Information Systems', 'DSD311', 3, 'Core'),
  ('BSc. Information Systems', 'DSD321', 3, 'Core'),
  ('BSc. Information Systems', 'DHM418', 4, 'Elective'),
  ('BSc. Information Systems', 'DID414', 4, 'Elective'),
  ('BSc. Information Systems', 'DIT419', 4, 'Elective'),
  ('BSc. Information Systems', 'ISM411', 4, 'Core'),
  ('BSc. Information Systems', 'IT412', 4, 'Core'),
  ('BSc. Computer Networking', 'DAA112', 1, 'Core'),
  ('BSc. Computer Networking', 'DCN111', 1, 'Core'),
  ('BSc. Computer Networking', 'DHM111', 1, 'Elective'),
  ('BSc. Computer Networking', 'DPA111', 1, 'Elective'),
  ('BSc. Computer Networking', 'DSD111', 1, 'Elective'),
  ('BSc. Computer Networking', 'CNM211', 2, 'Core'),
  ('BSc. Computer Networking', 'CNM213', 2, 'Core'),
  ('BSc. Computer Networking', 'DIS211', 2, 'Core'),
  ('BSc. Computer Networking', 'DIS212', 2, 'Core'),
  ('BSc. Computer Networking', 'DSD215', 2, 'Core')
) as l(prog, code, year, kind)
join public.programmes p on p.name = l.prog
join public.courses c on c.code = l.code
on conflict (programme_id, course_id) do update set year = excluded.year, semester = excluded.semester, kind = excluded.kind;
