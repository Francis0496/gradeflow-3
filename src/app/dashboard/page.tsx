import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Shell from '@/components/Shell';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import {
  calculateGPA,
  getClassification,
  formatCredits,
  formatGPA,
  generateAcademicInsights,
  type AttemptResult,
} from '@/lib/academics';
import TermSelector from './TermSelector';
import GpaTrendChart from '@/components/dashboard/GpaTrendChart';
import GradeDistributionChart from '@/components/dashboard/GradeDistributionChart';
import {
  TrendingUp,
  Award,
  BookOpen,
  CalendarCheck,
  PlusCircle,
  FileText,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>;
}) {
  const { term } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, programme_id, academic_level, programmes(name, award_type)')
    .eq('id', user.id)
    .maybeSingle();

  const { data: rows } = await supabase
    .from('course_attempts')
    .select(
      'id, credit_hours, letter_grade, grade_point, quality_points, academic_year, semester, is_verified, courses(code, title)'
    )
    .eq('student_id', user.id)
    .order('created_at', { ascending: true });

  const attemptsData = rows ?? [];
  const terms = Array.from(
    new Set(
      attemptsData
        .filter((r) => r.academic_year && r.semester)
        .map((r) => `${r.academic_year} S${r.semester}`)
    )
  ).sort();

  const selectedTerm = term && terms.includes(term) ? term : terms[terms.length - 1] ?? '';

  // All attempts formatted
  const allAttempts: AttemptResult[] = attemptsData.map((r: any) => ({
    credits: formatCredits(r.credit_hours),
    creditHours: Number(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  // Selected term attempts
  const semesterRows = selectedTerm
    ? attemptsData.filter((r) => `${r.academic_year} S${r.semester}` === selectedTerm)
    : [];

  const semesterAttempts: AttemptResult[] = semesterRows.map((r: any) => ({
    credits: formatCredits(r.credit_hours),
    creditHours: Number(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
    qualityPoints: Number(r.quality_points),
  }));

  const termGpa = semesterAttempts.length ? calculateGPA(semesterAttempts) : 0;
  const cumulativeCgpa = allAttempts.length ? calculateGPA(allAttempts) : 0;
  const totalCredits = allAttempts.reduce((s, a) => s + a.creditHours, 0);

  const studentName = profile?.full_name || user.email || 'Student';
  const programmeName = (profile as any)?.programmes?.name ?? 'BSc. Information Technology';
  const awardType = (profile as any)?.programmes?.award_type ?? 'honours';
  const standing = allAttempts.length ? getClassification(cumulativeCgpa, awardType) : 'Pending';

  const insightAttempts = attemptsData.map((r: any) => ({
    courseCode: r.courses?.code || '—',
    courseTitle: r.courses?.title || '—',
    creditHours: Number(r.credit_hours),
    letter: r.letter_grade,
    gradePoint: Number(r.grade_point),
  }));
  const insights = generateAcademicInsights(insightAttempts, 120.0, awardType as any);

  // Compute Trend Points for Recharts
  const trendPoints: { term: string; gpa: number; cgpa: number }[] = [];
  let runningAttempts: AttemptResult[] = [];
  for (const t of terms) {
    const termRows = attemptsData.filter((r) => `${r.academic_year} S${r.semester}` === t);
    const mapped: AttemptResult[] = termRows.map((r: any) => ({
      credits: formatCredits(r.credit_hours),
      creditHours: Number(r.credit_hours),
      letter: r.letter_grade,
      gradePoint: Number(r.grade_point),
      qualityPoints: Number(r.quality_points),
    }));
    runningAttempts = [...runningAttempts, ...mapped];
    trendPoints.push({
      term: t,
      gpa: calculateGPA(mapped),
      cgpa: calculateGPA(runningAttempts),
    });
  }

  // Compute Grade Distribution
  const gradeCounts: Record<string, number> = {
    A: 0,
    'B+': 0,
    B: 0,
    'B-': 0,
    'C+': 0,
    C: 0,
    'C-': 0,
    D: 0,
    E: 0,
    F: 0,
  };
  for (const a of allAttempts) {
    if (gradeCounts[a.letter] !== undefined) {
      gradeCounts[a.letter]++;
    }
  }
  const gradeDistributionData = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade,
    count,
  }));

  return (
    <Shell signedIn userEmail={user.email}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="pill">
                IPAM · University of Sierra Leone
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
                {profile?.academic_level || 'Year 1'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {studentName}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 inline" />
              {programmeName}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Suspense fallback={null}>
              <TermSelector terms={terms} current={selectedTerm} />
            </Suspense>
            <Link
              href="/results"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Enter Result
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Semester GPA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Term GPA</span>
              <span className="text-blue-600 font-medium text-[11px] truncate max-w-[120px]">
                {selectedTerm || 'No term selected'}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {selectedTerm && semesterAttempts.length > 0 ? formatGPA(termGpa) : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {semesterAttempts.length} course(s) in selected term
            </p>
          </div>

          {/* Card 2: Cumulative CGPA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Cumulative CGPA</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-indigo-700 tracking-tight">
              {allAttempts.length > 0 ? formatGPA(cumulativeCgpa) : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Weighted across all {allAttempts.length} completed attempts
            </p>
          </div>

          {/* Card 3: Completed Credits */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Completed Credits</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCredits(totalCredits)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Standard 3.0 credits per core unit
            </p>
          </div>

          {/* Card 4: Academic Standing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Academic Standing</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700 tracking-tight leading-tight mt-1">
              {standing}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Official USL Honours Classification
            </p>
          </div>
        </div>

        {/* Personalized Academic Insights & Action Recommendations */}
        {allAttempts.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Performance Insights & Recommendations</h3>
                  <p className="text-xs text-slate-300">Automated academic diagnosis based on official USL thresholds</p>
                </div>
              </div>
              {insights.nextTier && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-200">
                  <Target className="w-4 h-4 text-amber-400" />
                  Target: {insights.nextTier.name} ({insights.nextTier.threshold.toFixed(2)})
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Guidance & Next Tier */}
              <div className="space-y-2">
                <p className="font-bold text-blue-300 uppercase tracking-wider text-[11px]">Academic Projection</p>
                {insights.actionItems.map((item, idx) => (
                  <p key={idx} className="text-slate-200 leading-relaxed">
                    • {item}
                  </p>
                ))}
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <p className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Key Subject Strengths</p>
                {insights.strengths.length > 0 ? (
                  insights.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{str}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Aim for A and B+ grades to establish standout units.</p>
                )}
              </div>

              {/* Focus Areas */}
              <div className="space-y-2">
                <p className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Focus & Mitigation Areas</p>
                {insights.vulnerabilities.length > 0 ? (
                  insights.vulnerabilities.map((vul, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{vul}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-emerald-300">No vulnerable courses below grade C! Clean academic slate.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">GPA Progression</h3>
                <p className="text-xs text-slate-500">Term GPA vs. Cumulative CGPA over time</p>
              </div>
              <span className="text-xs font-medium text-slate-400">Scale: 0.00 – 4.00</span>
            </div>
            <GpaTrendChart data={trendPoints} />
          </div>

          {/* Grade Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Grade Distribution</h3>
                <p className="text-xs text-slate-500">Course outcomes mapped to IPAM 10-tier bands</p>
              </div>
              <span className="text-xs font-medium text-slate-400">Total: {allAttempts.length}</span>
            </div>
            <GradeDistributionChart data={gradeDistributionData} />
          </div>
        </div>

        {/* Recent Attempts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Courses Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Recent Academic Records</h3>
              <Link href="/results" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View all results <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {attemptsData.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No results recorded yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add your continuous assessment (30%) and examination (70%) marks to track your official GPA.
                </p>
                <Link
                  href="/results"
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add First Course Result
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Code</th>
                      <th className="py-2.5">Title</th>
                      <th className="py-2.5 text-center">Credits</th>
                      <th className="py-2.5 text-center">Grade</th>
                      <th className="py-2.5 text-center">Points</th>
                      <th className="py-2.5 text-right">Quality Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attemptsData.slice(-5).reverse().map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-bold text-slate-900">{r.courses?.code || '—'}</td>
                        <td className="py-3 text-slate-700 max-w-[200px] truncate">{r.courses?.title || '—'}</td>
                        <td className="py-3 text-center text-slate-600 font-medium">{formatCredits(r.credit_hours)}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.letter_grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.letter_grade.startsWith('B') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            r.letter_grade.startsWith('C') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {r.letter_grade}
                          </span>
                        </td>
                        <td className="py-3 text-center text-slate-600">{Number(r.grade_point).toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold text-slate-800">{Number(r.quality_points).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions Shortcuts (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-4">Quick Shortcuts</h3>
              <div className="space-y-3">
                <Link
                  href="/results"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Record Results</p>
                      <p className="text-[11px] text-slate-400">Enter CA & Exam scores</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/transcript"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Unofficial Transcript</p>
                      <p className="text-[11px] text-slate-400">Export formatted PDF</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/simulator"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Grade Simulator</p>
                      <p className="text-[11px] text-slate-400">Model future target CGPA</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/planner"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Study Planner</p>
                      <p className="text-[11px] text-slate-400">Semester 1–8 roadmap</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700">Institutional Notice</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Official results must be verified by the IPAM Registry. Contact your department administrator for discrepancies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
