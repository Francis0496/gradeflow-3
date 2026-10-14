import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: links, error } = await supabase
    .from('programme_courses')
    .select('semester_number, is_core, programmes(name), courses(code, title, credit_hours)')
    .order('semester_number');

  const rows = (links ?? []).map((l: any) => ({
    programme: l.programmes?.name ?? '—',
    semester: l.semester_number,
    kind: l.is_core ? 'Core' : 'Elective',
    code: l.courses?.code ?? '—',
    title: l.courses?.title ?? '—',
    credits: Number(l.courses?.credit_hours ?? 3).toFixed(1),
  }));

  return (
    <Shell>
      <div className="page">
        <h1>Course catalogue</h1>
        <p style={{ color: 'var(--muted)' }}>Faculty of Information Systems & Technology · {rows.length} links · Semester 1</p>
        {error && <p className="error">{error.message}</p>}
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Programme</th><th>Sem</th><th>Code</th><th>Title</th><th>Kind</th><th>Cr</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}><td>{r.programme}</td><td>{r.semester}</td><td>{r.code}</td><td>{r.title}</td><td>{r.kind}</td><td>{r.credits}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
