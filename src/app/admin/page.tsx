import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import AdminCourses from './AdminCourses';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: role } = await supabase.from('role_assignments').select('role').eq('user_id', user.id).maybeSingle();
  if (role?.role !== 'admin' && role?.role !== 'institution_admin') {
    return (
      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1>Admin</h1>
        <p style={{ color: '#b91c1c' }}>Admin role required. Ask an institution admin to assign the admin role.</p>
      </div>
    );
  }

  const { data: courses } = await supabase.from('courses').select('id, code, title, credits, is_active').order('code');
  return <AdminCourses initialCourses={courses ?? []} />;
}
