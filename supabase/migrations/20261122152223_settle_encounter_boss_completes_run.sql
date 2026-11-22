-- beating the boss now completes the run, so the next adventure unlocks even if the game master never calls finish_adventure
create or replace function public.settle_encounter(
  p_encounter_id uuid, p_answer text, p_result jsonb, p_xp int, p_items text[]
)
returns boolean
language plpgsql
security invoker set search_path = ''
as $$
declare
  v_run uuid;
  v_boss boolean;
  v_track uuid;
begin
  update public.encounters
     set status = 'defeated', xp_awarded = p_xp, ended_at = now()
   where id = p_encounter_id and status = 'active'
  returning run_id, is_boss into v_run, v_boss;
  if v_run is null then
    return false; -- already settled, fled or lost
  end if;

  insert into public.attempts (encounter_id, answer, passed, result)
  values (p_encounter_id, p_answer, true, p_result);

  -- finish_adventure still runs later to save the story summary
  if v_boss then
    update public.adventure_runs
       set status = 'completed', completed_at = now()
     where id = v_run and status = 'in_progress';
  end if;

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
