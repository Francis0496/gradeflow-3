import Link from 'next/link';

export default function Shell({ children, signedIn = false }: { children: React.ReactNode; signedIn?: boolean }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="mark" /> GradeFlow</Link>
        <nav className="nav">
          <Link href="/courses">Catalogue</Link>
          {signedIn ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/results">Results</Link>
              <Link href="/transcript">Transcript</Link>
              <Link href="/simulator">Simulator</Link>
              <Link href="/profile">Profile</Link>
              <form action="/auth/signout" method="post"><button className="ghost" type="submit">Sign out</button></form>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="btn">Create account</Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
