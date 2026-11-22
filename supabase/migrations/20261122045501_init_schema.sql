-- every table starts with revoke all from anon and authenticated
-- that way default Supabase grants cannot override column-level grants on puzzles.answer and profiles.role

-- shared content

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  language text not null check (language in ('javascript', 'python')),
  description text not null default '',
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'coming_soon', 'disabled'))
);
revoke all on public.tracks from anon, authenticated;
grant select on public.tracks to anon, authenticated;
grant select, insert, update, delete on public.tracks to service_role;
alter table public.tracks enable row level security;
create policy "tracks are public" on public.tracks for select to anon, authenticated using (true);

create table public.adventures (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks on delete cascade,
  slug text not null,
  title text not null,
  summary text not null default '',
  sort_order int not null,
  -- array of { slug, name, description, lesson }
  -- concept slugs are checked in app code, not by FK
  concepts jsonb not null default '[]'::jsonb check (jsonb_typeof(concepts) = 'array'),
  unique (track_id, slug),
  -- deferred, so the seed script can reorder adventures in one upsert
  unique (track_id, sort_order) deferrable initially deferred
);
revoke all on public.adventures from anon, authenticated;
grant select on public.adventures to anon, authenticated;
grant select, insert, update, delete on public.adventures to service_role;
alter table public.adventures enable row level security;
create policy "adventures are public" on public.adventures for select to anon, authenticated using (true);

create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures on delete cascade,
  concept text not null, -- concept slug from adventures.concepts, or 'boss'
  kind text not null check (kind in ('mcq', 'short', 'code')),
  difficulty int not null check (difficulty between 1 and 5),
  theme text not null default 'fantasy',
  title text not null,
  description text not null,
  content jsonb not null, -- player-visible prompt, options, or starter code and sample tests
  answer jsonb not null, -- server-only solution, rubric, or hidden tests
  status text not null default 'draft' check (status in ('draft', 'validated', 'flagged', 'disabled')),
  generation_log jsonb, -- server-only generator run log
  created_at timestamptz not null default now()
);
create index on public.puzzles (adventure_id, concept);
revoke all on public.puzzles from anon, authenticated;
-- column-level select keeps answer and generation_log server-only
-- clients must name columns; select("*") fails
grant select (id, adventure_id, concept, kind, difficulty, theme, title, description, content, status, created_at)
  on public.puzzles to authenticated;
grant select, insert, update on public.puzzles to service_role;
alter table public.puzzles enable row level security;
-- select policy is defined after public.encounters because it joins on encounters

-- per player

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique,
  role text not null default 'learner' check (role in ('learner', 'admin')),
  preferences jsonb not null default '{}'::jsonb -- {} means all defaults
    check (char_length(coalesce(preferences ->> 'note', '')) <= 300),
  created_at timestamptz not null default now()
);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, preferences) on public.profiles to authenticated; -- not role
grant select, insert, update, delete on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile: read" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table public.track_progress (
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  track_id uuid not null references public.tracks on delete cascade,
  xp int not null default 0 check (xp >= 0), -- level is derived from xp, never stored
  primary key (user_id, track_id)
);
revoke all on public.track_progress from anon, authenticated;
grant select, insert, update on public.track_progress to authenticated;
grant select, insert, update, delete on public.track_progress to service_role;
alter table public.track_progress enable row level security;
create policy "own progress: read" on public.track_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own progress: insert" on public.track_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own progress: update" on public.track_progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- server writes messages
create table public.adventure_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  adventure_id uuid not null references public.adventures on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  story_summary text,
  messages jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, adventure_id)
);
create index on public.adventure_runs (adventure_id);
revoke all on public.adventure_runs from anon, authenticated;
grant select, insert, update on public.adventure_runs to authenticated;
grant select, insert, update, delete on public.adventure_runs to service_role;
alter table public.adventure_runs enable row level security;
create policy "own runs: read" on public.adventure_runs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own runs: insert" on public.adventure_runs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own runs: update" on public.adventure_runs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  run_id uuid not null references public.adventure_runs on delete cascade,
  puzzle_id uuid not null references public.puzzles,
  enemy_name text not null,
  enemy_sprite text not null, -- a slug from content/sprites.ts
  enemy_color text not null check (enemy_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_boss boolean not null default false,
  status text not null default 'active' check (status in ('active', 'defeated', 'fled', 'lost')),
  basic_hints int not null default 0 check (basic_hints >= 0),
  xp_awarded int not null default 0 check (xp_awarded >= 0),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index encounters_one_active_per_run on public.encounters (run_id) where status = 'active';
create index on public.encounters (user_id);
create index on public.encounters (run_id, created_at);
create index on public.encounters (puzzle_id);
revoke all on public.encounters from anon, authenticated;
grant select, insert, update on public.encounters to authenticated;
grant select, insert, update, delete on public.encounters to service_role;
alter table public.encounters enable row level security;
create policy "own encounters: read" on public.encounters for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own encounters: insert" on public.encounters for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own encounters: update" on public.encounters for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- players also keep read access to puzzles they already fought even if flagged or disabled later
create policy "puzzles: validated, or met in a fight" on public.puzzles for select to authenticated
  using (
    status = 'validated'
    or exists (
      select 1 from public.encounters e
       where e.puzzle_id = puzzles.id and e.user_id = (select auth.uid())
    )
  );

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  encounter_id uuid not null references public.encounters on delete cascade,
  answer text not null,
  passed boolean not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.attempts (user_id);
create index on public.attempts (encounter_id);
revoke all on public.attempts from anon, authenticated;
grant select, insert, update on public.attempts to authenticated;
grant select, insert, update, delete on public.attempts to service_role;
alter table public.attempts enable row level security;
create policy "own attempts: read" on public.attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own attempts: insert" on public.attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own attempts: update" on public.attempts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- valid item slugs are defined in app code
create table public.inventory (
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  item_slug text not null,
  quantity int not null default 0 check (quantity >= 0),
  primary key (user_id, item_slug)
);
revoke all on public.inventory from anon, authenticated;
grant select, insert, update on public.inventory to authenticated;
grant select, insert, update, delete on public.inventory to service_role;
alter table public.inventory enable row level security;
create policy "own inventory: read" on public.inventory for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own inventory: insert" on public.inventory for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own inventory: update" on public.inventory for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- written only through bump_usage
create table public.ai_usage (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null default current_date,
  ai_requests int not null default 0,
  sandbox_runs int not null default 0,
  primary key (user_id, day)
);
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
grant select, insert, update on public.ai_usage to service_role;
alter table public.ai_usage enable row level security;
create policy "own usage: read" on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

-- operational log for sandbox or AI failures and reported puzzles
-- user_id goes null on account delete so the rows stay
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.events (user_id);
create index on public.events (type, created_at);
revoke all on public.events from anon, authenticated;
grant select on public.events to authenticated;
grant select, insert on public.events to service_role;
alter table public.events enable row level security;
create policy "own events: read" on public.events for select to authenticated
  using ((select auth.uid()) = user_id);

-- functions

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'player_' || left(new.id::text, 8)));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- runs before login, when anon cannot read public.profiles
create function public.username_available(p_username text)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select not exists (select 1 from public.profiles where username = p_username);
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- atomically settles an active encounter win: attempt, XP, and loot
-- runs as invoker so RLS applies
create function public.settle_encounter(
  p_encounter_id uuid, p_answer text, p_result jsonb, p_xp int, p_items text[]
)
returns boolean
language plpgsql
security invoker set search_path = ''
as $$
declare
  v_run uuid;
  v_track uuid;
begin
  update public.encounters
     set status = 'defeated', xp_awarded = p_xp, ended_at = now()
   where id = p_encounter_id and status = 'active'
  returning run_id into v_run;
  if v_run is null then
    return false; -- already settled, fled or lost
  end if;

  insert into public.attempts (encounter_id, answer, passed, result)
  values (p_encounter_id, p_answer, true, p_result);

  select a.track_id into v_track
    from public.adventure_runs r join public.adventures a on a.id = r.adventure_id
   where r.id = v_run;
  update public.track_progress set xp = xp + p_xp
   where user_id = (select auth.uid()) and track_id = v_track;

  insert into public.inventory as inv (item_slug, quantity)
  select slug, count(*) from unnest(p_items) as slug group by slug
  on conflict (user_id, item_slug) do update set quantity = inv.quantity + excluded.quantity;

  return true;
end;
$$;
revoke execute on function public.settle_encounter(uuid, text, jsonb, int, text[]) from public, anon;
grant execute on function public.settle_encounter(uuid, text, jsonb, int, text[]) to authenticated;

-- increments daily usage and returns true while still within p_limit
-- server-only
create function public.bump_usage(p_user uuid, p_kind text, p_limit int)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare v_count int;
begin
  insert into public.ai_usage (user_id, day) values (p_user, current_date) on conflict do nothing;
  if p_kind = 'ai' then
    update public.ai_usage set ai_requests = ai_requests + 1
      where user_id = p_user and day = current_date returning ai_requests into v_count;
  else
    update public.ai_usage set sandbox_runs = sandbox_runs + 1
      where user_id = p_user and day = current_date returning sandbox_runs into v_count;
  end if;
  return v_count <= p_limit;
end;
$$;
revoke execute on function public.bump_usage(uuid, text, int) from public, anon, authenticated;
grant execute on function public.bump_usage(uuid, text, int) to service_role;

-- flags a validated puzzle the caller has fought and logs an event (T-28)
-- security definer because players cannot update puzzles
create function public.flag_puzzle(p_puzzle_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then
    return false;
  end if;

  update public.puzzles p
     set status = 'flagged'
   where p.id = p_puzzle_id
     and p.status = 'validated'
     and exists (select 1 from public.encounters e where e.puzzle_id = p.id and e.user_id = v_user);
  if not found then
    return false;
  end if;

  insert into public.events (user_id, type, details)
  values (v_user, 'puzzle_reported', jsonb_build_object('puzzleId', p_puzzle_id));
  return true;
end;
$$;
revoke execute on function public.flag_puzzle(uuid) from public, anon;
grant execute on function public.flag_puzzle(uuid) to authenticated;
