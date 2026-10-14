'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

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
    if (!configured) { setError('Supabase is not configured on this deployment.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (err) { setError(err.message); return; }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, email });
        await supabase.from('role_assignments').upsert({ user_id: data.user.id, role: 'student' });
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="page" style={{ maxWidth: 460 }}>
        <h1>Create account</h1>
        {!configured && <p className="error">Supabase env vars are missing on this deployment.</p>}
        <form className="form card" onSubmit={onSubmit}>
          <input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          <p style={{ margin: 0, fontSize: 14 }}>Already registered? <Link href="/login">Sign in</Link></p>
        </form>
      </div>
    </Shell>
  );
}
