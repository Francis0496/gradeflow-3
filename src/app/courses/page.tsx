import { createServerSupabaseClient } from '@/lib/supabase/client';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: courses, error } = await supabase
    .from('courses')
    .select('code, title, credits')
    .order('code');

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Course catalogue</h1>
      <p style={{ color: '#52525b' }}>Faculty of Information Systems & Technology · {courses?.length ?? 0} courses</p>
      {error && <p style={{ color: '#b91c1c' }}>{error.message}</p>}
      {!courses?.length && !error && <p style={{ color: '#71717a' }}>No courses found. Confirm the seed was applied and RLS allows read.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(courses ?? []).map((c) => (
          <li key={c.code} style={{ borderBottom: '1px solid #e4e4e7', padding: '0.75rem 0' }}>
            <strong>{c.code}</strong> — {c.title} ({Number(c.credits).toFixed(1)})
          </li>
        ))}
      </ul>
    </div>
  );
}
