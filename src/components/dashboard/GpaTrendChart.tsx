'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface GpaPoint {
  term: string;
  gpa: number;
  cgpa: number;
}

export default function GpaTrendChart({ data }: { data: GpaPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm font-medium">No semester trend data available yet.</p>
        <p className="text-xs text-slate-400 mt-1">Record results for multiple semesters to see your GPA progression.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="term"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[0, 4.0]}
            ticks={[0, 1.0, 2.0, 3.0, 4.0]}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800 mb-1">{label}</p>
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <span>Term GPA:</span>
                      <span>{Number(payload[0]?.value).toFixed(2)}</span>
                    </div>
                    {payload[1] && (
                      <div className="flex items-center gap-2 text-indigo-600 font-medium mt-0.5">
                        <span>CGPA:</span>
                        <span>{Number(payload[1]?.value).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            name="Semester GPA"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#93c5fd', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="cgpa"
            name="Cumulative CGPA"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
