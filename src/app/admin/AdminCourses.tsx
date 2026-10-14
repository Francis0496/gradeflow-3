'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Course { id: string; code: string; title: string; credits: number; is_active?: boolean | null; }
interface Programme { id: string; name: string; }
interface Link { programme_id: string; course_id: string; }

export default function AdminCourses({
  initialCourses,
  programmes,
  initialLinks,
}: {
  initialCourses: Course[];
  programmes: Programme[];
  initialLinks: Link[];
}) {
  const supabase = createClient();
  const [courses, setCourses] = useState(initialCourses.map((c) => ({ ...c, is_active: c.is_active !== false })));
  const [links, setLinks] = useState(initialLinks);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(3);
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? '');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [message, setMessage] = useState('');

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const { data, error } = await supabase.from('courses').insert({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      credits,
      is_active: true,
    }).select('id, code, title, credits, is_active').single();
    if (error) { setMessage(error.message); return; }
    if (data) setCourses((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
    setCode(''); setTitle(''); setCredits(3);
    setMessage(`Added ${data?.code}`);
  }

  async function onLink(e: React.FormEvent) {
    e.preventDefault();
    if (!programmeId || !courseId) return;
    setMessage('');
    const { error } = await supabase.from('programme_courses').upsert({ programme_id: programmeId, course_id: courseId });
    if (error) { setMessage(error.message); return; }
    setLinks((prev) => {
      const exists = prev.some((l) => l.programme_id === programmeId && l.course_id === courseId);
      return exists ? prev : [...prev, { programme_id: programmeId, course_id: courseId }];
    });
    setMessage('Course linked to programme');
  }

  async function onUnlink(programme_id: string, course_id: string) {
    const { error } = await supabase.from('programme_courses').delete().eq('programme_id', programme_id).eq('course_id', course_id);
    if (error) { setMessage(error.message); return; }
    setLinks((prev) => prev.filter((l) => !(l.programme_id === programme_id && l.course_id === course_id)));
    setMessage('Unlinked');
  }

  return (
    <div style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Admin — Courses & Programmes</h1>

      <h2 style={{ fontSize: 18 }}>Add course</h2>
      <form onSubmit={onAdd} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <input placeholder="Code" required value={code} onChange={(e) => setCode(e.target.value)} style={{ padding: 10 }} />
        <input placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 10 }} />
        <input type="number" step="0.5" min="0.5" value={credits} onChange={(e) => setCredits(+e.target.value)} style={{ padding: 10 }} />
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Add course</button>
      </form>

      <h2 style={{ fontSize: 18 }}>Link course to programme</h2>
      <form onSubmit={onLink} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} style={{ padding: 10 }}>
          {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={{ padding: 10 }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Link</button>
      </form>

      {message && <p>{message}</p>}

      <h2 style={{ fontSize: 18 }}>Current links</h2>
      {programmes.map((p) => {
        const linked = links.filter((l) => l.programme_id === p.id);
        return (
          <div key={p.id} style={{ marginBottom: 16 }}>
            <strong>{p.name}</strong>
            {linked.length === 0 && <p style={{ color: '#71717a', margin: '4px 0' }}>No courses linked</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {linked.map((l) => {
                const course = courses.find((c) => c.id === l.course_id);
                return (
                  <li key={l.course_id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', padding: '4px 0' }}>
                    <span>{course ? `${course.code} — ${course.title}` : l.course_id}</span>
                    <button type="button" onClick={() => onUnlink(p.id, l.course_id)} style={{ padding: '2px 8px' }}>Unlink</button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
