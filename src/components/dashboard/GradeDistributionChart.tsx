'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface GradeDist {
  grade: string;
  count: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a', // Emerald 600
  'B+': '#2563eb', // Blue 600
  B: '#3b82f6', // Blue 500
  'B-': '#60a5fa', // Blue 400
  'C+': '#f59e0b', // Amber 500
  C: '#d97706', // Amber 600
  'C-': '#ea580c', // Orange 600
  D: '#dc2626', // Red 600
  E: '#b91c1c', // Red 700
  F: '#991b1b', // Red 800
};

export default function GradeDistributionChart({ data }: { data: GradeDist[] }) {
  const hasData = data && data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm font-medium">No grade distribution data available.</p>
        <p className="text-xs text-slate-400 mt-1">Grades earned will be categorized here.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <XAxis
            dataKey="grade"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            allowDecimals={false}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-100 text-xs font-medium">
                    <p className="text-slate-700">Grade <span className="font-bold">{label}</span>: {payload[0]?.value} course(s)</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
