// server-side puzzle queries
// reading the answer column needs the admin client, since players don't have that column grant
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { BOSS_ENEMY_SPRITE, DEFAULT_ENEMY_COLOR, STORED_ENEMY_SPRITES } from "@/content/sprites";
import { adventureState } from "@/lib/rules/adventure-state";
import type { EncounterStatus, Language, PuzzleKind, StoredEnemy, TestCase } from "@/lib/types";
import type { GameContext } from "./ai/context";
import { admin } from "./admin";

// shapes stored in the visible puzzles.content column and the server-only puzzles.answer column
export interface McqContent { question: string; options: string[] }
export interface McqAnswer { correctIndex: number; explanation: string }
export interface ShortContent { question: string; maxLength: number }
export interface ShortAnswer { modelAnswer: string; rubric: string }
export interface CodeContent { starterCode: string; sampleTests: TestCase[]; hiddenTestCount: number }
export interface CodeAnswer { referenceSolution: string; hiddenTests: TestCase[] }

interface PuzzleMeta {
  id: string;
  adventureId: string;
  concept: string;
  difficulty: number;
  theme: string;
  title: string;
  description: string;
  status: string;
  language: Language;
}
export type FullPuzzle = PuzzleMeta &
  (
    | { kind: "mcq"; content: McqContent; answer: McqAnswer }
    | { kind: "short"; content: ShortContent; answer: ShortAnswer }
    | { kind: "code"; content: CodeContent; answer: CodeAnswer }
  );
export type FullCodePuzzle = Extract<FullPuzzle, { kind: "code" }>;

// metadata returned by list_puzzles without content or answers
export interface PuzzleListing {
  id: string;
  kind: PuzzleKind;
  concept: string;
  difficulty: number;
  theme: string;
  title: string;
  description: string;
}

const LIST_LIMIT = 8;

// a track's language never changes, so it's read once per adventure and kept
const languages = new Map<string, Language>();
async function adventureLanguage(adventureId: string): Promise<Language> {
  const known = languages.get(adventureId);
  if (known) return known;
  const { data: adventure, error } = await admin().from("adventures").select("track_id").eq("id", adventureId).single();
  if (error) throw error;
  const { data: track, error: trackError } = await admin()
    .from("tracks")
    .select("language")
    .eq("id", adventure.track_id)
    .single();
  if (trackError) throw trackError;
  const language = track.language as Language;
  languages.set(adventureId, language);
  return language;
}

// loads the full puzzle with its answer, whatever its status, so reported fights can still finish
export async function loadPuzzle(puzzleId: string): Promise<FullPuzzle | null> {
  const { data, error } = await admin()
    .from("puzzles")
    .select("id, adventure_id, concept, kind, difficulty, theme, title, description, content, answer, status")
    .eq("id", puzzleId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    adventureId: data.adventure_id,
    concept: data.concept,
    difficulty: data.difficulty,
    theme: data.theme,
    title: data.title,
    description: data.description,
    status: data.status,
    language: await adventureLanguage(data.adventure_id),
    kind: data.kind,
    content: data.content,
    answer: data.answer,
  } as unknown as FullPuzzle;
}

export async function loadCodePuzzle(puzzleId: string): Promise<FullCodePuzzle | null> {
  const puzzle = await loadPuzzle(puzzleId);
  return puzzle?.kind === "code" ? puzzle : null;
}

export interface EligibleFilter {
  adventureId: string;
  conceptSlugs: string[]; // the adventure's concepts; "boss" is added when includeBoss is set
  includeBoss: boolean;
  // skips defeated, active, and previously seen MCQ puzzles
  met: { puzzleId: string; kind: PuzzleKind; status: EncounterStatus }[];
  concept?: string;
  kind?: PuzzleKind;
}
export type EligiblePuzzle = PuzzleListing & { content: unknown };

// shared filter for list_puzzles and no-AI offers (T-22)
// runs as the player so RLS applies
export async function eligiblePuzzles(supabase: SupabaseClient<Database>, f: EligibleFilter): Promise<EligiblePuzzle[]> {
  let query = supabase
    .from("puzzles")
    .select("id, kind, concept, difficulty, theme, title, description, content")
    .eq("adventure_id", f.adventureId)
    .eq("status", "validated");
  if (f.concept) query = query.eq("concept", f.concept);
  if (f.kind) query = query.eq("kind", f.kind);
  const { data, error } = await query;
  if (error) throw error;

  const allowed = new Set(f.includeBoss ? [...f.conceptSlugs, "boss"] : f.conceptSlugs);
  const excluded = new Set(
    f.met.filter((e) => e.status === "defeated" || e.status === "active" || e.kind === "mcq").map((e) => e.puzzleId),
  );
  return data
    .filter((p) => allowed.has(p.concept) && !excluded.has(p.id))
    .map((p) => ({ ...p, kind: p.kind as PuzzleKind }));
}

// no-AI mode's enemies (T-22): every eligible code and MCQ puzzle, short answers left out since the AI judges them
// builds each card field by field so answers and hidden tests can't leak through
export async function storedEnemies(ctx: GameContext): Promise<StoredEnemy[]> {
  if (ctx.runStatus === "completed") return []; // same as the game master, nothing left to fight
  const state = adventureState(ctx.concepts, ctx.encounters);
  const conceptSlugs = ctx.concepts.map((c) => c.slug);
  const rows = await eligiblePuzzles(ctx.supabase, {
    adventureId: ctx.adventureId,
    conceptSlugs,
    includeBoss: state.bossUnlocked && !state.bossDefeated,
    met: ctx.encounters,
  });
  // concept order with the boss last, then MCQs before code
  const order = (concept: string) => (concept === "boss" ? conceptSlugs.length : conceptSlugs.indexOf(concept));
  return rows
    .filter((p): p is EligiblePuzzle & { kind: "mcq" | "code" } => p.kind === "mcq" || p.kind === "code")
    .sort((a, b) => order(a.concept) - order(b.concept) || Number(a.kind === "code") - Number(b.kind === "code") || a.difficulty - b.difficulty)
    .map((p): StoredEnemy => {
      const isBoss = p.concept === "boss";
      const sprite = isBoss ? BOSS_ENEMY_SPRITE : spriteFor(p.id);
      return {
        puzzleId: p.id,
        name: sprite.charAt(0).toUpperCase() + sprite.slice(1),
        sprite,
        color: DEFAULT_ENEMY_COLOR,
        concept: p.concept,
        kind: p.kind,
        difficulty: p.difficulty,
        title: p.title,
        hiddenTestCount: p.kind === "code" ? (p.content as CodeContent).hiddenTestCount : 1,
        isBoss,
      };
    });
}

// picked from the puzzle id so a card keeps its sprite and name when the offers reload
function spriteFor(puzzleId: string): string {
  const n = parseInt(puzzleId.replace(/-/g, "").slice(0, 8), 16) || 0;
  return STORED_ENEMY_SPRITES[n % STORED_ENEMY_SPRITES.length];
}

// returns up to 8 eligible puzzles sorted by distance from target difficulty, breaking ties by player theme
export async function listPuzzles(
  ctx: GameContext,
  input: { concept?: string; kind?: PuzzleKind; difficulty?: number; includeBoss: boolean },
): Promise<{ puzzles: PuzzleListing[] }> {
  const rows = await eligiblePuzzles(ctx.supabase, {
    adventureId: ctx.adventureId,
    conceptSlugs: ctx.concepts.map((c) => c.slug),
    includeBoss: input.includeBoss,
    met: ctx.encounters,
    concept: input.concept,
    kind: input.kind,
  });
  const target = input.difficulty ?? ctx.targetDifficulty;
  const theme = ctx.preferences.theme;
  const puzzles = rows
    .sort(
      (a, b) =>
        Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) ||
        Number(b.theme === theme) - Number(a.theme === theme),
    )
    .slice(0, LIST_LIMIT)
    .map(({ id, kind, concept, difficulty, theme, title, description }) => ({ id, kind, concept, difficulty, theme, title, description }));
  return { puzzles };
}

// feeds existing puzzle descriptions to the generator so it avoids duplicates
export async function existingDescriptions(spec: { adventureId: string; concept: string }): Promise<string[]> {
  const { data, error } = await admin()
    .from("puzzles")
    .select("kind, title, description")
    .eq("adventure_id", spec.adventureId)
    .eq("concept", spec.concept)
    .in("status", ["validated", "flagged"])
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return data.map((p) => `- [${p.kind}] ${p.title}: ${p.description}`);
}
