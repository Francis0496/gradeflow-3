'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Course { id: string; code: string; title: string; credit_hours: number; is_active?: boolean | null; }
interface Programme { id: string; name: string; }
interface Link { programme_id: string; course_id: string; semester_number?: number; is_core?: boolean; }

export default function AdminCourses({ initialCourses, programmes, initialLinks }: { initialCourses: Course[]; programmes: Programme[]; initialLinks: Link[]; }) {
  const supabase = createClient();
  const [courses, setCourses] = useState(initialCourses.map((c) => ({ ...c, is_active: c.is_active !== false })));
  const [links, setLinks] = useState(initialLinks);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(3);
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? '');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [semester, setSemester] = useState(1);
  const [isCore, setIsCore] = useState(true);
  const [copyTo, setCopyTo] = useState(programmes[1]?.id ?? '');
  const [message, setMessage] = useState('');

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from('courses').insert({
      code: code.trim().toUpperCase(), title: title.trim(), credit_hours: credits, is_active: true,
    }).select('id, code, title, credit_hours, is_active').single();
    if (error) { setMessage(error.message); return; }
    if (data) setCourses((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
    setCode(''); setTitle(''); setCredits(3);
    setMessage(`Added ${data?.code}`);
  }

  async function onLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('programme_courses').upsert({
      programme_id: programmeId, course_id: courseId, semester_number: semester, is_core: isCore,
    }, { onConflict: 'programme_id,course_id,semester_number' });
    if (error) { setMessage(error.message); return; }
    setLinks((prev) => [...prev, { programme_id: programmeId, course_id: courseId, semester_number: semester, is_core: isCore }]);
    setMessage('Course linked');
  }

  async function onCopy() {
    if (!courseId || !copyTo) return;
    const { error } = await supabase.from('programme_courses').upsert({
      programme_id: copyTo, course_id: courseId, semester_number: semester, is_core: isCore,
    }, { onConflict: 'programme_id,course_id,semester_number' });
    if (error) { setMessage(error.message); return; }
    setLinks((prev) => [...prev, { programme_id: copyTo, course_id: courseId, semester_number: semester, is_core: isCore }]);
    setMessage('Copied to programme');
  }

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from('courses').update({ is_active: !active }).eq('id', id);
    if (error) { setMessage(error.message); return; }
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !active } : c));
  }

  return (
    <div className="page">
      <h1>Admin catalogue</h1>
      <form className="form card" onSubmit={onAdd}>
        <h2>Add course</h2>
        <input placeholder="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
        <input placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="number" step="0.5" min="0.5" value={credits} onChange={(e) => setCredits(+e.target.value)} />
        <button className="btn" type="submit">Add course</button>
      </form>
      <form className="form card" onSubmit={onLink} style={{ marginTop: 16 }}>
        <h2>Link or copy</h2>
        <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)}>{programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}</select>
        <input type="number" min={1} max={8} value={semester} onChange={(e) => setSemester(+e.target.value)} />
        <label><input type="checkbox" checked={isCore} onChange={(e) => setIsCore(e.target.checked)} /> Core</label>
        <button className="btn" type="submit">Link</button>
        <select value={copyTo} onChange={(e) => setCopyTo(e.target.value)}>{programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="btn secondary" type="button" onClick={onCopy}>Copy to programme</button>
      </form>
      {message && <p>{message}</p>}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Courses</h2>
        {courses.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span>{c.code} — {c.title} ({Number(c.credit_hours).toFixed(1)})</span>
            <button type="button" onClick={() => toggle(c.id, Boolean(c.is_active))}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
