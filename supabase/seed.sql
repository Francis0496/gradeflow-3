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
insert into public.institutions (id, name, short_name, country)
values ('11111111-1111-1111-1111-111111111111', 'University of Sierra Leone', 'USL', 'Sierra Leone')
on conflict (id) do update set name = excluded.name, short_name = excluded.short_name;

insert into public.campuses (id, institution_id, name)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Institute of Public Administration and Management (IPAM)')
on conflict (id) do update set name = excluded.name;

-- 2. Faculties
insert into public.faculties (id, institution_id, name, is_active) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Faculty of Information Systems & Technology', true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Faculty of Accounting & Finance', false),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Faculty of Business Administration & Entrepreneurship', false),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Faculty of Leadership & Governance', false)
on conflict (id) do update set name = excluded.name, is_active = excluded.is_active;

-- 3. Departments
insert into public.departments (id, faculty_id, name) values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Department of Information Technology'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'Department of Information Systems'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'Department of Computer Networking')
on conflict (id) do update set name = excluded.name;

-- 4. Programmes
insert into public.programmes (id, department_id, name, duration_years, award_type) values
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'BSc. Information Technology', 4, 'honours'),
  ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442', 'BSc. Information Systems', 4, 'honours'),
  ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443', 'BSc. Computer Networking', 4, 'honours')
on conflict (id) do update set name = excluded.name, duration_years = excluded.duration_years, award_type = excluded.award_type;

-- 5. Versioned Grading Policy
insert into public.grading_policies (id, institution_id, name, version, ca_weight, exam_weight, is_active) values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'IPAM 10-Tier Scale', '2018.1', 0.30, 0.70, true)
on conflict (id) do update set name = excluded.name, version = excluded.version;

insert into public.grade_bands (id, policy_id, min_score, max_score, letter_grade, grade_point) values
  ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666666', 70, 100, 'A', 4.00),
  ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666666', 65, 69, 'B+', 3.75),
  ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666666', 60, 64, 'B', 3.25),
  ('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666666', 55, 59, 'B-', 3.00),
  ('77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666666', 50, 54, 'C+', 2.75),
  ('77777777-7777-7777-7777-777777777776', '66666666-6666-6666-6666-666666666666', 45, 49, 'C', 2.50),
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 40, 44, 'C-', 2.00),
  ('77777777-7777-7777-7777-777777777778', '66666666-6666-6666-6666-666666666666', 35, 39, 'D', 1.50),
  ('77777777-7777-7777-7777-777777777779', '66666666-6666-6666-6666-666666666666', 30, 34, 'E', 1.00),
  ('77777777-7777-7777-7777-777777777770', '66666666-6666-6666-6666-666666666666', 0, 29, 'F', 0.00)
on conflict (id) do update set
  min_score = excluded.min_score,
  max_score = excluded.max_score,
  letter_grade = excluded.letter_grade,
  grade_point = excluded.grade_point;
