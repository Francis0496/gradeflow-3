'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import {
  requiredGPA,
  getClassification,
  calculateCGPA,
  formatCredits,
  formatGPA,
  letterToPoint,
  type AttemptResult,
} from '@/lib/academics';
import {
  Calculator,
  Target,
  Sparkles,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface SimCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  grade: string;
}

export default function SimulatorPage() {
  const supabase = createClient();
  const [earnedCredits, setEarnedCredits] = useState<number>(15.0);
  const [currentCGPA, setCurrentCGPA] = useState<number>(3.35);
  const [targetCGPA, setTargetCGPA] = useState<number>(3.50);
  const [remainingCredits, setRemainingCredits] = useState<number>(15.0);

  // Scenario Simulator state
  const [simCourses, setSimCourses] = useState<SimCourse[]>([
    { id: '1', code: 'DIT211', title: 'Computer Networking 1', credits: 3.0, grade: 'A' },
    { id: '2', code: 'DIS211', title: 'Web Design', credits: 3.0, grade: 'B+' },
    { id: '3', code: 'DIS212', title: 'Database Systems 1', credits: 3.0, grade: 'A' },
  ]);

  // Load actual student records if available
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rows } = await supabase
        .from('course_attempts')
        .select('credit_hours, letter_grade, grade_point, quality_points')
        .eq('student_id', user.id);

      if (rows && rows.length > 0) {
        const mapped: AttemptResult[] = rows.map((r: any) => ({
          credits: formatCredits(r.credit_hours),
          creditHours: Number(r.credit_hours),
          letter: r.letter_grade,
          gradePoint: Number(r.grade_point),
          qualityPoints: Number(r.quality_points),
        }));
        const totalCr = mapped.reduce((s, a) => s + a.creditHours, 0);
        const cgpa = calculateCGPA(mapped);
        setEarnedCredits(totalCr);
        setCurrentCGPA(cgpa);
      }
    })();
  }, []);

  // Required GPA to reach target
  const neededGPA = requiredGPA(earnedCredits, currentCGPA, remainingCredits, targetCGPA);
  const currentClassification = getClassification(currentCGPA);
  const targetClassification = getClassification(targetCGPA);

  // Scenario simulated CGPA calculation
  const simQualityPoints = simCourses.reduce((sum, c) => sum + c.credits * letterToPoint(c.grade), 0);
  const simTotalCredits = simCourses.reduce((sum, c) => sum + c.credits, 0);
  const simTermGPA = simTotalCredits > 0 ? simQualityPoints / simTotalCredits : 0;

  const combinedCredits = earnedCredits + simTotalCredits;
  const combinedQP = earnedCredits * currentCGPA + simQualityPoints;
  const projectedCGPA = combinedCredits > 0 ? combinedQP / combinedCredits : currentCGPA;
  const projectedClassification = getClassification(projectedCGPA);

  function addSimCourse() {
    const newId = String(Date.now());
    setSimCourses((prev) => [
      ...prev,
      { id: newId, code: 'NEW COURSE', title: 'Elective Course', credits: 3.0, grade: 'A' },
    ]);
  }

  function removeSimCourse(id: string) {
    setSimCourses((prev) => prev.filter((c) => c.id !== id));
  }

  function updateSimCourse(id: string, field: keyof SimCourse, value: any) {
    setSimCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  return (
    <Shell signedIn>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill">Hypothetical Modeling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Grade Simulator & Target Calculator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate future course outcomes and calculate required GPAs to achieve your target degree classification.
          </p>
        </div>

        {/* Section 1: Target GPA Calculator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Target CGPA Projection</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Earned Credits
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={earnedCredits}
                onChange={(e) => setEarnedCredits(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Current completed credits</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Current CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.00"
                value={currentCGPA}
                onChange={(e) => setCurrentCGPA(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">{currentClassification}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Remaining Credits
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={remainingCredits}
                onChange={(e) => setRemainingCredits(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Credits left to complete</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Target CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.00"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-blue-600 font-medium mt-1">{targetClassification}</p>
            </div>
          </div>

          {/* Projection Result Banner */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Required GPA to Reach Target</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl font-black tracking-tight">{formatGPA(neededGPA)}</span>
                <span className="text-xs text-blue-200">average required on remaining {formatCredits(remainingCredits)} credits</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Target Classification: <strong className="text-white">{targetClassification}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {neededGPA <= 4.00 ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-xl text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Achievable Target
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 px-4 py-2 rounded-xl text-rose-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Exceeds 4.00 maximum scale
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: What-If Scenario Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">What-If Course Outcome Scenario</h2>
                <p className="text-xs text-slate-500">Test hypothetical grades for upcoming semester courses</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addSimCourse}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Simulated Course
            </button>
          </div>

          {/* Courses List */}
          <div className="space-y-3 mb-6">
            {simCourses.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <div className="w-full sm:w-28">
                  <input
                    type="text"
                    value={c.code}
                    onChange={(e) => updateSimCourse(c.id, 'code', e.target.value)}
                    placeholder="Code"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase"
                  />
                </div>
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => updateSimCourse(c.id, 'title', e.target.value)}
                    placeholder="Title"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="w-24">
                  <select
                    value={c.credits}
                    onChange={(e) => updateSimCourse(c.id, 'credits', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <option value={1.5}>1.5 Cr</option>
                    <option value={3.0}>3.0 Cr</option>
                    <option value={4.0}>4.0 Cr</option>
                    <option value={6.0}>6.0 Cr</option>
                  </select>
                </div>
                <div className="w-24">
                  <select
                    value={c.grade}
                    onChange={(e) => updateSimCourse(c.id, 'grade', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-700"
                  >
                    {['A', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'].map((g) => (
                      <option key={g} value={g}>
                        {g} ({letterToPoint(g).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeSimCourse(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Scenario Simulation Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-slate-100 pt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Simulated Term GPA</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatGPA(simTermGPA)}</p>
              <p className="text-xs text-slate-400 mt-1">{formatCredits(simTotalCredits)} credits simulated</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">Projected New CGPA</p>
              <p className="text-2xl font-black text-blue-800 mt-1">{formatGPA(projectedCGPA)}</p>
              <p className="text-xs text-blue-600 mt-1">
                {projectedCGPA > currentCGPA ? `+${(projectedCGPA - currentCGPA).toFixed(2)} increase` : 'No increase'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-700 font-medium">Projected Standing</p>
              <p className="text-lg font-bold text-emerald-800 mt-1">{projectedClassification}</p>
              <p className="text-xs text-emerald-600 mt-1">Total {formatCredits(combinedCredits)} combined credits</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
