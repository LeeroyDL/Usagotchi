-- Usagotchi Supabase setup (copy/paste into Supabase SQL Editor and RUN)

-- 1) Shared creature (one row)
create table if not exists public.creature (
  id uuid primary key default gen_random_uuid(),
  name text default 'Usagotchi',
  level int default 1,
  xp int default 0,
  stage int default 1,
  created_at timestamptz default now()
);

-- 2) Daily check-ins (one per user per day)
create table if not exists public.daily_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action_date date not null,
  checked_in boolean default false,
  mood text,
  note text,
  created_at timestamptz default now(),
  unique(user_id, action_date)
);

-- 3) Pair bonus lock (prevents double-awarding the "both checked in" bonus)
create table if not exists public.daily_pair_bonus (
  action_date date primary key,
  created_at timestamptz default now()
);

-- 4) App settings (one row)
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  reminders_enabled boolean default true,
  created_at timestamptz default now()
);

-- Seed: one creature + one settings row (safe to run once; if already exists, ignore errors)
insert into public.creature (name) values ('Usagotchi');
insert into public.app_settings default values;

-- RLS: we keep these tables private. Server routes use the SERVICE ROLE key.
alter table public.creature enable row level security;
alter table public.daily_actions enable row level security;
alter table public.daily_pair_bonus enable row level security;
alter table public.app_settings enable row level security;

-- Deny all from anon/auth users (server routes will access using service role)
drop policy if exists "deny_all_creature" on public.creature;
create policy "deny_all_creature" on public.creature for all using (false) with check (false);

drop policy if exists "deny_all_daily_actions" on public.daily_actions;
create policy "deny_all_daily_actions" on public.daily_actions for all using (false) with check (false);

drop policy if exists "deny_all_daily_pair_bonus" on public.daily_pair_bonus;
create policy "deny_all_daily_pair_bonus" on public.daily_pair_bonus for all using (false) with check (false);

drop policy if exists "deny_all_app_settings" on public.app_settings;
create policy "deny_all_app_settings" on public.app_settings for all using (false) with check (false);
