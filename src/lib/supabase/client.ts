import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function createServerSupabaseClient() {
  const { cookies: getCookies } = await import('next/headers');
  const cookieStore = await getCookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* server component */
        }
      },
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';
}
