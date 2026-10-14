'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Course { id: string; code: string; title: string; credits: number; }

export default function AdminCourses({ initialCourses }: { initialCourses: Course[] }) {
  const supabase = createClient();
  const [courses, setCourses] = useState(initialCourses);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(3);
  const [message, setMessage] = useState('');

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const { data, error } = await supabase.from('courses').insert({ code: code.trim().toUpperCase(), title: title.trim(), credits }).select('id, code, title, credits').single();
    if (error) { setMessage(error.message); return; }
    if (data) setCourses((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
    setCode(''); setTitle(''); setCredits(3);
    setMessage(`Added ${data?.code}`);
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
          <li key={c.id} style={{ borderBottom: '1px solid #e4e4e7', padding: '0.6rem 0' }}>
            <strong>{c.code}</strong> — {c.title} ({Number(c.credits).toFixed(1)})
          </li>
        ))}
      </ul>
    </div>
  );
}
