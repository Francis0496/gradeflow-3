import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import AdminCourses from './AdminCourses';
import ClaimAdmin from './ClaimAdmin';
import { Shield, ShieldAlert, User, Info } from 'lucide-react';

const ADMIN_ROLES = [
  'admin',
  'institution_admin',
  'platform_admin',
  'department_admin',
  'registry_officer',
];

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: roles, error } = await supabase
    .from('role_assignments')
    .select('role')
    .eq('user_id', user.id);

  const roleList = (roles ?? []).map((r) => r.role);
  const allowed = roleList.some((r) => ADMIN_ROLES.includes(r));

  if (!allowed) {
    return (
      <Shell signedIn userEmail={user.email}>
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
                <span className="font-semibold text-slate-900">{user.email}</span>
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

  return (
    <Shell signedIn userEmail={user.email}>
      <AdminCourses
        initialCourses={courses ?? []}
        programmes={programmes ?? []}
        initialLinks={links ?? []}
        faculties={(faculties as any) ?? []}
        auditLogs={(auditLogs as any) ?? []}
      />
    </Shell>
  );
}
