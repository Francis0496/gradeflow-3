'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ClaimAdmin() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onClaim() {
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const { data, error } = await supabase.rpc('claim_first_admin');
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    if (data === 'ok') {
      router.refresh();
      return;
    }
    setMessage(String(data ?? 'Could not claim admin'));
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button className="btn" type="button" onClick={onClaim} disabled={loading}>
        {loading ? 'Claiming…' : 'Claim admin access'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
