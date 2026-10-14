'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TermSelector({ terms, current }: { terms: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set('term', value);
    else next.delete('term');
    router.push(`/dashboard?${next.toString()}`);
  }

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
      Term
      <select value={current} onChange={(e) => onChange(e.target.value)} style={{ padding: 6 }}>
        <option value="">All (CGPA)</option>
        {terms.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </label>
  );
}
