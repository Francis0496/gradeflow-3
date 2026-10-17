'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import { User, BookOpen, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface Programme {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Year 1');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');

      const { data: progs } = await supabase.from('programmes').select('id, name').order('name');
      setProgrammes(progs ?? []);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, programme_id, academic_level')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setName(profile.full_name ?? '');
        setProgrammeId(profile.programme_id ?? '');
        setAcademicLevel(profile.academic_level ?? 'Year 1');
      }
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      email: user.email,
      programme_id: programmeId || null,
      academic_level: academicLevel,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Student profile updated successfully.' });
    }
  }

  return (
    <Shell signedIn userEmail={email}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <span className="pill mb-1">Account & Academic Scope</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Profile Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal academic identity and registered degree programme.
          </p>
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={onSave} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Candidate Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Samuel Koroma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Registered University Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Provided by Supabase Authentication</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Undergraduate Programme
              </label>
              <select
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select your registered programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Filters your courses on Results, Study Planner, and Transcripts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Current Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Year 1">Year 1 (Freshman)</option>
                <option value="Year 2">Year 2 (Sophomore)</option>
                <option value="Year 3">Year 3 (Junior)</option>
                <option value="Year 4">Year 4 (Senior)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Profile…' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
