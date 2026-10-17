'use client';
import { useState } from 'react';
import {
  DegreeAuditReport,
  GraduationClearanceStatus,
} from '@/lib/academics/degreeAudit';
import { formatCredits, formatGPA } from '@/lib/academics';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Award,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function DegreeAuditView({
  auditReport,
  onNavigateToRoadmap,
}: {
  auditReport: DegreeAuditReport;
  onNavigateToRoadmap?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'prerequisites' | 'deficiencies'>('overview');

  const {
    graduationStatus,
    statusMessage,
    earnedCredits,
    requiredCredits,
    remainingCredits,
    percentComplete,
    currentCGPA,
    projectedClassification,
    prerequisiteAudits,
    brokenPrerequisitesCount,
    coreDeficiencies,
    passedCoursesCount,
    totalRequiredCoursesCount,
    canGraduateNow,
  } = auditReport;

  // Status configuration
  const statusConfig = {
    CLEARED: {
      title: 'Graduation Clearance Approved',
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      tag: 'Ready for Congregation',
    },
    IN_PROGRESS: {
      title: 'Curriculum In Progress',
      color: 'text-blue-900 bg-blue-50/70 border-blue-200',
      badgeColor: 'bg-blue-600 text-white',
      icon: Clock,
      tag: 'Academic Track Normal',
    },
    DEFICIENT: {
      title: 'Graduation Pending Deficiencies',
      color: 'text-amber-900 bg-amber-50/70 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      tag: 'Deficiencies Requiring Clearance',
    },
    BLOCKED: {
      title: 'Course Progression Blocked',
      color: 'text-rose-900 bg-rose-50/70 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      icon: XCircle,
      tag: 'Prerequisite Violation Detected',
    },
  }[graduationStatus];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Executive Clearance Status Hero Banner */}
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-xs transition-all ${statusConfig.color}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white shadow-xs border border-slate-200/50 shrink-0">
              <StatusIcon className="w-8 h-8 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${statusConfig.badgeColor}`}>
                  {statusConfig.tag}
                </span>
                <span className="text-xs font-semibold opacity-80">
                  {auditReport.programmeName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {statusConfig.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
                {statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Honours</p>
              <p className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{projectedClassification}</span>
              </p>
              <p className="text-[11px] font-semibold text-blue-700 mt-0.5">
                CGPA {formatGPA(currentCGPA)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar inside hero */}
        <div className="mt-6 pt-6 border-t border-current/10">
          <div className="flex justify-between text-xs font-bold text-slate-800 mb-2">
            <span>Overall Degree Requirement: {formatCredits(earnedCredits)} of {formatCredits(requiredCredits)} Credit Hours</span>
            <span>{percentComplete}% Complete</span>
          </div>
          <div className="w-full bg-white/80 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, percentComplete)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Audit Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Clearance Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prerequisites')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'prerequisites'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Prerequisite Chains ({prerequisiteAudits.length})
            {brokenPrerequisitesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black">
                {brokenPrerequisitesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deficiencies')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'deficiencies'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Core Deficiencies ({coreDeficiencies.length})
          </button>
        </div>

        {/* Tab 1: Overview Breakdown */}
        {activeTab === 'overview' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Passed Units</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{passedCoursesCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Of {totalRequiredCoursesCount} required</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Earned Credits</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{formatCredits(earnedCredits)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Passed at ≥ C- (2.0)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Remaining Credits</p>
                <p className="text-2xl font-black text-blue-700 mt-1">{formatCredits(remainingCredits)}</p>
                <p className="text-xs text-slate-500 mt-0.5">To reach 120.0 Cr</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Broken Prereqs</p>
                <p className={`text-2xl font-black mt-1 ${brokenPrerequisitesCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {brokenPrerequisitesCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Progression blockers</p>
              </div>
            </div>

            {/* Graduation Criteria Checklist */}
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              <div className="bg-slate-50/70 px-4 py-3 font-bold text-xs text-slate-800 uppercase tracking-wider">
                Official IPAM / USL Graduation Clearance Criteria
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {earnedCredits >= requiredCredits ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">120.0 Minimum Earned Credit Hours</p>
                    <p className="text-[11px] text-slate-500">Currently earned: {formatCredits(earnedCredits)} credits</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${earnedCredits >= requiredCredits ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {earnedCredits >= requiredCredits ? 'Satisfied' : `${formatCredits(remainingCredits)} Cr Needed`}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentCGPA >= 2.00 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">Minimum CGPA of 2.00 (Pass Degree Threshold)</p>
                    <p className="text-[11px] text-slate-500">Current candidate CGPA: {formatGPA(currentCGPA)}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentCGPA >= 2.00 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {currentCGPA >= 2.00 ? 'Satisfied' : 'Below 2.00 Threshold'}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {coreDeficiencies.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">100% Core Course Curriculum Completion</p>
                    <p className="text-[11px] text-slate-500">
                      {coreDeficiencies.length === 0
                        ? 'All mandatory core courses passed with Grade ≥ C-'
                        : `${coreDeficiencies.length} core courses currently unfulfilled or failed`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${coreDeficiencies.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {coreDeficiencies.length === 0 ? 'Satisfied' : `${coreDeficiencies.length} Deficient`}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {brokenPrerequisitesCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">Academic Prerequisite Chain Adherence</p>
                    <p className="text-[11px] text-slate-500">
                      {brokenPrerequisitesCount === 0
                        ? 'Zero broken prerequisite chains in academic record'
                        : `${brokenPrerequisitesCount} prerequisite requirements violated`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${brokenPrerequisitesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {brokenPrerequisitesCount === 0 ? 'Compliant' : 'Prerequisite Violations'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Prerequisite Chains */}
        {activeTab === 'prerequisites' && (
          <div className="p-6 sm:p-8 space-y-4">
            <p className="text-xs text-slate-500 mb-2">
              Prerequisites enforce institutional sequence rigor. Advanced courses require completion of foundational subjects with at least Grade C- (2.00 GP).
            </p>

            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {prerequisiteAudits.map((audit, idx) => {
                const isSatisfied = audit.status === 'SATISFIED';
                const isBroken = audit.status === 'FAILED_PREREQUISITE' || audit.status === 'NOT_ATTEMPTED' || audit.status === 'CREDIT_DEFICIENT';
                return (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{audit.rule.courseCode}</span>
                        <span className="text-slate-400 text-xs">requires</span>
                        <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {audit.rule.prerequisiteCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {audit.rule.courseTitle}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {audit.details}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isSatisfied ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Satisfied ({audit.studentPrerequisiteGrade || 'Pass'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{audit.status.replace('_', ' ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Core Deficiencies */}
        {activeTab === 'deficiencies' && (
          <div className="p-6 sm:p-8 space-y-4">
            {coreDeficiencies.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/40 rounded-2xl border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-900">Zero Core Course Deficiencies</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Every compulsory core course required by the IPAM Faculty of Information Systems & Technology is completed with passing standing.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    The following core courses must be completed and passed with Grade C- or higher before final degree conferral.
                  </p>
                  {onNavigateToRoadmap && (
                    <button
                      type="button"
                      onClick={onNavigateToRoadmap}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                    >
                      <span>Open Roadmap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Course Code</th>
                        <th className="py-2.5 px-3">Course Title</th>
                        <th className="py-2.5 px-3 text-center">Semester</th>
                        <th className="py-2.5 px-3 text-center">Credits</th>
                        <th className="py-2.5 px-3 text-right">Deficiency Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coreDeficiencies.map((d) => (
                        <tr key={d.courseCode} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.courseCode}</td>
                          <td className="py-2.5 px-3 text-slate-700">{d.courseTitle}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">Semester {d.semesterNumber}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{formatCredits(d.creditHours)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {d.reason === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Failed (Grade: {d.gradeReceived || 'F'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Not Yet Attempted
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
