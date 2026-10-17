'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserPlus, User, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!configured) {
      setError('Supabase credentials are not configured on this environment.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, email });
        await supabase.from('role_assignments').upsert({ user_id: data.user.id, role: 'student' });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <span className="pill mb-2">Student Onboarding</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create GradeFlow Account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Start managing your IPAM academic standing and GPA calculations.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Candidate Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Marian Turay"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="student@ipam.edu.sl"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                {loading ? 'Creating Student Account…' : 'Register Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign in to existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
