-- Student programme selection on profile.
alter table public.profiles add column if not exists programme_id uuid references public.programmes(id);
