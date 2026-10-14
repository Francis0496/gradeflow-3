'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveAttempt, calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';

interface Course { id: string; code: string; title: string; credits: number; }

export default function ResultsPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [ca, setCa] = useState(25);
  const [exam, setExam] = useState(70);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: courseRows } = await supabase.from('courses').select('id, code, title, credits').order('code');
      setCourses(courseRows ?? []);
      if (courseRows?.[0]) setCourseId(courseRows[0].id);
      const { data: saved } = await supabase.from('course_attempts').select('credits, letter, grade_point, quality_points').eq('student_id', user.id);
      setAttempts((saved ?? []).map((r) => ({
        credits: String(r.credits),
        letter: r.letter,
        gradePoint: Number(r.grade_point),
        qualityPoints: Number(r.quality_points),
      })));
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !courseId) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const result = resolveAttempt({ credits: Number(course.credits), ca, exam });
    const { error } = await supabase.from('course_attempts').insert({
      student_id: userId,
      course_id: courseId,
      credits: Number(course.credits),
      ca_score: ca,
      exam_score: exam,
      letter: result.letter,
      grade_point: result.gradePoint,
      quality_points: result.qualityPoints,
    });
    if (error) { setMessage(error.message); return; }
    setAttempts((prev) => [...prev, result]);
    setMessage(`Saved ${course.code}: ${result.letter}`);
  }

  const gpa = calculateGPA(attempts);

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Results</h1>
      <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={{ padding: 10 }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
        <label>CA (30%) <input type="number" value={ca} onChange={(e) => setCa(+e.target.value)} /></label>
        <label>Exam (70%) <input type="number" value={exam} onChange={(e) => setExam(+e.target.value)} /></label>
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Save result</button>
      </form>
      {message && <p>{message}</p>}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
        <p>Recorded attempts: {attempts.length}</p>
        <p>GPA: {gpa.toFixed(2)} — {getClassification(gpa)}</p>
      </div>
    </div>
  );
}
