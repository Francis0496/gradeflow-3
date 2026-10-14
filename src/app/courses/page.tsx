import { createServerSupabaseClient } from '@/lib/supabase/client';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: links, error } = await supabase
    .from('programme_courses')
    .select('year, semester, kind, programmes(name), courses(code, title, credits)')
    .order('year');

  const rows = (links ?? []).map((l: any) => ({
    programme: l.programmes?.name ?? '—',
    year: l.year,
    semester: l.semester,
    kind: l.kind,
    code: l.courses?.code ?? '—',
    title: l.courses?.title ?? '—',
    credits: Number(l.courses?.credits ?? 3).toFixed(1),
  }));

  return (
    <div style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Course catalogue</h1>
      <p style={{ color: '#52525b' }}>Faculty of Information Systems & Technology · {rows.length} programme-course links · Semester 1</p>
      {error && <p style={{ color: '#b91c1c' }}>{error.message}</p>}
      {!rows.length && !error && <p style={{ color: '#71717a' }}>No catalogue rows. Run the structure seed in Supabase.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
            <th>Programme</th><th>Y</th><th>S</th><th>Code</th><th>Title</th><th>Kind</th><th>Cr</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f4f4f5' }}>
              <td>{r.programme}</td><td>{r.year}</td><td>{r.semester}</td><td>{r.code}</td><td>{r.title}</td><td>{r.kind}</td><td>{r.credits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
