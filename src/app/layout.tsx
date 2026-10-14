import './globals.css';
export const metadata = { title: 'GradeFlow 3.0', description: 'Academic performance for IPAM' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
