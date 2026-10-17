-- Seed data for GradeFlow 3.0
-- Institution: Institute of Public Administration and Management (IPAM), University of Sierra Leone
-- Synthetic test data - no real student personal data.

-- 1. Ensure University & Campus
insert into public.institutions (id, name, short_name, country)
values ('11111111-1111-1111-1111-111111111111', 'University of Sierra Leone', 'USL', 'Sierra Leone')
on conflict (name) do update set short_name = excluded.short_name;

insert into public.campuses (id, institution_id, name)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Institute of Public Administration and Management (IPAM)')
on conflict (institution_id, name) do nothing;

-- 2. Faculties
insert into public.faculties (id, institution_id, name, is_active) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Faculty of Information Systems & Technology', true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Faculty of Accounting & Finance', false),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Faculty of Business Administration & Entrepreneurship', false),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Faculty of Leadership & Governance', false)
on conflict (name) do nothing;

-- 3. Departments
insert into public.departments (id, faculty_id, name) values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Department of Information Technology'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'Department of Information Systems'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'Department of Computer Networking')
on conflict (faculty_id, name) do nothing;

-- 4. Programmes
insert into public.programmes (id, department_id, name, duration_years, award_type) values
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'BSc. Information Technology', 4, 'honours'),
  ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442', 'BSc. Information Systems', 4, 'honours'),
  ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443', 'BSc. Computer Networking', 4, 'honours')
on conflict do nothing;

-- 5. Versioned Grading Policy
insert into public.grading_policies (id, institution_id, name, version, ca_weight, exam_weight, is_active) values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'IPAM 10-Tier Scale', '2018.1', 0.30, 0.70, true)
on conflict do nothing;

insert into public.grade_bands (policy_id, min_score, max_score, letter_grade, grade_point) values
  ('66666666-6666-6666-6666-666666666666', 70, 100, 'A', 4.00),
  ('66666666-6666-6666-6666-666666666666', 65, 69, 'B+', 3.75),
  ('66666666-6666-6666-6666-666666666666', 60, 64, 'B', 3.25),
  ('66666666-6666-6666-6666-666666666666', 55, 59, 'B-', 3.00),
  ('66666666-6666-6666-6666-666666666666', 50, 54, 'C+', 2.75),
  ('66666666-6666-6666-6666-666666666666', 45, 49, 'C', 2.50),
  ('66666666-6666-6666-6666-666666666666', 40, 44, 'C-', 2.00),
  ('66666666-6666-6666-6666-666666666666', 35, 39, 'D', 1.50),
  ('66666666-6666-6666-6666-666666666666', 30, 34, 'E', 1.00),
  ('66666666-6666-6666-6666-666666666666', 0, 29, 'F', 0.00)
on conflict do nothing;
