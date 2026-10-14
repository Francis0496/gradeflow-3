export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#52525b' }}>IPAM · BSc Information Technology</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 24 }}>
        {[['Semester GPA', '3.35'], ['CGPA', '3.35'], ['Credits', '15.0'], ['Standing', 'Second Class (1st Div)']].map(([l, v]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#71717a' }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24, fontSize: 13, color: '#a1a1aa' }}>Sample data. Live Supabase connection follows.</p>
    </div>
  );
}
