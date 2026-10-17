'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Lock, Mail, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  function onDemoAccess() {
    document.cookie = 'gf_demo_session=true; path=/; max-age=86400';
    router.push(next);
    router.refresh();
  }

  return (
    <Shell>
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <span className="pill mb-2">Student Authentication</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to GradeFlow
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Access your verified academic records, GPA calculator, and transcripts.
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
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
                <LogIn className="w-4 h-4" />
                {loading ? 'Authenticating…' : 'Sign In to Dashboard'}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white px-2 text-slate-400 font-semibold">Or Instant Access</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onDemoAccess}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Explore with Demo Student Account
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              New to GradeFlow?{' '}
              <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800">
                Create a student account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
