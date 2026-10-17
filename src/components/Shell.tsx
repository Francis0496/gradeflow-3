'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  FileSpreadsheet,
  Calculator,
  CalendarCheck,
  FileText,
  BookOpen,
  User,
  Shield,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  signedIn?: boolean;
  userEmail?: string;
}

export default function Shell({ children, signedIn = false, userEmail }: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Results', href: '/results', icon: FileSpreadsheet },
    { name: 'Simulator', href: '/simulator', icon: Calculator },
    { name: 'Planner', href: '/planner', icon: CalendarCheck },
    { name: 'Resources', href: '/resources', icon: BookOpen },
    { name: 'Transcript', href: '/transcript', icon: FileText },
    { name: 'Catalogue', href: '/courses', icon: GraduationCap },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Admin', href: '/admin', icon: Shield },
  ];

  const publicNav = [
    { name: 'Catalogue', href: '/courses', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                  GradeFlow
                </span>
                <span className="text-[10px] font-semibold text-blue-600 -mt-1 tracking-wider uppercase">
                  IPAM · USL
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {signedIn ? (
              <>
                {studentNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-640 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="h-5 w-px bg-slate-200 mx-2" />
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                {publicNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="h-5 w-px bg-slate-200 mx-2" />
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm shadow-blue-600/30 transition-all hover:shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  Create account
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {signedIn ? (
              <>
                {studentNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      {item.name}
                    </Link>
                  );
                })}
                <form action="/auth/signout" method="post" className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                {publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </Link>
                ))}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-blue-700"
                  >
                    Create account
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GradeFlow 3.0</span>
            <span>·</span>
            <span>Sierra EduTech Solutions Limited</span>
          </div>
          <div>
            Institute of Public Administration and Management (IPAM) · University of Sierra Leone
          </div>
        </div>
      </footer>
    </div>
  );
}
