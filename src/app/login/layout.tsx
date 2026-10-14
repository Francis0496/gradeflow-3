import { Suspense } from 'react';
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p style={{ padding: 24 }}>Loading…</p>}>{children}</Suspense>;
}
