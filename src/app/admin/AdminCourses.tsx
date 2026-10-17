'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCredits } from '@/lib/academics';
import {
  PlusCircle,
  Link as LinkIcon,
  Copy,
  Power,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Upload,
  Layers,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
  is_active?: boolean | null;
}

interface Programme {
  id: string;
  name: string;
}

interface Link {
  programme_id: string;
  course_id: string;
  semester_number?: number;
  is_core?: boolean;
}

interface Faculty {
  id: string;
  name: string;
  is_active?: boolean;
  departments?: {
    id: string;
    name: string;
    programmes?: { id: string; name: string }[];
  }[];
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export default function AdminCourses({
  initialCourses,
  programmes,
  initialLinks,
  faculties = [],
  auditLogs = [],
}: {
  initialCourses: Course[];
  programmes: Programme[];
  initialLinks: Link[];
  faculties?: Faculty[];
  auditLogs?: AuditLog[];
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'catalogue' | 'import' | 'structure' | 'audit'>('catalogue');

  // Catalogue State
  const [courses, setCourses] = useState(
    initialCourses.map((c) => ({ ...c, is_active: c.is_active !== false }))
  );
  const [links, setLinks] = useState(initialLinks);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState(3.0);
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id ?? '');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [semester, setSemester] = useState(1);
  const [isCore, setIsCore] = useState(true);
  const [copyTo, setCopyTo] = useState(programmes[1]?.id ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Import State
  const [csvText, setCsvText] = useState(
    'DIT112,Object Oriented Programming,3.0\nDIS215,Advanced Database Systems,3.0'
  );
  const [importing, setImporting] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        credit_hours: credits,
        is_active: true,
      })
      .select('id, code, title, credit_hours, is_active')
      .single();

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    if (data) {
      setCourses((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
      setCode('');
      setTitle('');
      setCredits(3.0);
      setMessage({ type: 'success', text: `Added course ${data.code}: ${data.title}` });
    }
  }

  async function onLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const { error } = await supabase.from('programme_courses').upsert(
      {
        programme_id: programmeId,
        course_id: courseId,
        semester_number: semester,
        is_core: isCore,
      },
      { onConflict: 'programme_id,course_id,semester_number' }
    );
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setLinks((prev) => [
      ...prev,
      { programme_id: programmeId, course_id: courseId, semester_number: semester, is_core: isCore },
    ]);
    setMessage({ type: 'success', text: 'Course curriculum link updated.' });
  }

  async function onCopy() {
    if (!courseId || !copyTo) return;
    setMessage(null);
    const { error } = await supabase.from('programme_courses').upsert(
      {
        programme_id: copyTo,
        course_id: courseId,
        semester_number: semester,
        is_core: isCore,
      },
      { onConflict: 'programme_id,course_id,semester_number' }
    );
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setLinks((prev) => [
      ...prev,
      { programme_id: copyTo, course_id: courseId, semester_number: semester, is_core: isCore },
    ]);
    setMessage({ type: 'success', text: 'Course successfully copied to destination programme.' });
  }

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from('courses').update({ is_active: !active }).eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !active } : c)));
  }

  async function onBulkImport(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setMessage(null);

    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const recordsToInsert = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const cCode = parts[0].toUpperCase();
        const cTitle = parts[1];
        const cCredits = parts[2] ? parseFloat(parts[2]) : 3.0;
        recordsToInsert.push({
          code: cCode,
          title: cTitle,
          credit_hours: Number.isNaN(cCredits) ? 3.0 : cCredits,
          is_active: true,
        });
      }
    }

    if (recordsToInsert.length === 0) {
      setImporting(false);
      setMessage({ type: 'error', text: 'No valid course records found in CSV text.' });
      return;
    }

    const { data, error } = await supabase
      .from('courses')
      .upsert(recordsToInsert, { onConflict: 'code' })
      .select('id, code, title, credit_hours, is_active');

    setImporting(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    if (data) {
      setCourses((prev) => {
        const map = new Map(prev.map((c) => [c.code, c]));
        data.forEach((c) => map.set(c.code, c));
        return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
      });
      setMessage({
        type: 'success',
        text: `Successfully imported / updated ${data.length} course records.`,
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="pill">Administrative Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Institutional Administration Console
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage courses, configure programme curriculum trees, bulk-import units, and inspect audit logs.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('catalogue')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'catalogue'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Courses & Programme Links
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'import'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          Bulk Course Import (CSV)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'structure'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Faculties & Departments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Catalogue & Linking */}
      {activeTab === 'catalogue' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Course Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Add Single Course
              </h2>

              <form onSubmit={onAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code
                  </label>
                  <input
                    placeholder="e.g. DIT111"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course Title
                  </label>
                  <input
                    placeholder="e.g. Computer Programming"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Standard IPAM core units are 3.0 credits.</p>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Course Record
                </button>
              </form>
            </div>

            {/* Link / Copy Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-600" />
                Curriculum Programme Linkage
              </h2>

              <form onSubmit={onLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Programme
                  </label>
                  <select
                    value={programmeId}
                    onChange={(e) => setProgrammeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Semester (1–8)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCore}
                        onChange={(e) => setIsCore(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Compulsory Core Unit</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link to Programme
                  </button>

                  <div className="flex items-center gap-2">
                    <select
                      value={copyTo}
                      onChange={(e) => setCopyTo(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                    >
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={onCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Courses Catalogue List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-slate-900">Registered Courses Directory</h2>
              <span className="text-xs text-slate-400">{courses.length} Courses Total</span>
            </div>

            <div className="divide-y divide-slate-100">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-xs mr-2">{c.code}</span>
                    <span className="text-xs text-slate-700 mr-2">{c.title}</span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {formatCredits(c.credit_hours)} Cr
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(c.id, Boolean(c.is_active))}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      c.is_active
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {c.is_active ? 'Active' : 'Deactivated'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bulk CSV Import */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Controlled Batch Course Import
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Paste comma-separated course values in format: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">CODE, TITLE, CREDITS</code>.
            </p>
          </div>

          <form onSubmit={onBulkImport} className="space-y-4">
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="DIT111, Computer Programming, 3.0&#10;DAA112, Mathematics for IT, 3.0"
            />

            <button
              type="submit"
              disabled={importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Processing Batch…' : 'Process and Import Courses'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Structure */}
      {activeTab === 'structure' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Institutional Academic Hierarchy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Structure: University of Sierra Leone → IPAM → Faculties → Departments → Programmes
            </p>
          </div>

          <div className="space-y-4">
            {faculties.map((f) => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{f.name}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      f.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.is_active ? 'Active Faculty' : 'Inactive'}
                  </span>
                </div>

                {f.departments && f.departments.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2 border-l-2 border-slate-200 pl-3">
                    {f.departments.map((d) => (
                      <div key={d.id} className="text-xs text-slate-700">
                        <p className="font-semibold">{d.name}</p>
                        {d.programmes && (
                          <div className="ml-3 mt-1 flex flex-wrap gap-1.5">
                            {d.programmes.map((p) => (
                              <span key={p.id} className="pill text-[10px]">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-700" />
              Administrative Governance Audit Logs
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Immutable security record of administrative privileges and system changes.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No governance audit logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 uppercase">{log.action}</span>
                    <span className="text-slate-500 ml-2">on {log.entity_type}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
