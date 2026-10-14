'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import { resolveAttempt, calculateGPA, getClassification, type AttemptResult } from '@/lib/academics';

interface Course { id: string; code: string; title: string; credit_hours: number; }

export default function ResultsPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [ca, setCa] = useState(25);
  const [exam, setExam] = useState(70);
  const [year, setYear] = useState('2025/2026');
  const [semester, setSemester] = useState(1);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [programmeName, setProgrammeName] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('programme_id, programmes(name)').eq('id', user.id).maybeSingle();
      const programmeId = profile?.programme_id;
      setProgrammeName((profile as any)?.programmes?.name ?? '');

      let courseRows: Course[] = [];
      if (programmeId) {
        const { data: links } = await supabase.from('programme_courses').select('course_id, courses(id, code, title, credit_hours)').eq('programme_id', programmeId);
        courseRows = (links ?? []).map((l: any) => l.courses).filter(Boolean);
        if (!courseRows.length) setMessage('No courses linked to your programme yet.');
      } else {
        const { data } = await supabase.from('courses').select('id, code, title, credit_hours').eq('is_active', true).order('code');
        courseRows = data ?? [];
        setMessage('Select a programme on Profile to filter courses.');
      }
      courseRows.sort((a, b) => a.code.localeCompare(b.code));
      setCourses(courseRows);
      if (courseRows[0]) setCourseId(courseRows[0].id);

      const { data: saved } = await supabase.from('course_attempts').select('credit_hours, letter_grade, grade_point, quality_points').eq('student_id', user.id);
      setAttempts((saved ?? []).map((r) => ({
        credits: String(r.credit_hours),
        letter: r.letter_grade,
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
    const result = resolveAttempt({ credits: Number(course.credit_hours), ca, exam });
    const { error } = await supabase.from('course_attempts').insert({
      student_id: userId,
      course_id: courseId,
      credit_hours: Number(course.credit_hours),
      ca_score: ca,
      exam_score: exam,
      total_score: result.rawTotal,
      letter_grade: result.letter,
      grade_point: result.gradePoint,
      quality_points: result.qualityPoints,
      academic_year: year,
      semester,
    });
    if (error) { setMessage(error.message); return; }
    setAttempts((prev) => [...prev, result]);
    setMessage(`Saved ${course.code}: ${result.letter} (raw ${result.rawTotal?.toFixed(2)}, rounded ${result.roundedTotal})`);
  }

  const gpa = calculateGPA(attempts);

  return (
    <Shell signedIn>
      <div className="page" style={{ maxWidth: 720 }}>
        <h1>Results</h1>
        {programmeName && <p className="pill">{programmeName}</p>}
        <form className="form card" onSubmit={onSave}>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Academic year" />
          <select value={semester} onChange={(e) => setSemester(+e.target.value)}>
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
          <label>CA (30%) <input type="number" value={ca} onChange={(e) => setCa(+e.target.value)} /></label>
          <label>Exam (70%) <input type="number" value={exam} onChange={(e) => setExam(+e.target.value)} /></label>
          <button className="btn" type="submit" disabled={!courseId}>Save result</button>
        </form>
        {message && <p>{message}</p>}
        <div className="card stat" style={{ marginTop: 16 }}>
          <label>Recorded attempts</label>
          <strong>{attempts.length}</strong>
          <p>GPA {gpa.toFixed(2)} — {attempts.length ? getClassification(gpa) : '—'}</p>
        </div>
      </div>
    </Shell>
  );
}
