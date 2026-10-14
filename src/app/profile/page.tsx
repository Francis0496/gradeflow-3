'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Programme { id: string; name: string; }

export default function ProfilePage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: progs } = await supabase.from('programmes').select('id, name').order('name');
      setProgrammes(progs ?? []);
      const { data: profile } = await supabase.from('profiles').select('full_name, programme_id').eq('id', user.id).maybeSingle();
      if (profile) {
        setName(profile.full_name ?? '');
        setProgrammeId(profile.programme_id ?? '');
      }
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      email: user.email,
      programme_id: programmeId || null,
    });
    setMessage(error ? error.message : 'Profile saved');
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Profile</h1>
      <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
        <label>Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }} />
        </label>
        <label>Programme
          <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginTop: 4 }}>
            <option value="">Select programme</option>
            {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Save</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
