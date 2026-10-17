import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST() {
  try {
    const cookieStore = await cookies();
    // 1. Enable Demo Admin cookie for immediate session clearance
    cookieStore.set('gf_demo_admin', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: 'lax',
    });
    cookieStore.set('gf_demo_session', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
      sameSite: 'lax',
    });

    // 2. Also attempt to persist admin role in live Supabase database
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let dbPersisted = false;
    if (user) {
      const { error } = await supabase
        .from('role_assignments')
        .upsert(
          { user_id: user.id, role: 'admin' },
          { onConflict: 'user_id,role' }
        );

      if (!error) {
        dbPersisted = true;
      }
    }

    return NextResponse.json({
      success: true,
      userEmail: user?.email ?? 'Demo Administrator',
      dbPersisted,
      message: 'Administrator capabilities successfully granted!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to enable admin' },
      { status: 500 }
    );
  }
}
