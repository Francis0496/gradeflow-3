import Link from 'next/link';
import { getClassification } from '@/lib/academics';

export default function DashboardPage() {
  const gpa = 3.35;
  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#52525b' }}>IPAM · BSc Information Technology</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 24 }}>
        {[['Semester GPA', gpa.toFixed(2)], ['CGPA', gpa.toFixed(2)], ['Credits', '15.0'], ['Standing', getClassification(gpa)]].map(([l, v]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#71717a' }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <nav style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/results">Results</Link>
        <Link href="/simulator">Simulator</Link>
        <Link href="/transcript">Transcript</Link>
        <Link href="/courses">Courses</Link>
      </nav>
    </div>
  );
}
