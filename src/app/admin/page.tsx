import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import AdminCourses from './AdminCourses';

const ADMIN_ROLES = ['admin', 'institution_admin', 'platform_admin', 'department_admin', 'registry_officer'];

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: roles, error } = await supabase.from('role_assignments').select('role').eq('user_id', user.id);
  const roleList = (roles ?? []).map((r) => r.role);
  const allowed = roleList.some((r) => ADMIN_ROLES.includes(r));

  if (!allowed) {
    return (
      <Shell signedIn>
        <div className="page">
          <h1>Admin</h1>
          <p className="error">Admin role required.</p>
          <p>Signed in as <strong>{user.email}</strong></p>
          <p>Roles found: {roleList.length ? roleList.join(', ') : 'none'}</p>
          {error && <p className="error">{error.message}</p>}
          <p>In Supabase SQL Editor, run:</p>
          <pre style={{ background: '#fff', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{`insert into public.role_assignments (user_id, role)
select id, 'institution_admin' from auth.users
where email = '${user.email}';`}</pre>
        </div>
      </Shell>
    );
  }

  const { data: courses } = await supabase.from('courses').select('id, code, title, credit_hours, is_active').order('code');
  const { data: programmes } = await supabase.from('programmes').select('id, name').order('name');
  const { data: links } = await supabase.from('programme_courses').select('programme_id, course_id, semester_number, is_core');

  return (
    <Shell signedIn>
      <AdminCourses initialCourses={courses ?? []} programmes={programmes ?? []} initialLinks={links ?? []} />
    </Shell>
  );
}
