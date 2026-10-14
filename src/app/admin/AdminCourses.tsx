'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Course { id: string; code: string; title: string; credits: number; is_active?: boolean | null; }

export default function AdminCourses({ initialCourses }: { initialCourses: Course[] }) {
  const supabase = createClient();
  const [courses, setCourses] = useState(initialCourses.map((c) => ({ ...c, is_active: c.is_active !== false })));
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(3);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCredits, setEditCredits] = useState(3);
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

  async function onSaveEdit(id: string) {
    setMessage('');
    const { error } = await supabase.from('courses').update({ title: editTitle.trim(), credits: editCredits }).eq('id', id);
    if (error) { setMessage(error.message); return; }
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, title: editTitle.trim(), credits: editCredits } : c));
    setEditing(null);
    setMessage('Course updated');
  }

  async function onToggle(id: string, next: boolean) {
    setMessage('');
    const { error } = await supabase.from('courses').update({ is_active: next }).eq('id', id);
    if (error) { setMessage(error.message); return; }
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, is_active: next } : c));
    setMessage(next ? 'Course activated' : 'Course deactivated');
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Admin — Courses</h1>
      <form onSubmit={onAdd} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <input placeholder="Code (e.g. DAA112)" required value={code} onChange={(e) => setCode(e.target.value)} style={{ padding: 10 }} />
        <input placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 10 }} />
        <input type="number" step="0.5" min="0.5" value={credits} onChange={(e) => setCredits(+e.target.value)} style={{ padding: 10 }} />
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Add course</button>
      </form>
      {message && <p>{message}</p>}
      <p style={{ color: '#52525b' }}>{courses.length} courses</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {courses.map((c) => (
          <li key={c.id} style={{ borderBottom: '1px solid #e4e4e7', padding: '0.6rem 0', opacity: c.is_active ? 1 : 0.5 }}>
            {editing === c.id ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <strong>{c.code}</strong>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ padding: 8 }} />
                <input type="number" step="0.5" value={editCredits} onChange={(e) => setEditCredits(+e.target.value)} style={{ padding: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => onSaveEdit(c.id)} style={{ background: '#1d4ed8', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 4 }}>Save</button>
                  <button type="button" onClick={() => setEditing(null)} style={{ padding: '6px 10px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><strong>{c.code}</strong> — {c.title} ({Number(c.credits).toFixed(1)}) {!c.is_active && <em>(inactive)</em>}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => { setEditing(c.id); setEditTitle(c.title); setEditCredits(Number(c.credits)); }} style={{ padding: '4px 8px' }}>Edit</button>
                  <button type="button" onClick={() => onToggle(c.id, !c.is_active)} style={{ padding: '4px 8px' }}>{c.is_active ? 'Deactivate' : 'Activate'}</button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
