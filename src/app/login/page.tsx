export default function LoginPage() {
  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Sign in</h1>
      <form style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Email" required style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        <input type="password" placeholder="Password" required style={{ padding: 10, border: '1px solid #d4d4d8', borderRadius: 6 }} />
        <button type="submit" style={{ background: '#1d4ed8', color: '#fff', padding: 10, border: 0, borderRadius: 6 }}>Sign in</button>
      </form>
      <p style={{ fontSize: 14, color: '#71717a' }}>Auth will connect to Supabase.</p>
    </div>
  );
}
