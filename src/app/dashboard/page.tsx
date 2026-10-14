import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';
import TermSelector from './TermSelector';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const { term } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, programme_id, programmes(name)').eq('id', user.id).maybeSingle();
  const { data: rows } = await supabase.from('course_attempts').select('credit_hours, letter_grade, grade_point, quality_points, academic_year, semester').eq('student_id', user.id);

  const terms = Array.from(new Set((rows ?? []).filter((r) => r.academic_year && r.semester).map((r) => `${r.academic_year} S${r.semester}`))).sort().reverse();
  const selected = term && terms.includes(term) ? term : (terms[0] ?? '');

  const all: AttemptResult[] = (rows ?? []).map((r) => ({
    credits: String(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));
  const semesterRows = selected ? (rows ?? []).filter((r) => `${r.academic_year} S${r.semester}` === selected) : [];
  const semesterAttempts: AttemptResult[] = semesterRows.map((r) => ({
    credits: String(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  const gpa = semesterAttempts.length ? calculateGPA(semesterAttempts) : 0;
  const cgpa = all.length ? calculateGPA(all) : 0;
  const credits = all.reduce((s, a) => s + parseFloat(a.credits || '0'), 0);
  const name = profile?.full_name || user.email || 'Student';
  const programme = (profile as any)?.programmes?.name ?? 'Programme not set';

  return (
    <Shell signedIn>
      <div className="page">
        <p className="pill">Student</p>
        <h1 style={{ marginBottom: 4 }}>Welcome, {name}</h1>
        <p style={{ color: 'var(--muted)' }}>{programme}</p>
        <Suspense fallback={null}><TermSelector terms={terms} current={selected} /></Suspense>
        <div className="grid stats" style={{ marginTop: 20 }}>
          {[
            ['Semester GPA', selected ? gpa.toFixed(2) : '—'],
            ['CGPA', cgpa.toFixed(2)],
            ['Credits', credits.toFixed(1)],
            ['Standing', all.length ? getClassification(cgpa) : '—'],
          ].map(([l, v]) => (
            <div key={l} className="card stat"><label>{l}</label><strong>{v}</strong></div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{selected ? `Semester GPA for ${selected}` : 'Add a result to see semester GPA'}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <Link className="btn" href="/results">Enter result</Link>
          <Link className="btn secondary" href="/transcript">Transcript</Link>
          <Link className="btn secondary" href="/simulator">Simulator</Link>
        </div>
      </div>
    </Shell>
  );
}
