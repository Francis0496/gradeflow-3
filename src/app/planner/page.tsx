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
} from 'lucide-react';

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
  const [programmeName, setProgrammeName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('programme_id, programmes(name)')
        .eq('id', user.id)
        .maybeSingle();

      const progName = (profile as any)?.programmes?.name ?? '';
      setProgrammeName(progName);
      const programmeId = profile?.programme_id;

      let links: any[] = [];
      if (programmeId) {
        const { data } = await supabase
          .from('programme_courses')
          .select('semester_number, is_core, courses(id, code, title, credit_hours)')
          .eq('programme_id', programmeId);
        links = data ?? [];
      } else {
        // Fallback to first programme
        const { data: progs } = await supabase.from('programmes').select('id, name').limit(1).maybeSingle();
        if (progs) {
          setProgrammeName(progs.name);
          const { data } = await supabase
            .from('programme_courses')
            .select('semester_number, is_core, courses(id, code, title, credit_hours)')
            .eq('programme_id', progs.id);
          links = data ?? [];
        }
      }

      const { data: attempts } = await supabase
        .from('course_attempts')
        .select('course_id')
        .eq('student_id', user.id);

      const doneSet = new Set((attempts ?? []).map((a) => a.course_id));

      const mapped = links.map((l: any) => ({
        semester: l.semester_number ?? 1,
        code: l.courses?.code ?? '',
        title: l.courses?.title ?? '',
        credits: Number(l.courses?.credit_hours ?? 3.0),
        kind: l.is_core ? 'Core' : 'Elective',
        done: doneSet.has(l.courses?.id),
      }));

      setRows(mapped.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)));
      setLoading(false);
    })();
  }, []);

  const semesters = Array.from(new Set(rows.map((r) => r.semester))).sort((a, b) => a - b);
  const completedCredits = rows.filter((r) => r.done).reduce((s, r) => s + r.credits, 0);
  const remainingCredits = rows.filter((r) => !r.done).reduce((s, r) => s + r.credits, 0);
  const totalCurriculumCredits = completedCredits + remainingCredits;
  const progressPercent = totalCurriculumCredits > 0 ? Math.round((completedCredits / totalCurriculumCredits) * 100) : 0;

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
              Map your progression across 8 semesters of your 4-year degree programme.
            </p>
          </div>

          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Record Finished Course
          </Link>
        </div>

        {/* Progress Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed Credits</p>
              <p className="text-3xl font-black text-emerald-700 mt-1">{formatCredits(completedCredits)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{rows.filter((r) => r.done).length} units passed</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Remaining Credits</p>
              <p className="text-3xl font-black text-blue-700 mt-1">{formatCredits(remainingCredits)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{rows.filter((r) => !r.done).length} units remaining</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Degree Completion</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{progressPercent}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Overall curriculum pace</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
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
                    semDone ? 'border-emerald-200' : 'border-slate-200'
                  } shadow-sm overflow-hidden`}
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
                        <p className="text-xs text-slate-500">{formatCredits(semCredits)} Credit Hours</p>
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
                          <th className="py-2.5 px-3 text-right">Status</th>
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
                              {r.done ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Planned
                                </span>
                              )}
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
