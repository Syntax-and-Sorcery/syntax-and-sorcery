// server run mutations called by game master tools
// all queries use the player's Supabase client so RLS applies
import "server-only";
import type { UIMessage } from "ai";
import type { EnemyOption } from "@/lib/types";
import type { GameContext } from "./ai/context";
import { refuse, type Refusal } from "./ai/refuse";
import { loadPuzzle } from "./puzzles";

export type StartEncounterResult = { ok: true; status: "started"; encounterId: string } | Refusal;

const UNIQUE_VIOLATION = "23505"; // encounters_one_active_per_run index

export async function startEncounter(ctx: GameContext, input: EnemyOption): Promise<StartEncounterResult> {
  const puzzle = await loadPuzzle(input.puzzleId);
  if (!puzzle || puzzle.adventureId !== ctx.adventureId) {
    return refuse("There's no puzzle with that id in this adventure. Use an id from list_puzzles or generate_puzzle.");
  }
  if (puzzle.status !== "validated") {
    return refuse("That puzzle has been taken out of the catalog. Offer another one from list_puzzles.");
  }
  const isBoss = puzzle.concept === "boss";
  const { data, error } = await ctx.supabase
    .from("encounters")
    .insert({
      run_id: ctx.runId,
      puzzle_id: puzzle.id,
      enemy_name: input.name,
      enemy_sprite: input.sprite,
      enemy_color: input.color,
      is_boss: isBoss,
    })
    .select("id, created_at")
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    return refuse("A fight is already on in this run. Wait for its encounter_end message before starting another.");
  }
  if (error) throw error;

  ctx.encounters.push({
    id: data.id,
    puzzleId: puzzle.id,
    concept: puzzle.concept,
    kind: puzzle.kind,
    difficulty: puzzle.difficulty,
    status: "active",
    isBoss,
    basicHints: 0,
    enemyName: input.name,
    createdAt: data.created_at,
    endedAt: null,
  });
  return { ok: true, status: "started", encounterId: data.id };
}

export async function finishRun(ctx: GameContext, summary: string): Promise<{ ok: true }> {
  const { error } = await ctx.supabase
    .from("adventure_runs")
    .update({ status: "completed", story_summary: summary, completed_at: new Date().toISOString() })
    .eq("id", ctx.runId);
  if (error) throw error;
  ctx.runStatus = "completed";
  return { ok: true };
}

// only writer to adventure_runs.messages
export async function saveRunMessages(ctx: GameContext, messages: UIMessage[]): Promise<void> {
  const { error } = await ctx.supabase
    .from("adventure_runs")
    .update({ messages: JSON.parse(JSON.stringify(messages)) })
    .eq("id", ctx.runId);
  if (error) throw error;
}

// only returns player-safe puzzle fields, since tool outputs go to the browser and get saved in messages
export async function getEncounterForModel(ctx: GameContext, encounterId: string) {
  const { data: encounter, error } = await ctx.supabase
    .from("encounters")
    .select("id, puzzle_id, enemy_name, is_boss, status, basic_hints, xp_awarded")
    .eq("id", encounterId)
    .eq("run_id", ctx.runId)
    .maybeSingle();
  if (error) throw error;
  if (!encounter) return refuse("There's no fight with that id in this run.");

  const puzzle = await loadPuzzle(encounter.puzzle_id);
  const { data: attempts, error: attemptsError } = await ctx.supabase
    .from("attempts")
    .select("answer, passed")
    .eq("encounter_id", encounterId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (attemptsError) throw attemptsError;
  const last = attempts[0];

  return {
    ok: true as const,
    encounterId: encounter.id,
    enemy: encounter.enemy_name,
    isBoss: encounter.is_boss,
    status: encounter.status,
    basicHints: encounter.basic_hints,
    xpAwarded: encounter.xp_awarded,
    puzzle: puzzle && {
      kind: puzzle.kind,
      concept: puzzle.concept,
      difficulty: puzzle.difficulty,
      title: puzzle.title,
      description: puzzle.description,
      content: puzzle.content,
    },
    lastAnswer: last
      ? {
          answer:
            puzzle?.kind === "mcq" ? (puzzle.content.options[Number(last.answer)] ?? last.answer) : last.answer.slice(0, 4_000),
          passed: last.passed,
        }
      : null,
  };
}
