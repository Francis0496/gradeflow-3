import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, programme_id, programmes(name)').eq('id', user.id).maybeSingle();
  const { data: rows } = await supabase.from('course_attempts').select('credits, letter, grade_point, quality_points, created_at').eq('student_id', user.id).order('created_at', { ascending: false });

  const all: AttemptResult[] = (rows ?? []).map((r) => ({
    credits: String(r.credits),
    letter: r.letter,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));
  const latest = rows?.[0]?.created_at ? new Date(rows[0].created_at) : null;
  const semesterRows = latest
    ? (rows ?? []).filter((r) => {
        const d = new Date(r.created_at);
        return d.getFullYear() === latest.getFullYear() && Math.floor(d.getMonth() / 6) === Math.floor(latest.getMonth() / 6);
      })
    : [];
  const semester: AttemptResult[] = semesterRows.map((r) => ({
    credits: String(r.credits),
    letter: r.letter,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  const gpa = semester.length ? calculateGPA(semester) : 0;
  const cgpa = all.length ? calculateGPA(all) : 0;
  const credits = all.reduce((s, a) => s + parseFloat(a.credits), 0);
  const name = profile?.full_name || user.email || 'Student';
  const programme = (profile as any)?.programmes?.name ?? 'Programme not set';

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#52525b' }}>Welcome, {name} · {programme}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 24 }}>
        {[['Semester GPA', gpa.toFixed(2)], ['CGPA', cgpa.toFixed(2)], ['Credits', credits.toFixed(1)], ['Standing', all.length ? getClassification(cgpa) : '—']].map(([l, v]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#71717a' }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <nav style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/profile">Profile</Link>
        <Link href="/results">Results</Link>
        <Link href="/simulator">Simulator</Link>
        <Link href="/transcript">Transcript</Link>
        <Link href="/courses">Courses</Link>
        <form action="/auth/signout" method="post"><button type="submit" style={{ background: 'none', border: 0, color: '#b91c1c', cursor: 'pointer' }}>Sign out</button></form>
      </nav>
    </div>
  );
}
