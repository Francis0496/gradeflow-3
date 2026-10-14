# Auth setup

## Vercel environment variables
Add these to the Vercel project (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://yaiqyxvuqssbnfmxrykh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ya1ZQ-OV5ylUH-LG9kAePw_UoXBIfxU
```

Then redeploy.

## Supabase
1. Authentication → Providers: Email enabled.
2. For testing, disable “Confirm email” or use the confirmation link.
3. Apply `20261014000000_auth_profile_trigger.sql` so signup creates a profile and student role.

## Behaviour
- `/login` and `/register` call Supabase Auth.
- Middleware protects `/dashboard`, `/results`, `/simulator`, `/transcript`.
- Unauthenticated users are sent to `/login?next=...`.
