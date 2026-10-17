-- Seed data for GradeFlow 3.0
-- Institution: Institute of Public Administration and Management (IPAM), University of Sierra Leone
-- Synthetic test data - no real student personal data.

-- Ensure deduplication before creating indexes
delete from public.programme_courses a
using public.programme_courses b
where a.ctid < b.ctid
  and a.programme_id = b.programme_id
  and a.course_id = b.course_id;

-- Ensure Unique Indexes exist for all tables
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

-- 1. Ensure University & Campus
insert into public.institutions (name, short_name, country)
values ('University of Sierra Leone', 'USL', 'Sierra Leone')
on conflict (name) do update set short_name = excluded.short_name, country = excluded.country;

insert into public.campuses (institution_id, name)
select i.id, 'Institute of Public Administration and Management (IPAM)'
from public.institutions i
where i.name = 'University of Sierra Leone'
on conflict (institution_id, name) do nothing;

-- 2. Faculties
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

-- 3. Departments
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

-- 4. Programmes
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

-- 5. Versioned Grading Policy
insert into public.grading_policies (institution_id, name, version, ca_weight, exam_weight, is_active)
select i.id, 'IPAM 10-Tier Scale', '2018.1', 0.30, 0.70, true
from public.institutions i
where i.name = 'University of Sierra Leone'
on conflict (institution_id, version) do update set
  name = excluded.name,
  ca_weight = excluded.ca_weight,
  exam_weight = excluded.exam_weight,
  is_active = excluded.is_active;

insert into public.grade_bands (policy_id, min_score, max_score, letter_grade, grade_point)
select
  gp.id,
  b.min_score,
  b.max_score,
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
  grade_point = excluded.grade_point;
