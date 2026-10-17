'use client';
import { useEffect, useState, useMemo } from 'react';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import {
  resolveAttempt,
  calculateGPA,
  formatCredits,
  formatGPA,
  getClassification,
  type AttemptResult,
} from '@/lib/academics';
import {
  FileSpreadsheet,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
}

const DEMO_COURSES: Course[] = [
  { id: 'c1', code: 'DIT111', title: 'Introduction to Computing', credit_hours: 3.0 },
  { id: 'c2', code: 'DIT112', title: 'Programming Fundamentals in C', credit_hours: 3.0 },
  { id: 'c3', code: 'MAT111', title: 'Discrete Mathematics', credit_hours: 3.0 },
  { id: 'c4', code: 'DIT121', title: 'Data Structures and Algorithms', credit_hours: 3.0 },
  { id: 'c5', code: 'DIT211', title: 'Computer Networking 1', credit_hours: 3.0 },
];

const DEMO_ATTEMPTS = [
  {
    id: 'att-1',
    course_id: 'c1',
    credit_hours: 3.0,
    ca_score: 28,
    exam_score: 65,
    total_score: 93,
    raw_total: 93,
    rounded_total: 93,
    letter_grade: 'A',
    grade_point: 4.0,
    quality_points: 12.0,
    academic_year: '2025/2026',
    semester: 1,
    is_verified: true,
    courses: { code: 'DIT111', title: 'Introduction to Computing' },
  },
  {
    id: 'att-2',
    course_id: 'c2',
    credit_hours: 3.0,
    ca_score: 24,
    exam_score: 58,
    total_score: 82,
    raw_total: 82,
    rounded_total: 82,
    letter_grade: 'A',
    grade_point: 4.0,
    quality_points: 12.0,
    academic_year: '2025/2026',
    semester: 1,
    is_verified: true,
    courses: { code: 'DIT112', title: 'Programming Fundamentals in C' },
  },
  {
    id: 'att-3',
    course_id: 'c3',
    credit_hours: 3.0,
    ca_score: 20,
    exam_score: 48,
    total_score: 68,
    raw_total: 68,
    rounded_total: 68,
    letter_grade: 'B+',
    grade_point: 3.75,
    quality_points: 11.25,
    academic_year: '2025/2026',
    semester: 1,
    is_verified: true,
    courses: { code: 'MAT111', title: 'Discrete Mathematics' },
  },
];

export default function ResultsPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [courseId, setCourseId] = useState('c1');
  const [entryMode, setEntryMode] = useState<'ca_exam' | 'total_score' | 'letter'>('ca_exam');
  const [ca, setCa] = useState<number>(25);
  const [exam, setExam] = useState<number>(70);
  const [totalScoreInput, setTotalScoreInput] = useState<number>(75);
  const [directLetter, setDirectLetter] = useState<string>('A');
  const [year, setYear] = useState('2025/2026');
  const [semester, setSemester] = useState(1);
  const [attempts, setAttempts] = useState<any[]>(DEMO_ATTEMPTS);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [programmeName, setProgrammeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('programme_id, programmes(name)')
        .eq('id', user.id)
        .maybeSingle();

      const programmeId = profile?.programme_id;
      setProgrammeName((profile as any)?.programmes?.name ?? '');

      let courseRows: Course[] = [];
      if (programmeId) {
        const { data: links } = await supabase
          .from('programme_courses')
          .select('course_id, courses(id, code, title, credit_hours)')
          .eq('programme_id', programmeId);
        courseRows = (links ?? []).map((l: any) => l.courses).filter(Boolean);
      }

      if (!courseRows.length) {
        const { data } = await supabase
          .from('courses')
          .select('id, code, title, credit_hours')
          .eq('is_active', true)
          .order('code');
        courseRows = data ?? [];
      }

      courseRows.sort((a, b) => a.code.localeCompare(b.code));
      setCourses(courseRows);
      if (courseRows[0]) setCourseId(courseRows[0].id);

      // Load saved attempts
      const { data: saved } = await supabase
        .from('course_attempts')
        .select('id, course_id, credit_hours, ca_score, exam_score, total_score, raw_total, rounded_total, letter_grade, grade_point, quality_points, academic_year, semester, is_verified, courses(code, title)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (saved && saved.length > 0) {
        setAttempts(saved);
      }
    })();
  }, []);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const currentCredits = selectedCourse ? Number(selectedCourse.credit_hours) : 3.0;

  // Real-time calculation preview
  const livePreview = useMemo(() => {
    try {
      if (entryMode === 'letter') {
        return resolveAttempt({ credits: currentCredits, letter: directLetter });
      } else if (entryMode === 'total_score') {
        return resolveAttempt({ credits: currentCredits, totalScore: Number(totalScoreInput) });
      } else {
        return resolveAttempt({ credits: currentCredits, ca: Number(ca), exam: Number(exam) });
      }
    } catch {
      return null;
    }
  }, [entryMode, directLetter, totalScoreInput, ca, exam, currentCredits]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !selectedCourse || !livePreview) return;
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      student_id: userId,
      course_id: selectedCourse.id,
      credit_hours: currentCredits,
      ca_score: entryMode === 'ca_exam' ? ca : null,
      exam_score: entryMode === 'ca_exam' ? exam : null,
      total_score: livePreview.rawTotal ?? null,
      raw_total: livePreview.rawTotal ?? null,
      rounded_total: livePreview.roundedTotal ?? null,
      letter_grade: livePreview.letter,
      grade_point: livePreview.gradePoint,
      quality_points: livePreview.qualityPoints,
      academic_year: year,
      semester,
    };

    const { data, error } = await supabase
      .from('course_attempts')
      .insert(payload)
      .select('id, course_id, credit_hours, ca_score, exam_score, total_score, raw_total, rounded_total, letter_grade, grade_point, quality_points, academic_year, semester, is_verified, courses(code, title)')
      .single();

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    if (data) {
      setAttempts((prev) => [data, ...prev]);
      setMessage({
        type: 'success',
        text: `Recorded ${selectedCourse.code} (${selectedCourse.title}): Grade ${livePreview.letter} (${livePreview.qualityPoints.toFixed(2)} QP)`,
      });
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Are you sure you want to remove this attempt?')) return;
    const { error } = await supabase.from('course_attempts').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setAttempts((prev) => prev.filter((a) => a.id !== id));
    setMessage({ type: 'info', text: 'Course attempt removed.' });
  }

  // Calculate cumulative GPA across saved attempts
  const allAttemptResults: AttemptResult[] = attempts.map((r) => ({
    credits: formatCredits(r.credit_hours),
    creditHours: Number(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  const overallGpa = allAttemptResults.length ? calculateGPA(allAttemptResults) : 0;
  const totalEarnedCredits = allAttemptResults.reduce((s, a) => s + a.creditHours, 0);

  return (
    <Shell signedIn>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="pill">Academic Records</span>
              {programmeName && (
                <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
                  {programmeName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Record Course Results
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter Continuous Assessment and Examination marks using IPAM official 10-tier grading.
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Cumulative GPA</p>
              <p className="text-xl font-black text-blue-700">{formatGPA(overallGpa)}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Credits</p>
              <p className="text-xl font-black text-slate-900">{formatCredits(totalEarnedCredits)}</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {message.type === 'info' && <Sparkles className="w-5 h-5 text-blue-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Two-Column Grid: Form + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Marks Entry Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              New Result Entry
            </h2>

            <form onSubmit={onSave} className="space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Course from Catalogue
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title} ({formatCredits(c.credit_hours)} Credits)
                    </option>
                  ))}
                </select>
              </div>

              {/* Year & Semester Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2025/2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              {/* Entry Mode Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Grading Input Mode
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEntryMode('ca_exam')}
                    className={`py-2 rounded-lg transition-all ${
                      entryMode === 'ca_exam' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CA (30%) + Exam (70%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('total_score')}
                    className={`py-2 rounded-lg transition-all ${
                      entryMode === 'total_score' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Direct Score (0–100)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('letter')}
                    className={`py-2 rounded-lg transition-all ${
                      entryMode === 'letter' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Letter Grade
                  </button>
                </div>
              </div>

              {/* Mode-specific Fields */}
              {entryMode === 'ca_exam' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Continuous Assessment (30%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={ca}
                      onChange={(e) => setCa(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Scale 0 – 100</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Final Examination (70%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={exam}
                      onChange={(e) => setExam(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Scale 0 – 100</p>
                  </div>
                </div>
              )}

              {entryMode === 'total_score' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Total Composite Score (0–100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={totalScoreInput}
                    onChange={(e) => setTotalScoreInput(Number(e.target.value))}
                    className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Decimal-safe round-half-up will be applied automatically (e.g., 69.50 → 70 → A).
                  </p>
                </div>
              )}

              {entryMode === 'letter' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Letter Grade
                  </label>
                  <select
                    value={directLetter}
                    onChange={(e) => setDirectLetter(e.target.value)}
                    className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    {['A', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'].map((l) => (
                      <option key={l} value={l}>
                        Grade {l}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !courseId}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Recording…' : 'Record Official Attempt'}
              </button>
            </form>
          </div>

          {/* Real-time Calculation Card (1 col) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-lg p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" />
                Live Grade Engine
              </div>

              {livePreview ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-slate-300 font-medium">Selected Course</p>
                    <p className="text-base font-bold text-white mt-0.5">{selectedCourse?.code}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedCourse?.title}</p>
                    <div className="mt-2 inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      {livePreview.credits} Credit Hours
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[11px] text-slate-400">Letter Grade</p>
                      <p className="text-2xl font-black text-amber-400 mt-1">{livePreview.letter}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[11px] text-slate-400">Grade Point</p>
                      <p className="text-2xl font-black text-white mt-1">{livePreview.gradePoint.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/10 border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Raw Score:</span>
                      <span className="font-mono">{livePreview.rawTotal !== undefined ? livePreview.rawTotal.toFixed(2) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Rounded Total:</span>
                      <span className="font-mono">{livePreview.roundedTotal !== undefined ? livePreview.roundedTotal : '—'}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between font-bold text-emerald-400 text-sm">
                      <span>Quality Points (QP):</span>
                      <span>{livePreview.qualityPoints.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select course and values to calculate.</p>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-white/10 pt-4 mt-6">
              Quality Points = Credit Hours × Grade Point.
              <br />
              IPAM 10-tier scale: A (4.00) down to F (0.00).
            </div>
          </div>
        </div>

        {/* Saved Attempts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recorded Course Attempts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total: {attempts.length} records · {formatCredits(totalEarnedCredits)} credits completed
              </p>
            </div>
          </div>

          {attempts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No results recorded yet. Add your first course using the form above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Term</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3 text-center">Credits</th>
                    <th className="py-3 px-3 text-center">CA / Exam</th>
                    <th className="py-3 px-3 text-center">Score</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Point</th>
                    <th className="py-3 px-3 text-right">QP</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-600">
                        {r.academic_year} S{r.semester}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{r.courses?.code || '—'}</td>
                      <td className="py-3 px-3 text-slate-700 max-w-[220px] truncate">{r.courses?.title || '—'}</td>
                      <td className="py-3 px-3 text-center text-slate-700 font-semibold">{formatCredits(r.credit_hours)}</td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {r.ca_score != null && r.exam_score != null ? `${r.ca_score} / ${r.exam_score}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {r.total_score != null ? Number(r.total_score).toFixed(1) : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.letter_grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          r.letter_grade.startsWith('B') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          r.letter_grade.startsWith('C') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {r.letter_grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">{Number(r.grade_point).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{Number(r.quality_points).toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDelete(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete attempt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
