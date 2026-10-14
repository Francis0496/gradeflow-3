'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';

interface Row {
  semester: number;
  code: string;
  title: string;
  credits: number;
  kind: string;
  done: boolean;
}

export default function PlannerPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('programme_id, programmes(name)').eq('id', user.id).maybeSingle();
      setName((profile as any)?.programmes?.name ?? '');
      const programmeId = profile?.programme_id;
      if (!programmeId) return;
      const { data: links } = await supabase.from('programme_courses').select('semester_number, is_core, courses(code, title, credit_hours)').eq('programme_id', programmeId);
      const { data: attempts } = await supabase.from('course_attempts').select('course_id').eq('student_id', user.id);
      const done = new Set((attempts ?? []).map((a) => a.course_id));
      const mapped = (links ?? []).map((l: any) => ({
        semester: l.semester_number,
        code: l.courses?.code ?? '',
        title: l.courses?.title ?? '',
        credits: Number(l.courses?.credit_hours ?? 3),
        kind: l.is_core ? 'Core' : 'Elective',
        done: done.has(l.courses?.id),
      }));
      setRows(mapped.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)));
    })();
  }, []);

  const semesters = Array.from(new Set(rows.map((r) => r.semester)));
  const remaining = rows.filter((r) => !r.done).reduce((s, r) => s + r.credits, 0);

  return (
    <Shell signedIn>
      <div className="page">
        <h1>Study planner</h1>
        <p style={{ color: 'var(--muted)' }}>{name || 'Select a programme on Profile'} · {remaining.toFixed(1)} credits remaining</p>
        {!rows.length && <p>No catalogue for your programme yet.</p>}
        {semesters.map((s) => (
          <div key={s} className="card" style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>Semester {s}</h2>
            <table className="table">
              <thead><tr><th>Code</th><th>Title</th><th>Kind</th><th>Cr</th><th>Status</th></tr></thead>
              <tbody>
                {rows.filter((r) => r.semester === s).map((r) => (
                  <tr key={r.code}><td>{r.code}</td><td>{r.title}</td><td>{r.kind}</td><td>{r.credits.toFixed(1)}</td><td>{r.done ? 'Done' : 'Planned'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Shell>
  );
}
