'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import { formatCredits } from '@/lib/academics';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

interface Row {
  semester: number;
  code: string;
  title: string;
  credits: number;
  kind: string;
  done: boolean;
}

const DEFAULT_PLANNER_COURSES: Row[] = [
  // Semester 1
  { semester: 1, code: 'DIT111', title: 'Introduction to Computing & Information Technology', credits: 3.0, kind: 'Core', done: true },
  { semester: 1, code: 'DIT112', title: 'Programming Fundamentals in C', credits: 3.0, kind: 'Core', done: true },
  { semester: 1, code: 'MAT111', title: 'Discrete Mathematics for Computing', credits: 3.0, kind: 'Core', done: true },
  { semester: 1, code: 'ENG111', title: 'Communication & Study Skills in English', credits: 3.0, kind: 'Core', done: true },

  // Semester 2
  { semester: 2, code: 'DIT121', title: 'Data Structures & Algorithms Analysis', credits: 3.0, kind: 'Core', done: true },
  { semester: 2, code: 'DIT122', title: 'Object-Oriented Programming with Java', credits: 3.0, kind: 'Core', done: true },
  { semester: 2, code: 'DIT123', title: 'Computer Architecture & Digital Logic', credits: 3.0, kind: 'Core', done: true },
  { semester: 2, code: 'GEN121', title: 'African Studies & Contemporary Civilization', credits: 3.0, kind: 'Core', done: true },

  // Semester 3
  { semester: 3, code: 'DIT211', title: 'Data Communications & Computer Networking 1', credits: 3.0, kind: 'Core', done: true },
  { semester: 3, code: 'DIS211', title: 'Web Design, Technologies & Standards', credits: 3.0, kind: 'Core', done: true },
  { semester: 3, code: 'DIS212', title: 'Database Systems Design & SQL 1', credits: 3.0, kind: 'Core', done: true },
  { semester: 3, code: 'MAT211', title: 'Probability & Statistics for Computing', credits: 3.0, kind: 'Core', done: false },

  // Semester 4
  { semester: 4, code: 'DIT221', title: 'Operating Systems & System Administration', credits: 3.0, kind: 'Core', done: false },
  { semester: 4, code: 'DIT222', title: 'Object-Oriented Analysis & Design with UML', credits: 3.0, kind: 'Core', done: false },
  { semester: 4, code: 'DIS221', title: 'Advanced Database Management Systems 2', credits: 3.0, kind: 'Core', done: false },
  { semester: 4, code: 'DIS222', title: 'E-Commerce Engineering & Web Platforms', credits: 3.0, kind: 'Core', done: false },

  // Semester 5
  { semester: 5, code: 'DIT311', title: 'Software Engineering Principles & Lifecycle', credits: 3.0, kind: 'Core', done: false },
  { semester: 5, code: 'DIT312', title: 'Network Security & Applied Cryptography', credits: 3.0, kind: 'Core', done: false },
  { semester: 5, code: 'DIS311', title: 'Enterprise Information Systems Architecture', credits: 3.0, kind: 'Core', done: false },

  // Semester 6
  { semester: 6, code: 'DIT321', title: 'Mobile Application Development (Android/Flutter)', credits: 3.0, kind: 'Core', done: false },
  { semester: 6, code: 'DIT322', title: 'Cloud Computing Architecture & Virtualization', credits: 3.0, kind: 'Core', done: false },
  { semester: 6, code: 'DIS321', title: 'Big Data Technologies & Analytics', credits: 3.0, kind: 'Core', done: false },

  // Semester 7
  { semester: 7, code: 'DIT411', title: 'Final Year Capstone Research Project 1', credits: 3.0, kind: 'Core', done: false },
  { semester: 7, code: 'DIT412', title: 'Artificial Intelligence & Machine Learning', credits: 3.0, kind: 'Core', done: false },
  { semester: 7, code: 'DIS411', title: 'IT Project Management & Agile Methodologies', credits: 3.0, kind: 'Core', done: false },

  // Semester 8
  { semester: 8, code: 'DIT421', title: 'Final Year Capstone Research Project 2', credits: 6.0, kind: 'Core', done: false },
  { semester: 8, code: 'DIT422', title: 'Cyber Security Law, Ethics & Professional Practice', credits: 3.0, kind: 'Core', done: false },
];

export default function PlannerPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>(DEFAULT_PLANNER_COURSES);
  const [programmeName, setProgrammeName] = useState('BSc. Information Technology');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('programme_id, programmes(name)')
        .eq('id', user.id)
        .maybeSingle();

      const progName = (profile as any)?.programmes?.name ?? 'BSc. Information Technology';
      setProgrammeName(progName);
      const programmeId = profile?.programme_id;

      let links: any[] = [];
      if (programmeId) {
        const { data } = await supabase
          .from('programme_courses')
          .select('semester_number, is_core, courses(id, code, title, credit_hours)')
          .eq('programme_id', programmeId);
        links = data ?? [];
      }

      const { data: attempts } = await supabase
        .from('course_attempts')
        .select('course_id')
        .eq('student_id', user.id);

      const doneSet = new Set((attempts ?? []).map((a) => a.course_id));

      if (links.length > 0) {
        const mapped = links.map((l: any) => ({
          semester: l.semester_number ?? 1,
          code: l.courses?.code ?? '',
          title: l.courses?.title ?? '',
          credits: Number(l.courses?.credit_hours ?? 3.0),
          kind: l.is_core ? 'Core' : 'Elective',
          done: doneSet.has(l.courses?.id),
        }));

        setRows(mapped.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)));
      }
    })();
  }, []);

  function toggleCourseDone(code: string) {
    setRows((prev) =>
      prev.map((r) => (r.code === code ? { ...r, done: !r.done } : r))
    );
  }

  const semesters = Array.from(new Set(rows.map((r) => r.semester))).sort((a, b) => a - b);
  const completedCredits = rows.filter((r) => r.done).reduce((s, r) => s + r.credits, 0);
  const remainingCredits = rows.filter((r) => !r.done).reduce((s, r) => s + r.credits, 0);
  const totalCurriculumCredits = completedCredits + remainingCredits;
  const progressPercent = totalCurriculumCredits > 0 ? Math.round((completedCredits / totalCurriculumCredits) * 100) : 0;
  const completedCoursesCount = rows.filter((r) => r.done).length;

  return (
    <Shell signedIn>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="pill">Academic Roadmap</span>
              {programmeName && (
                <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
                  {programmeName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Curriculum Study Planner
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Map your progression across 8 semesters of your 4-year degree programme. Click any course status to toggle your planned progress.
            </p>
          </div>

          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <span>Record Course Result</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progress & Stats Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Completed Credits</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{formatCredits(completedCredits)}</p>
              <p className="text-slate-500 mt-0.5">{completedCoursesCount} courses passed</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Remaining Credits</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{formatCredits(remainingCredits)}</p>
              <p className="text-slate-500 mt-0.5">{rows.length - completedCoursesCount} courses to go</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Total Degree Credits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCredits(totalCurriculumCredits)}</p>
              <p className="text-slate-500 mt-0.5">Honours requirement</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Curriculum Completion</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">{progressPercent}%</p>
              <p className="text-slate-500 mt-0.5">8 Semesters roadmap</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Overall Degree Progression</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Semesters Cards */}
        {semesters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No catalogue curriculum linked to your profile.</p>
            <p className="text-xs text-slate-400 mt-1">Please set your programme in Profile settings.</p>
            <Link href="/profile" className="btn-primary mt-4 text-xs">
              Configure Profile Programme
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {semesters.map((s) => {
              const semCourses = rows.filter((r) => r.semester === s);
              const semCredits = semCourses.reduce((sum, c) => sum + c.credits, 0);
              const semDone = semCourses.every((c) => c.done);

              return (
                <div
                  key={s}
                  className={`bg-white rounded-2xl border ${
                    semDone ? 'border-emerald-200 ring-1 ring-emerald-200/50' : 'border-slate-200'
                  } shadow-sm overflow-hidden transition-all`}
                >
                  <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          semDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        S{s}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Semester {s} Curriculum</h3>
                        <p className="text-xs text-slate-500">{formatCredits(semCredits)} Credit Hours · Year {Math.ceil(s / 2)}</p>
                      </div>
                    </div>
                    {semDone && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Semester Completed
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto p-4 sm:p-6">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3 text-center">Type</th>
                          <th className="py-2.5 px-3 text-center">Credits</th>
                          <th className="py-2.5 px-3 text-right">Status (Click to toggle)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {semCourses.map((r) => (
                          <tr key={r.code} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">{r.code}</td>
                            <td className="py-3 px-3 text-slate-700">{r.title}</td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  r.kind === 'Core'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {r.kind}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-slate-700">
                              {formatCredits(r.credits)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => toggleCourseDone(r.code)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  r.done
                                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title="Click to toggle course completion"
                              >
                                {r.done ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Planned</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
