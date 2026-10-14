import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';

export default async function TranscriptPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const { data: rows } = await supabase
    .from('course_attempts')
    .select('credits, letter, grade_point, quality_points, courses(code, title)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: true });

  const items = rows ?? [];
  const attempts: AttemptResult[] = items.map((r: any) => ({
    credits: String(r.credits),
    letter: r.letter,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));
  const gpa = attempts.length ? calculateGPA(attempts) : 0;
  const credits = attempts.reduce((s, a) => s + parseFloat(a.credits), 0);
  const name = profile?.full_name || user.email || 'Student';

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Unofficial Transcript</h1>
      <p>{name} · IPAM · CGPA {gpa.toFixed(2)} — {attempts.length ? getClassification(gpa) : 'No results yet'} · {credits.toFixed(1)} credits</p>
      {items.length === 0 ? (
        <p style={{ color: '#71717a' }}>No results recorded yet. Add some on the Results page.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
              <th>Code</th><th>Title</th><th>Credits</th><th>Grade</th><th>QP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td>{r.courses?.code ?? '—'}</td>
                <td>{r.courses?.title ?? '—'}</td>
                <td>{Number(r.credits).toFixed(1)}</td>
                <td>{r.letter}</td>
                <td>{Number(r.quality_points).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 16 }}>Unofficial preview. Official transcripts are issued by the registry.</p>
    </div>
  );
}
