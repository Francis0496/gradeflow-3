'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
    if (err) { setError(err.message); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        {error && <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p style={{ fontSize: 14 }}><Link href="/register">Create an account</Link></p>
    </div>
  );
}
