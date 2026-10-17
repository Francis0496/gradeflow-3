'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClaimAdmin() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onClaim() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('claim_first_admin');
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    if (data === 'ok') {
      setMessage({ type: 'success', text: 'Admin privileges successfully claimed! Refreshing…' });
      setTimeout(() => {
        router.refresh();
      }, 1000);
      return;
    }
    setMessage({ type: 'error', text: String(data ?? 'Could not claim admin privileges.') });
  }

  return (
    <div className="mt-4 p-5 rounded-xl bg-blue-50/60 border border-blue-200">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-900">Initial System Bootstrap</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            If you are configuring the GradeFlow 3.0 platform for your institution and no administrator exists yet, you can claim bootstrap admin access.
          </p>

          {message && (
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

          <button
            type="button"
            onClick={onClaim}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            {loading ? 'Verifying & Claiming…' : 'Claim First Administrator Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
