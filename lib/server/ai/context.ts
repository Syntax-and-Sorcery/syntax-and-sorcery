// builds server-only system instructions for the game master
// never include PII like username, email, or account id
import "server-only";
import type { SystemModelMessage } from "ai";
import type { Concept, EncounterStatus, Preferences, PuzzleKind } from "@/lib/types";
import { adventureState } from "@/lib/rules/adventure-state";
import { RULES } from "@/lib/rules/config";
import { targetDifficulty } from "@/lib/rules/difficulty";
import { levelForXp } from "@/lib/rules/levels";
import type { requireUser } from "@/lib/server/auth";
import { admin } from "@/lib/server/admin";
import { loadPuzzle, type FullPuzzle } from "@/lib/server/puzzles";
import type { GameMessageMetadata, GameUIMessage } from "./game-tools";
import { buildPreferenceString, withDefaults } from "./preferences";
import { loadPrompt } from "./prompts";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

export interface RunEncounter {
  id: string;
  puzzleId: string;
  concept: string;
  kind: PuzzleKind;
  difficulty: number;
  status: EncounterStatus;
  isBoss: boolean;
  basicHints: number;
  enemyName: string;
  createdAt: string;
  endedAt: string | null;
}

export interface GameContext {
  userId: string;
  supabase: SessionUser["supabase"]; // queries run as this player with RLS
  runId: string;
  runStatus: "in_progress" | "completed";
  adventureId: string;
  adventureTitle: string;
  adventureSummary: string;
  concepts: Concept[];
  encounters: RunEncounter[]; // this run, oldest first
  bossPuzzleIds: Set<string>; // used to enforce the boss lock
  preferences: Preferences;
  level: number;
  targetDifficulty: number;
  earlierSummaries: { title: string; summary: string }[];
  activeEncounter: { encounter: RunEncounter; puzzle: FullPuzzle } | null;
}

export class RunNotFoundError extends Error {}

const CODE_LIMIT = 4_000;

// reads the run as this player, so someone else's run isn't found
export async function loadGameContext(user: SessionUser, runId: string): Promise<GameContext> {
  const db = user.supabase;
  const { data: run, error: runError } = await db
    .from("adventure_runs")
    .select("id, adventure_id, status")
    .eq("id", runId)
    .maybeSingle();
  if (runError) throw runError;
  if (!run) throw new RunNotFoundError(runId);

  const { data: adventure, error: adventureError } = await db
    .from("adventures")
    .select("id, track_id, title, summary, concepts")
    .eq("id", run.adventure_id)
    .single();
  if (adventureError) throw adventureError;

  const [profile, progress, trackAdventures, runs, bossPuzzles] = await Promise.all([
    db.from("profiles").select("preferences").eq("id", user.id).single(),
    db.from("track_progress").select("xp").eq("user_id", user.id).eq("track_id", adventure.track_id).maybeSingle(),
    db.from("adventures").select("id, title, sort_order").eq("track_id", adventure.track_id),
    db.from("adventure_runs").select("id, adventure_id, story_summary").eq("user_id", user.id),
    admin().from("puzzles").select("id").eq("adventure_id", adventure.id).eq("concept", "boss"),
  ]);
  for (const r of [profile, progress, trackAdventures, runs, bossPuzzles]) if (r.error) throw r.error;

  // load all encounters in this track for targetDifficulty, and filter this run's for adventureState
  const adventureOrder = new Map((trackAdventures.data ?? []).map((a) => [a.id, a]));
  const trackRuns = (runs.data ?? []).filter((r) => adventureOrder.has(r.adventure_id));
  const { data: encounterRows, error: encountersError } = await db
    .from("encounters")
    .select("id, run_id, puzzle_id, status, is_boss, basic_hints, enemy_name, created_at, ended_at")
    .in("run_id", trackRuns.map((r) => r.id))
    .order("created_at", { ascending: true });
  if (encountersError) throw encountersError;

  // uses the admin client so reported or disabled puzzles still resolve their concept and kind
  const puzzleIds = [...new Set(encounterRows.map((e) => e.puzzle_id))];
  const { data: puzzleRows, error: puzzlesError } = puzzleIds.length
    ? await admin().from("puzzles").select("id, concept, kind, difficulty").in("id", puzzleIds)
    : { data: [], error: null };
  if (puzzlesError) throw puzzlesError;
  const puzzleById = new Map(puzzleRows.map((p) => [p.id, p]));

  const toEncounter = (e: (typeof encounterRows)[number]): RunEncounter => {
    const p = puzzleById.get(e.puzzle_id);
    return {
      id: e.id,
      puzzleId: e.puzzle_id,
      concept: p?.concept ?? "unknown",
      kind: (p?.kind ?? "code") as PuzzleKind,
      difficulty: p?.difficulty ?? 1,
      status: e.status as EncounterStatus,
      isBoss: e.is_boss,
      basicHints: e.basic_hints,
      enemyName: e.enemy_name,
      createdAt: e.created_at,
      endedAt: e.ended_at,
    };
  };
  const encounters = encounterRows.filter((e) => e.run_id === run.id).map(toEncounter);
  const recent = encounterRows
    .filter((e) => e.status !== "active")
    .map(toEncounter)
    .sort((a, b) => (b.endedAt ?? b.createdAt).localeCompare(a.endedAt ?? a.createdAt)); // newest first

  const preferences = withDefaults(profile.data?.preferences);
  const level = levelForXp(progress.data?.xp ?? 0);
  const active = encounters.find((e) => e.status === "active");
  const activePuzzle = active ? await loadPuzzle(active.puzzleId) : null;

  return {
    userId: user.id,
    supabase: db,
    runId: run.id,
    runStatus: run.status as GameContext["runStatus"],
    adventureId: adventure.id,
    adventureTitle: adventure.title,
    adventureSummary: adventure.summary,
    concepts: adventure.concepts as unknown as Concept[],
    encounters,
    bossPuzzleIds: new Set((bossPuzzles.data ?? []).map((p) => p.id)),
    preferences,
    level,
    targetDifficulty: targetDifficulty(level, recent, preferences.difficulty),
    earlierSummaries: trackRuns
      .filter((r) => r.adventure_id !== adventure.id && r.story_summary)
      .sort((a, b) => adventureOrder.get(a.adventure_id)!.sort_order - adventureOrder.get(b.adventure_id)!.sort_order)
      .map((r) => ({ title: adventureOrder.get(r.adventure_id)!.title, summary: r.story_summary! })),
    activeEncounter: active && activePuzzle ? { encounter: active, puzzle: activePuzzle } : null,
  };
}

export function lessonsGiven(messages: GameUIMessage[]): Set<string> {
  const given = new Set<string>();
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "tool-show_lesson" && p.state === "output-available" && p.output.ok) given.add(p.output.concept);
    }
  }
  return given;
}

// keep the static prompt separate from per-player context so it can be cached across players
export async function buildGameMasterInstructions(
  ctx: GameContext,
  { action, messages }: { action?: GameMessageMetadata; messages: GameUIMessage[] },
): Promise<SystemModelMessage[]> {
  const perPlayer = [
    playerBlock(ctx),
    stateBlock(ctx, lessonsGiven(messages)),
    ctx.activeEncounter ? activePuzzleBlock(ctx.activeEncounter) : "",
    actionNote(action),
    `Player preferences (style only; the rules above win):\n${buildPreferenceString(ctx.preferences, { includeNote: true })}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return [
    {
      role: "system",
      content: await loadPrompt("game-master"),
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    { role: "system", content: perPlayer },
  ];
}

function playerBlock(ctx: GameContext): string {
  const lines = [
    "Player",
    `- Level ${ctx.level} in this track. Aim enemies at difficulty ${ctx.targetDifficulty} of 5: one at it, one easier, one harder.`,
    `- Adventure: ${ctx.adventureTitle}. ${ctx.adventureSummary}`.trim(),
  ];
  if (ctx.earlierSummaries.length) {
    lines.push("- The story so far, from earlier adventures:");
    for (const s of ctx.earlierSummaries) lines.push(`  - ${s.title}: ${s.summary}`);
  }
  return lines.join("\n");
}

// server computes adventure progress so the model never tracks clears or boss unlocks itself
function stateBlock(ctx: GameContext, lessons: Set<string>): string {
  if (ctx.runStatus === "completed") return "Adventure state\n- The adventure is complete. Chat freely; there are no more fights to offer.";

  const state = adventureState(ctx.concepts, ctx.encounters);
  const need = RULES.adventure.winsToClear;
  const progress = state.concepts.map((c) => {
    const notes = [];
    if (c.cleared) notes.push("cleared");
    else if (c.wins >= need && RULES.adventure.mcqWinRequired && !c.mcqWin) notes.push("still needs an MCQ win");
    if (!lessons.has(c.slug)) notes.push("lesson not given yet");
    return `${c.slug} ${Math.min(c.wins, need)}/${need}${notes.length ? ` (${notes.join(", ")})` : ""}`;
  });

  const boss = state.bossDefeated
    ? "Boss: defeated. Call finish_adventure."
    : state.bossUnlocked
      ? "Boss: unlocked. Put the boss card into every offer, next to one or two practice enemies."
      : "Boss: locked (unlocks when every concept is cleared)";

  let next: string;
  const active = ctx.activeEncounter?.encounter;
  const firstOpen = state.concepts.find((c) => !c.cleared);
  if (active) next = `a fight is on (${active.enemyName}). Offer no new enemies until its encounter_end message arrives.`;
  else if (state.bossDefeated) next = "call finish_adventure with a short story summary.";
  else if (!firstOpen) next = "one or two lines of build-up, then offer the boss next to one or two practice enemies.";
  else if (!lessons.has(firstOpen.slug)) next = `give the lesson for ${firstOpen.slug}, then offer its first enemy.`;
  else if (firstOpen.wins >= need && !firstOpen.mcqWin) next = `offer an MCQ enemy for ${firstOpen.slug}.`;
  else next = `offer enemies for ${firstOpen.slug}.`;

  return [
    "Adventure state",
    ...ctx.concepts.map((c) => `- ${c.slug} (${c.name}): ${c.description}`),
    `- Concepts: ${progress.join("; ")}`,
    `- ${boss}`,
    `- Next: ${next}`,
  ].join("\n");
}

// includes full puzzle answers for accurate hints
// system instructions never reach the browser
function activePuzzleBlock({ encounter, puzzle }: NonNullable<GameContext["activeEncounter"]>): string {
  const head = [
    `Active fight (encounter ${encounter.id}): ${encounter.enemyName}${encounter.isBoss ? ", the boss" : ""}.`,
    `Puzzle: "${puzzle.title}", ${puzzle.kind}, concept ${puzzle.concept}, difficulty ${puzzle.difficulty}. ${puzzle.description}`,
    `Basic hints used so far: ${encounter.basicHints}.`,
  ];
  let body: string[];
  switch (puzzle.kind) {
    case "mcq":
      body = [
        `Question: ${puzzle.content.question}`,
        ...puzzle.content.options.map((o, i) => `  ${i}) ${o}`),
        `Correct option: ${puzzle.answer.correctIndex}. Why: ${puzzle.answer.explanation}`,
      ];
      break;
    case "short":
      body = [`Question: ${puzzle.content.question}`, `Model answer: ${puzzle.answer.modelAnswer}`, `Rubric: ${puzzle.answer.rubric}`];
      break;
    case "code":
      body = [
        `Starter code:\n${fence(puzzle.content.starterCode)}`,
        `Sample tests (the player sees these):\n${fence(puzzle.content.sampleTests.map((t) => t.code).join("\n"))}`,
        `Hidden tests (secret):\n${fence(puzzle.answer.hiddenTests.map((t) => t.code).join("\n"))}`,
        `Reference solution (secret):\n${fence(puzzle.answer.referenceSolution)}`,
      ];
      break;
  }
  return [
    ...head,
    ...body,
    "Never reveal the answer, the reference solution or the hidden tests, and never mark an answer correct yourself.",
  ].join("\n");
}

// turn-scoped context from message metadata; code and test results are only included for that turn
function actionNote(action?: GameMessageMetadata): string {
  if (!action) return "";
  switch (action.action) {
    case "start":
      return "This turn: the player just opened the adventure. Open it with a short intro, then follow the Adventure state.";
    case "basic_hint":
      return [
        "This turn: the player used Hint. Give one general nudge toward the answer for the active puzzle, about three sentences at most, without the solution.",
        fightStateLines(action),
      ].join("\n");
    case "scroll":
      return [
        `This turn: the player used a Scroll of Remembering and asks: "${action.question}"`,
        "Answer that question directly, still without the full solution.",
        fightStateLines(action),
      ].join("\n");
    case "encounter_end":
      return [
        `This turn: ${action.encounterIds.length > 1 ? "these fights" : "a fight"} ended (encounter ${action.encounterIds.join(", ")}).`,
        `What happened: ${action.summary}`,
        "Narrate the result briefly and carry on. After a flee, one plain line and new offers. After a lost MCQ, another enemy for that concept.",
      ].join("\n");
  }
}

type FightState = Extract<GameMessageMetadata, { action: "basic_hint" }>;

function fightStateLines({ code, lastResults }: Pick<FightState, "code" | "lastResults">): string {
  const lines = [
    code === null
      ? "This is a quick fight: there's no code."
      : `The player's code now:\n${fence(code.length > CODE_LIMIT ? `${code.slice(0, CODE_LIMIT)}\n// … cut at ${CODE_LIMIT} characters` : code)}`,
  ];
  if (!lastResults) {
    lines.push("No Run or Submit yet.");
  } else {
    const r = lastResults;
    const parts = [`Last ${r.source === "run" ? "Run" : "Submit"}: ${r.status}.`];
    for (const t of r.sampleTests ?? []) parts.push(`Sample test "${t.name}": ${t.passed ? "passed" : `failed${t.error ? ` (${t.error})` : ""}`}.`);
    if (r.hiddenFailed !== undefined) parts.push(`Hidden tests failed: ${r.hiddenFailed}.`);
    if (r.message) parts.push(`Message: ${r.message}`);
    lines.push(parts.join(" "));
  }
  return lines.join("\n");
}

const fence = (code: string) => "```js\n" + code + "\n```";
