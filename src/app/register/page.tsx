'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, email });
      await supabase.from('role_assignments').upsert({ user_id: data.user.id, role: 'student' });
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        <input type="password" placeholder="Password (min 6)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        {error && <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p style={{ fontSize: 14 }}><Link href="/login">Already have an account? Sign in</Link></p>
    </div>
  );
}
