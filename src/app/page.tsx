import Link from 'next/link';
import Shell from '@/components/Shell';
import {
  GraduationCap,
  Calculator,
  FileSpreadsheet,
  FileText,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  return (
    <Shell>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-blue-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Institutional Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            IPAM · University of Sierra Leone
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-none">
            Academic Performance Management,{' '}
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Clearly Calculated.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed">
            GradeFlow 3.0 delivers precision credit-weighted GPA & CGPA calculations, official 10-tier grading scale conversion, what-if simulation, and verified unofficial transcripts for university students.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-600/25 transition-all text-sm group"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              Get Started with Student Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors text-sm"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              Browse Course Catalogue
            </Link>
          </div>

          {/* Interactive Preview Mockup Card */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden p-6 sm:p-8 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  GradeFlow 3.0 Student Performance Dashboard Preview
                </span>
              </div>
              <span className="pill text-[10px]">
                Official 10-Tier Scale
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Term GPA</p>
                <p className="text-2xl font-black text-slate-900 mt-1">3.35</p>
                <p className="text-[11px] text-slate-500 mt-0.5">15.0 Credits Attempted</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <p className="text-[11px] font-semibold text-blue-600 uppercase">Cumulative CGPA</p>
                <p className="text-2xl font-black text-blue-700 mt-1">3.50</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Credit-weighted total</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Completed Credits</p>
                <p className="text-2xl font-black text-slate-900 mt-1">30.0</p>
                <p className="text-[11px] text-slate-500 mt-0.5">3.0 Cr Standard Value</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-[11px] font-semibold text-emerald-700 uppercase">Honours Award</p>
                <p className="text-base font-bold text-emerald-800 mt-1">First Class</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">CGPA ≥ 3.50 Threshold</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Mathematics for IT (DAA112) · 3.0 Cr · Grade A (4.00) · 12.00 QP</span>
              <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Passed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="pill mb-3">Engineered for Academic Integrity</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built Specifically for IPAM Academic Rules
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every formula, credit formatting rule, and rounding edge-case matches the University of Sierra Leone academic policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Decimal-Safe GPA Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aggregates exact credit-weighted quality points. Never computes cumulative CGPA by averaging rounded semester GPAs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">30/70 Continuous Assessment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Final score = (CA × 0.30) + (Exam × 0.70). Implements decimal-safe round-half-up (69.50 → 70 → A).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Target Grade Simulator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Determine the exact semester GPA required on future credits to attain your targeted degree classification.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Unofficial Transcripts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate and export clean, formatted PDF academic performance summaries with official course codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How GradeFlow 3.0 Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Three simple steps to gain complete transparency over your academic journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-3xl font-black text-blue-200">01</span>
              <h3 className="font-bold text-slate-900 text-base mt-2 mb-2">Select Your Programme</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Link your account to your registered programme (e.g. BSc. Information Technology) to filter the official 50-course curriculum.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-3xl font-black text-indigo-200">02</span>
              <h3 className="font-bold text-slate-900 text-base mt-2 mb-2">Record Marks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Input your CA (30%) and Examination (70%) scores or direct grade. GradeFlow computes quality points automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-3xl font-black text-emerald-200">03</span>
              <h3 className="font-bold text-slate-900 text-base mt-2 mb-2">Track & Simulate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View instant GPA trends, explore what-if simulation scenarios, monitor degree standing, and export PDF transcripts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Mission Banner */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Developed by Sierra EduTech Solutions Limited
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
            GradeFlow 3.0 is built to empower students with verified academic data, proactive GPA simulation, and structured academic success tools across Sierra Leone and beyond.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Student Account
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
