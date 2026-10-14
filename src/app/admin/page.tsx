import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import AdminCourses from './AdminCourses';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: role } = await supabase.from('role_assignments').select('role').eq('user_id', user.id).maybeSingle();
  if (role?.role !== 'admin' && role?.role !== 'institution_admin') {
    return (
      <Shell signedIn>
        <div className="page"><h1>Admin</h1><p className="error">Admin role required.</p></div>
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
