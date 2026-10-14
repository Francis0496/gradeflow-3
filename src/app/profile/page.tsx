'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
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
    <Shell signedIn>
      <div className="page" style={{ maxWidth: 520 }}>
        <h1>Profile</h1>
        <form className="form card" onSubmit={onSave}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)}>
            <option value="">Select programme</option>
            {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn" type="submit">Save</button>
          {message && <p>{message}</p>}
        </form>
      </div>
    </Shell>
  );
}
