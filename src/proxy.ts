import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  function setAll(cookiesToSet: CookieToSet[]): void {
    for (const cookie of cookiesToSet) {
      request.cookies.set(cookie.name, cookie.value);
    }
    response = NextResponse.next({ request });
    for (const cookie of cookiesToSet) {
      response.cookies.set(cookie.name, cookie.value, cookie.options as never);
    }
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll,
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard', '/results', '/simulator', '/transcript', '/admin', '/profile', '/planner', '/resources'];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + '/'));

  const isDemo = request.cookies.get('gf_demo_session')?.value === 'true' || request.headers.get('x-demo-session') === 'true';

  if (isProtected && !user && !isDemo) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', path);
    return NextResponse.redirect(redirect);
  }

  if ((path === '/login' || path === '/register') && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/dashboard';
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/results/:path*', '/simulator/:path*', '/transcript/:path*', '/admin/:path*', '/profile/:path*', '/planner/:path*', '/resources/:path*', '/login', '/register'],
};
