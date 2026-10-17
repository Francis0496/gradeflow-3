import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { formatCredits } from '@/lib/academics';
import { BookOpen, Search, Filter, Layers, GraduationCap } from 'lucide-react';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: links, error } = await supabase
    .from('programme_courses')
    .select('semester_number, is_core, programmes(name), courses(code, title, credit_hours, is_active)')
    .order('semester_number');

  const dbRows = (links ?? [])
    .filter((l: any) => l.courses?.is_active !== false)
    .map((l: any) => ({
      programme: l.programmes?.name ?? 'General',
      semester: l.semester_number ?? 1,
      kind: l.is_core ? 'Core' : 'Elective',
      code: l.courses?.code ?? '—',
      title: l.courses?.title ?? '—',
      credits: formatCredits(l.courses?.credit_hours ?? 3.0),
    }));

  const DEFAULT_COURSES = [
    { programme: 'BSc. Information Technology', semester: 1, kind: 'Core', code: 'DIT111', title: 'Introduction to Computing', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 1, kind: 'Core', code: 'DIT112', title: 'Programming Fundamentals in C', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 1, kind: 'Core', code: 'MAT111', title: 'Discrete Mathematics', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 2, kind: 'Core', code: 'DIT121', title: 'Data Structures and Algorithms', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 2, kind: 'Core', code: 'DIT122', title: 'Object-Oriented Programming (Java)', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Systems', semester: 3, kind: 'Core', code: 'DIS211', title: 'Web Design & Interactive Systems', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Systems', semester: 3, kind: 'Core', code: 'DIS212', title: 'Database Systems & SQL 1', credits: formatCredits(3.0) },
    { programme: 'BSc. Computer Networking', semester: 3, kind: 'Core', code: 'DIT211', title: 'Computer Networking & Protocols', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 4, kind: 'Core', code: 'DIT221', title: 'Operating Systems Administration', credits: formatCredits(3.0) },
    { programme: 'BSc. Information Technology', semester: 5, kind: 'Core', code: 'DIT311', title: 'Software Engineering & Lifecycle', credits: formatCredits(3.0) },
  ];

  const rows = dbRows.length > 0 ? dbRows : DEFAULT_COURSES;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill">Faculty of Information Systems & Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Official Course Catalogue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard undergraduate curriculum for Information Technology, Information Systems, and Computer Networking.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error.message}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Catalogue Courses</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{rows.length}</p>
            <p className="text-xs text-slate-500">Active approved units</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-semibold uppercase">Standard Credit Value</p>
            <p className="text-2xl font-black text-blue-700 mt-1">3.0 Cr</p>
            <p className="text-xs text-slate-500">Fixed unit weighting</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-semibold uppercase">Programme Duration</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">4 Years</p>
            <p className="text-xs text-slate-500">8 Semesters of study</p>
          </div>
        </div>

        {/* Courses Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Curriculum Course Structure</h2>
            <div className="text-xs text-slate-400 font-medium">
              Showing {rows.length} course mappings
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Programme</th>
                  <th className="py-3 px-3 text-center">Semester</th>
                  <th className="py-3 px-3">Course Code</th>
                  <th className="py-3 px-3">Course Title</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3 text-center">Credit Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">{r.programme}</td>
                    <td className="py-3 px-3 text-center font-medium text-slate-600">Sem {r.semester}</td>
                    <td className="py-3 px-3 font-bold text-blue-700">{r.code}</td>
                    <td className="py-3 px-3 text-slate-800">{r.title}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          r.kind === 'Core'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {r.kind}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {r.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
