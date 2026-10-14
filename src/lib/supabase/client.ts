import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function createServerSupabaseClient() {
  const { cookies: getCookies } = await import('next/headers');
  const cookieStore = await getCookies();

  function setAll(cookiesToSet: CookieToSet[]): void {
    try {
      for (const cookie of cookiesToSet) {
        const name: string = cookie.name;
        const value: string = cookie.value;
        cookieStore.set(name, value, cookie.options as never);
      }
    } catch {
      /* Server Component */
    }
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';
}
