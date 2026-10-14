import Link from 'next/link';
import Shell from '@/components/Shell';

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <span className="pill">IPAM · University of Sierra Leone</span>
        <h1>Academic performance, clearly.</h1>
        <p className="lead">Official IPAM grading, credit-weighted GPA and CGPA, transcripts, and planning. Built for students by Sierra EduTech Solutions Limited.</p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn">Get started</Link>
          <Link href="/courses" className="btn secondary">Browse catalogue</Link>
        </div>
      </section>
      <section className="page">
        <div className="grid cards">
          {[
            ['GPA & CGPA', 'Credit-weighted calculations on the official 10-tier scale. Never an average of semester GPAs.'],
            ['Results', 'Enter CA and Exam. GradeFlow applies 30/70, half-up rounding, and the letter grade.'],
            ['Simulator', 'Model what-if grades and project the CGPA you need.'],
            ['Transcript', 'Unofficial preview with official course codes and a PDF export.'],
          ].map(([t, d]) => (
            <article key={t} className="card">
              <h3 style={{ margin: '0 0 8px' }}>{t}</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="footer">Institute of Public Administration and Management · University of Sierra Leone</footer>
    </Shell>
  );
}
