import { redirect } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import {
  calculateGPA,
  getClassification,
  formatCredits,
  formatGPA,
  type AttemptResult,
} from '@/lib/academics';
import DownloadButton from './DownloadButton';
import {
  FileText,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export default async function TranscriptPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;
  let rows: any[] | null = null;

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, programme_id, academic_level, programmes(name, award_type)')
      .eq('id', user.id)
      .maybeSingle();
    profile = p;

    const { data: r } = await supabase
      .from('course_attempts')
      .select(
        'id, credit_hours, letter_grade, grade_point, quality_points, academic_year, semester, courses(code, title)'
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: true });
    rows = r;
  }

  const DEMO_TRANSCRIPT_ROWS = [
    { id: '1', credit_hours: 3.0, letter_grade: 'A', grade_point: 4.0, quality_points: 12.0, academic_year: '2024/2025', semester: 1, courses: { code: 'DIT111', title: 'Introduction to Computing' } },
    { id: '2', credit_hours: 3.0, letter_grade: 'B+', grade_point: 3.75, quality_points: 11.25, academic_year: '2024/2025', semester: 1, courses: { code: 'DIT112', title: 'Programming Fundamentals in C' } },
    { id: '3', credit_hours: 3.0, letter_grade: 'A', grade_point: 4.0, quality_points: 12.0, academic_year: '2024/2025', semester: 1, courses: { code: 'MAT111', title: 'Discrete Mathematics' } },
    { id: '4', credit_hours: 3.0, letter_grade: 'B', grade_point: 3.25, quality_points: 9.75, academic_year: '2024/2025', semester: 2, courses: { code: 'DIT121', title: 'Data Structures and Algorithms' } },
    { id: '5', credit_hours: 3.0, letter_grade: 'A', grade_point: 4.0, quality_points: 12.0, academic_year: '2024/2025', semester: 2, courses: { code: 'DIT122', title: 'Object-Oriented Programming (Java)' } },
  ];

  const items = (rows && rows.length > 0) ? rows : DEMO_TRANSCRIPT_ROWS;
  const attempts: AttemptResult[] = items.map((r: any) => ({
    credits: formatCredits(r.credit_hours),
    creditHours: Number(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  const cumulativeCgpa = attempts.length ? calculateGPA(attempts) : 0;
  const totalCredits = attempts.reduce((s, a) => s + a.creditHours, 0);
  const studentName = profile?.full_name || (user?.email ? user.email : 'Francis Sesay (Sample Candidate)');
  const programmeName = profile?.programmes?.name ?? 'BSc. Information Technology';
  const awardType = profile?.programmes?.award_type ?? 'honours';
  const classification = attempts.length ? getClassification(cumulativeCgpa, awardType) : 'Pending';

  const pdfRows = items.map((r: any) => ({
    code: r.courses?.code ?? '—',
    title: r.courses?.title ?? '—',
    credits: formatCredits(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point).toFixed(2),
    qp: Number(r.quality_points).toFixed(2),
  }));

  return (
    <Shell signedIn={Boolean(user)} userEmail={user?.email || 'demo.student@usl.edu.sl'}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="pill">Academic Summary</span>
              <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
                Unofficial Preview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Transcript Preview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Institute of Public Administration and Management · University of Sierra Leone
            </p>
          </div>

          {items.length > 0 && (
            <DownloadButton
              name={studentName}
              programme={programmeName}
              cgpa={formatGPA(cumulativeCgpa)}
              classification={classification}
              credits={formatCredits(totalCredits)}
              rows={pdfRows}
            />
          )}
        </div>

        {/* Student Dossier Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Candidate Name</p>
              <p className="text-base font-bold text-slate-900 mt-1">{studentName}</p>
              <p className="text-slate-400">{user?.email || 'ID: USL/IPAM/2023/0481'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Programme</p>
              <p className="text-base font-bold text-slate-900 mt-1">{programmeName}</p>
              <p className="text-slate-400">Faculty of Information Systems & Tech</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Completed Credits</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCredits(totalCredits)}</p>
              <p className="text-slate-400">Standard 3.0 credits / course</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider">Cumulative Standing</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{formatGPA(cumulativeCgpa)}</p>
              <p className="text-emerald-700 font-semibold mt-0.5">{classification}</p>
            </div>
          </div>
        </div>

        {/* Transcript Courses Record Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Academic History & Course Records</h2>
            <span className="text-xs text-slate-400">{items.length} Course Attempts</span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No course records found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Once you record course results, your official course codes, credit hours, and quality points will display here.
              </p>
              <Link
                href="/results"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Record Results
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Term</th>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Course Title</th>
                    <th className="py-3 px-3 text-center">Credit Hours</th>
                    <th className="py-3 px-3 text-center">Final Grade</th>
                    <th className="py-3 px-3 text-center">Grade Point</th>
                    <th className="py-3 px-3 text-right">Quality Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-600">
                        {r.academic_year} S{r.semester}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{r.courses?.code || '—'}</td>
                      <td className="py-3 px-3 text-slate-700">{r.courses?.title || '—'}</td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {formatCredits(r.credit_hours)}
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
                      <td className="py-3 px-3 text-center text-slate-600">
                        {Number(r.grade_point).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {Number(r.quality_points).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td colSpan={3} className="py-3 px-3">
                      Cumulative Summary
                    </td>
                    <td className="py-3 px-3 text-center text-blue-700">
                      {formatCredits(totalCredits)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center">
                      CGPA: {formatGPA(cumulativeCgpa)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700">
                      {attempts.reduce((s, a) => s + a.qualityPoints, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Official Issuance Disclaimer</p>
              <p className="mt-0.5 leading-relaxed">
                This document is an unofficial student self-service record calculated by GradeFlow 3.0.
                Official academic transcripts bearing institutional seals and signature verifications must be requested through the IPAM Examination Registry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
