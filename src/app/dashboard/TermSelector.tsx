'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

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
    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
      <Calendar className="w-3.5 h-3.5 text-blue-600" />
      <span className="text-slate-500 font-medium">Selected Term:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
      >
        <option value="">All Semesters (Cumulative)</option>
        {terms.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
