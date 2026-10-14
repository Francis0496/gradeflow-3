import Link from 'next/link';
export default function HomePage() {
  return (
    <div>
      <header style={{ borderBottom: '1px solid #e4e4e7', background: '#fff', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>GradeFlow 3.0</div>
        <nav>
          <Link href="/login" style={{ marginRight: '1rem', color: '#3f3f46' }}>Sign in</Link>
          <Link href="/register" style={{ background: '#1d4ed8', color: '#fff', padding: '0.5rem 1rem', borderRadius: 6 }}>Get started</Link>
        </nav>
      </header>
      <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Academic performance, clearly.</h1>
        <p style={{ color: '#52525b', fontSize: '1.1rem' }}>GPA, CGPA, transcripts, and planning for IPAM students. Built by Sierra EduTech Solutions Limited.</p>
        <div style={{ marginTop: '2rem' }}>
          <Link href="/dashboard" style={{ background: '#1d4ed8', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 6, marginRight: 8 }}>Open dashboard</Link>
          <Link href="/login" style={{ border: '1px solid #d4d4d8', padding: '0.6rem 1.2rem', borderRadius: 6 }}>Sign in</Link>
        </div>
      </main>
      <section style={{ maxWidth: 900, margin: '3rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[['GPA & CGPA', 'Credit-weighted calculations with the official 10-tier scale.'], ['Results', 'Enter CA and Exam scores. See letter grades instantly.'], ['Simulator', 'Model what-if grades and project your target CGPA.'], ['Transcript', 'Unofficial preview with official course codes.']].map(([t, d]) => (
          <div key={t} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{t}</h3>
            <p style={{ margin: 0, color: '#71717a', fontSize: 14 }}>{d}</p>
          </div>
        ))}
      </section>
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa', fontSize: 13 }}>Institute of Public Administration and Management · University of Sierra Leone</footer>
    </div>
  );
}
