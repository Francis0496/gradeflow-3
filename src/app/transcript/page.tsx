import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';
import DownloadButton from './DownloadButton';

export default async function TranscriptPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const { data: rows } = await supabase
    .from('course_attempts')
    .select('credit_hours, letter_grade, grade_point, quality_points, courses(code, title)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: true });

  const items = rows ?? [];
  const attempts: AttemptResult[] = items.map((r: any) => ({
    credits: String(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));
  const gpa = attempts.length ? calculateGPA(attempts) : 0;
  const credits = attempts.reduce((s, a) => s + parseFloat(a.credits || '0'), 0);
  const name = profile?.full_name || user.email || 'Student';
  const classification = attempts.length ? getClassification(gpa) : 'No results yet';
  const pdfRows = items.map((r: any) => ({
    code: r.courses?.code ?? '—',
    title: r.courses?.title ?? '—',
    credits: Number(r.credit_hours).toFixed(1),
    letter: r.letter_grade,
    qp: Number(r.quality_points).toFixed(2),
  }));

  return (
    <Shell signedIn>
      <div className="page">
        <h1>Unofficial transcript</h1>
        <p>{name} · IPAM · CGPA {gpa.toFixed(2)} — {classification} · {credits.toFixed(1)} credits</p>
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No results yet. Add some on the Results page.</p>
        ) : (
          <div className="card">
            <table className="table">
              <thead><tr><th>Code</th><th>Title</th><th>Credits</th><th>Grade</th><th>QP</th></tr></thead>
              <tbody>
                {pdfRows.map((r, i) => (
                  <tr key={i}><td>{r.code}</td><td>{r.title}</td><td>{r.credits}</td><td>{r.letter}</td><td>{r.qp}</td></tr>
                ))}
              </tbody>
            </table>
            <DownloadButton name={name} cgpa={gpa.toFixed(2)} classification={classification} credits={credits.toFixed(1)} rows={pdfRows} />
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Unofficial preview. Official transcripts are issued by the registry.</p>
      </div>
    </Shell>
  );
}
