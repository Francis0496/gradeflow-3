import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import AdminCourses from './AdminCourses';
import ClaimAdmin from './ClaimAdmin';
import { ShieldAlert, AlertCircle, Database, ExternalLink } from 'lucide-react';

const ADMIN_ROLES = [
  'admin',
  'institution_admin',
  'platform_admin',
  'department_admin',
  'registry_officer',
];

const DEFAULT_PROGRAMMES = [
  { id: '55555555-5555-5555-5555-555555555551', name: 'BSc. Information Technology' },
  { id: '55555555-5555-5555-5555-555555555552', name: 'BSc. Information Systems' },
  { id: '55555555-5555-5555-5555-555555555553', name: 'BSc. Computer Networking' },
];

const DEFAULT_COURSES = [
  { id: 'c1', code: 'DIT111', title: 'Introduction to Computing & Information Technology', credit_hours: 3.0, is_active: true },
  { id: 'c2', code: 'DIT112', title: 'Programming Fundamentals in C', credit_hours: 3.0, is_active: true },
  { id: 'c3', code: 'MAT111', title: 'Discrete Mathematics for Computing', credit_hours: 3.0, is_active: true },
  { id: 'c4', code: 'DIT121', title: 'Data Structures & Algorithms Analysis', credit_hours: 3.0, is_active: true },
  { id: 'c5', code: 'DIT211', title: 'Data Communications & Computer Networking 1', credit_hours: 3.0, is_active: true },
  { id: 'c6', code: 'DIS211', title: 'Web Design, Technologies & Standards', credit_hours: 3.0, is_active: true },
  { id: 'c7', code: 'DIS212', title: 'Database Systems Design & SQL 1', credit_hours: 3.0, is_active: true },
];

const DEFAULT_LINKS = [
  { programme_id: '55555555-5555-5555-5555-555555555551', course_id: 'c1', semester_number: 1, is_core: true },
  { programme_id: '55555555-5555-5555-5555-555555555551', course_id: 'c2', semester_number: 1, is_core: true },
  { programme_id: '55555555-5555-5555-5555-555555555551', course_id: 'c3', semester_number: 1, is_core: true },
  { programme_id: '55555555-5555-5555-5555-555555555551', course_id: 'c4', semester_number: 2, is_core: true },
  { programme_id: '55555555-5555-5555-5555-555555555551', course_id: 'c5', semester_number: 3, is_core: true },
];

const DEFAULT_FACULTIES = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    name: 'Faculty of Information Systems & Technology',
    is_active: true,
    departments: [
      {
        id: '44444444-4444-4444-4444-444444444441',
        name: 'Department of Information Technology',
        programmes: [{ id: '55555555-5555-5555-5555-555555555551', name: 'BSc. Information Technology' }],
      },
      {
        id: '44444444-4444-4444-4444-444444444442',
        name: 'Department of Information Systems',
        programmes: [{ id: '55555555-5555-5555-5555-555555555552', name: 'BSc. Information Systems' }],
      },
      {
        id: '44444444-4444-4444-4444-444444444443',
        name: 'Department of Computer Networking',
        programmes: [{ id: '55555555-5555-5555-5555-555555555553', name: 'BSc. Computer Networking' }],
      },
    ],
  },
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'a1',
    action: 'bootstrap_system_ready',
    entity_type: 'platform',
    entity_id: 'USL-IPAM-FIST',
    details: { event: 'GradeFlow 3.0 Academic Governance Console ready' },
    created_at: new Date().toISOString(),
  },
];

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isDemoAdmin = cookieStore.get('gf_demo_admin')?.value === 'true';

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated and not demo admin, redirect to login
  if (!user && !isDemoAdmin) {
    redirect('/login?next=/admin');
  }

  let roleList: string[] = [];
  if (user) {
    const { data: roles } = await supabase
      .from('role_assignments')
      .select('role')
      .eq('user_id', user.id);
    roleList = (roles ?? []).map((r) => r.role);
  }

  const allowed = isDemoAdmin || roleList.some((r) => ADMIN_ROLES.includes(r));

  if (!allowed) {
    return (
      <Shell signedIn userEmail={user?.email || 'admin@ipam.edu.sl'}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Administrative Access Required</h1>
                <p className="text-xs text-slate-500">
                  This console is restricted to university registry officers and system administrators.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Signed In Account:</span>
                <span className="font-semibold text-slate-900">{user?.email ?? 'Unauthenticated'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Roles:</span>
                <span className="font-semibold text-slate-900">
                  {roleList.length ? roleList.join(', ') : 'Student (default)'}
                </span>
              </div>
            </div>

            <ClaimAdmin />
          </div>
        </div>
      </Shell>
    );
  }

  // Load database courses and structure (with fallback if tables not yet migrated in Supabase)
  const { data: courses } = await supabase
    .from('courses')
    .select('id, code, title, credit_hours, is_active')
    .order('code');

  const { data: programmes } = await supabase
    .from('programmes')
    .select('id, name')
    .order('name');

  const { data: links } = await supabase
    .from('programme_courses')
    .select('programme_id, course_id, semester_number, is_core');

  const { data: faculties } = await supabase
    .from('faculties')
    .select('id, name, is_active, departments(id, name, programmes(id, name))')
    .order('name');

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const isDatabaseUnseeded = !courses || courses.length === 0;

  return (
    <Shell signedIn userEmail={user?.email || 'admin@ipam.edu.sl'}>
      {isDatabaseUnseeded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Database Schema Not Yet Seeded in Supabase</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Showing default IPAM curriculum catalogue in preview mode. Run <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[11px]">COMPLETE_SYSTEM_BOOTSTRAP.sql</code> in your Supabase SQL Editor to enable live database persistence.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/api/bootstrap-sql"
                download="COMPLETE_SYSTEM_BOOTSTRAP.sql"
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
              >
                Download SQL
              </a>
              <a
                href="https://supabase.com/dashboard/project/yaiqyxvuqssbnfmxrykh/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <span>Open SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      <AdminCourses
        initialCourses={courses?.length ? courses : DEFAULT_COURSES}
        programmes={programmes?.length ? programmes : DEFAULT_PROGRAMMES}
        initialLinks={links?.length ? links : DEFAULT_LINKS}
        faculties={faculties?.length ? (faculties as any) : DEFAULT_FACULTIES}
        auditLogs={auditLogs?.length ? (auditLogs as any) : DEFAULT_AUDIT_LOGS}
      />
    </Shell>
  );
}
