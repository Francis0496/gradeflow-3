'use client';
import { useState, useMemo, useRef } from 'react';
import {
  parseGradeCsv,
  BatchGradeRow,
  BatchSummary,
} from '@/lib/academics/batchGrades';
import { formatCredits, formatGPA } from '@/lib/academics';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';

const SAMPLE_CSV = `student_email,student_name,course_code,ca_score,exam_score,academic_year,semester
john.kamara@ipam.edu.sl,John S. Kamara,DIT111,27,62,2025/2026,1
fatmata.sesay@ipam.edu.sl,Fatmata B. Sesay,DIT111,28,65,2025/2026,1
mohamed.conteh@ipam.edu.sl,Mohamed K. Conteh,DIT111,22,46,2025/2026,1
aminata.turay@ipam.edu.sl,Aminata Turay,DIT111,19,38,2025/2026,1
ibrahim.bangura@ipam.edu.sl,Ibrahim Bangura,DIT111,25,48,2025/2026,1
isatu.koroma@ipam.edu.sl,Isatu Koroma,DIT111,29,68,2025/2026,1
joseph.mansaray@ipam.edu.sl,Joseph Mansaray,DIT111,14,22,2025/2026,1`;

interface BatchGradeImporterProps {
  knownCourses?: { code: string; title?: string; credit_hours: number }[];
  onSuccess?: () => void;
}

export default function BatchGradeImporter({
  knownCourses = [],
  onSuccess,
}: BatchGradeImporterProps) {
  const [csvText, setCsvText] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'issues'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    success: boolean;
    message: string;
    committedCount?: number;
    isDemo?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse and audit results in real-time
  const parseResult = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseGradeCsv(csvText, knownCourses);
  }, [csvText, knownCourses]);

  const rows = parseResult?.rows || [];
  const summary = parseResult?.summary;

  const filteredRows = useMemo(() => {
    if (filterMode === 'valid') {
      return rows.filter((r) => r.status === 'valid');
    }
    if (filterMode === 'issues') {
      return rows.filter((r) => r.status === 'error' || r.status === 'warning');
    }
    return rows;
  }, [rows, filterMode]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setCommitResult(null);
      }
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gradeflow_results_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function loadSampleData() {
    setCsvText(SAMPLE_CSV);
    setCommitResult(null);
  }

  async function handleCommit() {
    if (!parseResult || parseResult.summary.validRows === 0) return;
    setIsSubmitting(true);
    setCommitResult(null);

    try {
      const res = await fetch('/api/results/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parseResult.rows }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommitResult({
          success: false,
          message: data.error || 'Failed to commit grade records',
        });
      } else {
        setCommitResult({
          success: true,
          message: data.message,
          committedCount: data.committedCount,
          isDemo: data.isDemo,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setCommitResult({
        success: false,
        message: err?.message || 'Network error communicating with batch import API',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Importer Control Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill">Faculty & Registry Tool</span>
              <span className="text-xs text-slate-400 font-medium">IPAM 30/70 Engine</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Batch CSV Grade Importer & Validation Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload class broadsheets in CSV format. Scores are validated against IPAM 30/70 weighting with half-up rounding.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
            <button
              type="button"
              onClick={loadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load IPAM Sample Class</span>
            </button>
          </div>
        </div>

        {/* Upload Zone & Textarea */}
        <div className="pt-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv,text/plain"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group"
          >
            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
            <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
              Click to select or drag & drop a .CSV grade sheet
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports columns: <code className="font-mono text-slate-600">student_email</code>, <code className="font-mono text-slate-600">course_code</code>, <code className="font-mono text-slate-600">ca_score</code> (30%), <code className="font-mono text-slate-600">exam_score</code> (70%)
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Paste CSV Content Directly:
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => setCsvText('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Clear Data
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setCommitResult(null);
              }}
              placeholder="Paste comma-separated rows with student_email, course_code, ca_score, exam_score..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Audit & Metrics Overview */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Rows</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalRows}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Class entries</p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-xs">
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Valid Rows</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{summary.validRows}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Ready to commit</p>
          </div>

          <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-xs">
            <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">Errors / Issues</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{summary.errorRows}</p>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Require review</p>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-xs">
            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Class Average</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{summary.classAverage}</p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Score out of 100</p>
          </div>

          <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-xs col-span-2 sm:col-span-1">
            <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">Pass Rate</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{summary.passRate}%</p>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Grade ≥ C- (2.0)</p>
          </div>
        </div>
      )}

      {/* Commit Result Banner */}
      {commitResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-medium ${
            commitResult.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {commitResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{commitResult.success ? 'Batch Ingestion Complete' : 'Import Error'}</p>
            <p className="mt-0.5 text-slate-700">{commitResult.message}</p>
            {commitResult.isDemo && (
              <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                Note: Evaluated in administrative sandbox mode. Changes will be persisted to live database once Supabase schema is active.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation Table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter View:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('valid')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterMode === 'valid' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid Only ({summary?.validRows})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('issues')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterMode === 'issues' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Issues Only ({summary?.errorRows})
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !summary || summary.validRows === 0}
              onClick={handleCommit}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Batch...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Commit {summary?.validRows} Valid Records to Database</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">Row</th>
                  <th className="py-3 px-3">Student Identifier / Email</th>
                  <th className="py-3 px-3">Candidate Name</th>
                  <th className="py-3 px-3 text-center">Course</th>
                  <th className="py-3 px-3 text-center">CA (30)</th>
                  <th className="py-3 px-3 text-center">Exam (70)</th>
                  <th className="py-3 px-3 text-center">Total (100)</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">GP</th>
                  <th className="py-3 px-3 text-center">QP</th>
                  <th className="py-3 px-3 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredRows.map((r) => {
                  const isErr = r.status === 'error';
                  const isWarn = r.status === 'warning';
                  return (
                    <tr
                      key={r.rowNumber}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isErr ? 'bg-rose-50/30' : isWarn ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{r.rowNumber}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                        {r.studentIdentifier || <span className="text-rose-500 italic">Missing</span>}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {r.studentName || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{r.courseCode}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{r.caScore ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{r.examScore ?? '—'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {r.roundedTotal !== null && r.roundedTotal !== undefined ? r.roundedTotal : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.calculatedGrade ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-black text-[11px] ${
                              r.calculatedGrade === 'A' || r.calculatedGrade === 'B+'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.calculatedGrade === 'F'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.calculatedGrade}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {r.gradePoint !== null && r.gradePoint !== undefined ? formatGPA(r.gradePoint) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-900">
                        {r.qualityPoints !== null && r.qualityPoints !== undefined
                          ? r.qualityPoints.toFixed(2)
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {isErr ? (
                          <span
                            className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                            title={r.errors.join('; ')}
                          >
                            <XCircle className="w-3 h-3 text-rose-600" />
                            {r.errors[0]}
                          </span>
                        ) : isWarn ? (
                          <span
                            className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                            title={r.warnings.join('; ')}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
