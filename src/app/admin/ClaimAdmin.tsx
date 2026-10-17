'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function ClaimAdmin() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'bootstrap'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onClaim() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('claim_first_admin');
    setLoading(false);

    if (error) {
      if (
        error.message.includes('schema cache') ||
        error.message.includes('claim_first_admin') ||
        error.code === 'PGRST202'
      ) {
        setMessage({
          type: 'bootstrap',
          text: 'Database schema is not yet initialized in Supabase. The required tables (role_assignments, programme_courses, etc.) and claim_first_admin function must be created.',
        });
        return;
      }
      setMessage({ type: 'error', text: error.message });
      return;
    }

    if (data === 'ok') {
      setMessage({ type: 'success', text: 'Admin privileges successfully claimed! Refreshing console…' });
      setTimeout(() => {
        router.refresh();
      }, 1000);
      return;
    }

    setMessage({ type: 'error', text: String(data ?? 'Could not claim admin privileges.') });
  }

  async function onCopySQL() {
    try {
      const res = await fetch('/api/bootstrap-sql');
      const sql = await res.text();
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.open('/api/bootstrap-sql', '_blank');
    }
  }

  function onEnableDemoAdmin() {
    document.cookie = 'gf_demo_admin=true; path=/; max-age=86400';
    document.cookie = 'gf_demo_session=true; path=/; max-age=86400';
    router.refresh();
  }

  return (
    <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Initial System Bootstrap</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            If you are configuring GradeFlow 3.0 for your institution and no administrator exists yet, you can claim bootstrap admin access.
          </p>

          {message?.type === 'bootstrap' && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Supabase PostgreSQL Schema Setup Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your remote Supabase project at <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[11px]">yaiqyxvuqssbnfmxrykh</code> needs the initial database tables and permissions created.
              </p>

              <div className="p-3 bg-white/80 rounded-lg border border-amber-200/60 space-y-2 text-xs">
                <p className="font-semibold text-slate-900">Quick 2-Step Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                  <li>Copy the unified <code className="font-mono text-blue-700">COMPLETE_SYSTEM_BOOTSTRAP.sql</code> script below.</li>
                  <li>Paste into your Supabase SQL Editor and click <strong className="text-slate-900">Run</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCopySQL}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Bootstrap SQL'}
                </button>

                <a
                  href="/api/bootstrap-sql"
                  download="COMPLETE_SYSTEM_BOOTSTRAP.sql"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Download .sql File
                </a>

                <a
                  href="https://supabase.com/dashboard/project/yaiqyxvuqssbnfmxrykh/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Supabase SQL Editor
                </a>
              </div>
            </div>
          )}

          {message && message.type !== 'bootstrap' && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClaim}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              {loading ? 'Verifying & Claiming…' : 'Claim First Administrator Access'}
            </button>

            <button
              type="button"
              onClick={onEnableDemoAdmin}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Instant Demo Admin Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
