// browser GameData backed by Supabase with RLS
// always list columns when querying puzzles, since column-level grants reject select("*")
import { ITEMS } from "@/content/sprites";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { conceptStats } from "@/lib/rules/progress";
import {
  DEFAULT_PREFERENCES,
  type AdventureStatus,
  type AdventureWithProgress,
  type Concept,
  type Encounter,
  type EncounterStatus,
  type InventoryEntry,
  type Item,
  type Language,
  type PlayerPuzzle,
  type Preferences,
  type ProgressStats,
  type PuzzleKind,
  type TestCase,
  type Track,
  type TrackProgress,
} from "@/lib/types";
import type { GameData } from "./index";

// create the singleton browser client on first use, since mock mode has no Supabase keys
const db = () => createClient();

type DbError = { message: string; code?: string } | null;
function fail(what: string, error: NonNullable<DbError>): never {
  throw new Error(`${what}: ${error.message}`);
}

// GradeResult and Preferences are interfaces, which TypeScript won't take as Json without a cast
const toJson = (value: unknown) => value as Json;

const UNIQUE_VIOLATION = "23505";

async function userId(): Promise<string> {
  // local session is safe here because RLS validates the JWT on every query
  const { data } = await db().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Not logged in");
  return id;
}

const itemFor = (slug: string): Item => ITEMS[slug] ?? { slug, name: slug, plus: [], minus: "" };

// RLS keeps fought puzzles readable even if flagged or disabled, so the join is only null if deleted
const ENCOUNTER_COLUMNS =
  "id, run_id, puzzle_id, enemy_name, enemy_sprite, enemy_color, is_boss, status, basic_hints, xp_awarded, puzzles(concept, kind)";

interface EncounterRow {
  id: string;
  run_id: string;
  puzzle_id: string;
  enemy_name: string;
  enemy_sprite: string;
  enemy_color: string;
  is_boss: boolean;
  status: string;
  basic_hints: number;
  xp_awarded: number;
  puzzles: { concept: string; kind: string } | null;
}

function toEncounter(row: EncounterRow): Encounter {
  return {
    id: row.id,
    runId: row.run_id,
    puzzleId: row.puzzle_id,
    concept: row.puzzles?.concept ?? (row.is_boss ? "boss" : ""),
    kind: (row.puzzles?.kind ?? "code") as PuzzleKind,
    enemy: { name: row.enemy_name, sprite: row.enemy_sprite, color: row.enemy_color },
    isBoss: row.is_boss,
    status: row.status as EncounterStatus,
    basicHints: row.basic_hints,
    xpAwarded: row.xp_awarded,
  };
}

// marks an active encounter as fled or lost, or returns false if it already ended
async function endEncounter(encounterId: string, status: "fled" | "lost"): Promise<boolean> {
  const { data, error } = await db()
    .from("encounters")
    .update({ status, ended_at: new Date().toISOString() })
    .eq("id", encounterId)
    .eq("status", "active")
    .select("id");
  if (error) fail(`Couldn't end encounter ${encounterId}`, error);
  return data.length > 0;
}

interface PuzzleContent {
  question?: string;
  options?: string[];
  maxLength?: number;
  starterCode?: string;
  sampleTests?: TestCase[];
  hiddenTestCount?: number;
}

function toPlayerPuzzle(
  row: { id: string; kind: string; title: string; difficulty: number; content: Json },
  language: Language,
): PlayerPuzzle {
  const c = (row.content ?? {}) as PuzzleContent;
  const base = { id: row.id, title: row.title, difficulty: row.difficulty };
  switch (row.kind) {
    case "mcq":
      return { ...base, kind: "mcq", question: c.question ?? "", options: c.options ?? [] };
    case "short":
      return { ...base, kind: "short", question: c.question ?? "", maxLength: c.maxLength ?? 200 };
    default:
      return {
        ...base,
        kind: "code",
        language,
        starterCode: c.starterCode ?? "",
        sampleTests: c.sampleTests ?? [],
        hiddenTestCount: c.hiddenTestCount ?? 0,
      };
  }
}

export const supabaseGameData: GameData = {
  async listTracks() {
    const { data, error } = await db()
      .from("tracks")
      .select("id, slug, title, language, description, status")
      .neq("status", "disabled")
      .order("sort_order");
    if (error) fail("Couldn't load the tracks", error);
    return data as Track[];
  },

  async listAdventures(trackId) {
    // RLS limits adventure_runs(status) to this player's own run, so there's at most one per adventure
    const { data, error } = await db()
      .from("adventures")
      .select("id, track_id, slug, title, summary, sort_order, concepts, adventure_runs(status)")
      .eq("track_id", trackId)
      .order("sort_order");
    if (error) fail("Couldn't load the adventures", error);

    // adventures unlock sequentially as each previous one is completed
    let previousCompleted = true;
    return data.map((a): AdventureWithProgress => {
      const run = a.adventure_runs[0];
      const status: AdventureStatus =
        run?.status === "completed" ? "completed" : run ? "in_progress" : previousCompleted ? "available" : "locked";
      previousCompleted = status === "completed";
      return {
        id: a.id,
        trackId: a.track_id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        sortOrder: a.sort_order,
        concepts: a.concepts as unknown as Concept[],
        status,
      };
    });
  },

  async getTrackProgress(trackId) {
    const { data, error } = await db().from("track_progress").select("track_id, xp").eq("track_id", trackId).maybeSingle();
    if (error) fail("Couldn't load your progress", error);
    return data ? ({ trackId: data.track_id, xp: data.xp } satisfies TrackProgress) : null;
  },

  async enroll(trackId) {
    // user_id defaults to auth.uid()
    // enrolling twice keeps the existing row and its XP
    const { error } = await db().from("track_progress").insert({ track_id: trackId });
    if (error && error.code !== UNIQUE_VIOLATION) fail("Couldn't enroll", error);
    const progress = await supabaseGameData.getTrackProgress(trackId);
    if (!progress) throw new Error("Couldn't enroll: no progress row after insert");
    return progress;
  },

  async getOrStartRun(adventureId) {
    const columns = "id, adventure_id, status, story_summary, messages";
    const find = () => db().from("adventure_runs").select(columns).eq("adventure_id", adventureId).maybeSingle();

    let { data, error } = await find();
    if (error) fail("Couldn't load the adventure", error);
    if (!data) {
      const inserted = await db().from("adventure_runs").insert({ adventure_id: adventureId }).select(columns).single();
      // another tab may have created the run first
      ({ data, error } = inserted.error?.code === UNIQUE_VIOLATION ? await find() : inserted);
      if (error) fail("Couldn't start the adventure", error);
      if (!data) throw new Error(`No run for adventure ${adventureId}`);
    }
    return {
      id: data.id,
      adventureId: data.adventure_id,
      status: data.status as "in_progress" | "completed",
      storySummary: data.story_summary,
      messages: Array.isArray(data.messages) ? data.messages : [],
    };
  },

  async listEncounters(runId) {
    const { data, error } = await db()
      .from("encounters")
      .select(ENCOUNTER_COLUMNS)
      .eq("run_id", runId)
      .order("created_at");
    if (error) fail("Couldn't load the encounters", error);
    return (data as EncounterRow[]).map(toEncounter);
  },

  async getEncounter(encounterId) {
    const { data, error } = await db().from("encounters").select(ENCOUNTER_COLUMNS).eq("id", encounterId).maybeSingle();
    if (error) fail(`Couldn't load encounter ${encounterId}`, error);
    if (!data) throw new Error(`No encounter ${encounterId}`);
    return toEncounter(data as EncounterRow);
  },

  // used in no-AI mode
  // normally the server creates encounters via present_puzzle
  async startEncounter({ runId, puzzleId, enemy, isBoss }) {
    const { data, error } = await db()
      .from("encounters")
      .insert({
        run_id: runId,
        puzzle_id: puzzleId,
        enemy_name: enemy.name,
        enemy_sprite: enemy.sprite,
        enemy_color: enemy.color,
        is_boss: isBoss,
      })
      .select(ENCOUNTER_COLUMNS)
      .single();
    if (error?.code === UNIQUE_VIOLATION) throw new Error("Another fight is still active in this run");
    if (error) fail("Couldn't start the fight", error);
    return toEncounter(data as EncounterRow);
  },

  async getPuzzle(puzzleId) {
    const { data, error } = await db()
      .from("puzzles")
      .select("id, kind, title, difficulty, content, adventures(tracks(language))")
      .eq("id", puzzleId)
      .maybeSingle();
    if (error) fail(`Couldn't load puzzle ${puzzleId}`, error);
    if (!data) throw new Error(`No puzzle ${puzzleId}`);
    const language = (data.adventures?.tracks?.language ?? "javascript") as Language;
    return toPlayerPuzzle(data, language);
  },

  async getInventory() {
    const { data, error } = await db()
      .from("inventory")
      .select("item_slug, quantity")
      .gt("quantity", 0)
      .order("item_slug");
    if (error) fail("Couldn't load your inventory", error);
    return data.map((row): InventoryEntry => ({ item: itemFor(row.item_slug), quantity: row.quantity }));
  },

  async recordAttempt({ encounterId, answer, result }) {
    const { error } = await db()
      .from("attempts")
      .insert({ encounter_id: encounterId, answer, passed: result.passed, result: toJson(result) });
    if (error) fail("Couldn't save the attempt", error);
  },

  async recordHint(encounterId) {
    // compare-and-swap loop since supabase-js can't express basic_hints + 1 directly
    for (let tries = 0; tries < 5; tries++) {
      const { data, error } = await db().from("encounters").select("basic_hints").eq("id", encounterId).maybeSingle();
      if (error) fail(`Couldn't load encounter ${encounterId}`, error);
      if (!data) throw new Error(`No encounter ${encounterId}`);
      const updated = await db()
        .from("encounters")
        .update({ basic_hints: data.basic_hints + 1 })
        .eq("id", encounterId)
        .eq("basic_hints", data.basic_hints)
        .select("id");
      if (updated.error) fail("Couldn't record the hint", updated.error);
      if (updated.data.length > 0) return;
    }
    throw new Error("Couldn't record the hint. Try again.");
  },

  async settleEncounter({ encounterId, answer, result, xp, items }) {
    const { data, error } = await db().rpc("settle_encounter", {
      p_encounter_id: encounterId,
      p_answer: answer,
      p_result: toJson(result),
      p_xp: xp,
      p_items: items,
    });
    if (error) fail("Couldn't save the win", error);
    return data === true; // false means already settled, fled, or lost
  },

  fleeEncounter: (encounterId) => endEncounter(encounterId, "fled"),

  loseEncounter: (encounterId) => endEncounter(encounterId, "lost"),

  async consumeItem(itemSlug) {
    // compare-and-swap loop so a double-click can't use up the same item twice
    for (let tries = 0; tries < 5; tries++) {
      const { data, error } = await db().from("inventory").select("quantity").eq("item_slug", itemSlug).maybeSingle();
      if (error) fail("Couldn't load your inventory", error);
      if (!data || data.quantity <= 0) throw new Error(`No ${itemSlug} left`);
      const updated = await db()
        .from("inventory")
        .update({ quantity: data.quantity - 1 })
        .eq("item_slug", itemSlug)
        .eq("quantity", data.quantity)
        .select("item_slug");
      if (updated.error) fail(`Couldn't use ${itemSlug}`, updated.error);
      if (updated.data.length > 0) return;
    }
    throw new Error(`Couldn't use ${itemSlug}. Try again.`);
  },

  async getProgressStats(trackId) {
    const { data: track, error } = await db().from("tracks").select("title, status").eq("id", trackId).maybeSingle();
    if (error) fail("Couldn't load the track", error);
    if (track?.status !== "active") return { tracks: [], concepts: [] };

    const [progress, adventures] = await Promise.all([
      supabaseGameData.getTrackProgress(trackId),
      supabaseGameData.listAdventures(trackId),
    ]);
    const runs = await db()
      .from("adventure_runs")
      .select("id")
      .in("adventure_id", adventures.map((a) => a.id));
    if (runs.error) fail("Couldn't load your adventures", runs.error);

    // the trend needs fights in the order they ended
    const fights = await db()
      .from("encounters")
      .select("status, is_boss, puzzles(concept)")
      .in("run_id", runs.data.map((r) => r.id))
      .neq("status", "active")
      .order("ended_at")
      .order("created_at");
    if (fights.error) fail("Couldn't load your fights", fights.error);

    return {
      tracks: [
        {
          trackId,
          title: track.title,
          xp: progress?.xp ?? 0,
          completedAdventures: adventures.filter((a) => a.status === "completed").length,
          totalAdventures: adventures.length,
        },
      ],
      concepts: conceptStats(
        adventures.flatMap((a) => a.concepts),
        fights.data.map((e) => ({
          concept: e.puzzles?.concept ?? "",
          status: e.status as EncounterStatus,
          isBoss: e.is_boss,
        })),
      ),
    } satisfies ProgressStats;
  },

  async reportPuzzle(puzzleId) {
    const { data, error } = await db().rpc("flag_puzzle", { p_puzzle_id: puzzleId });
    if (error) fail("Couldn't report the puzzle", error);
    return data === true; // false if already flagged or never fought by this player
  },

  async getPreferences() {
    const id = await userId();
    const { data, error } = await db().from("profiles").select("preferences").eq("id", id).single();
    if (error) fail("Couldn't load your settings", error);
    // profiles.preferences starts as {}, so fill in any missing keys from defaults
    const stored = data.preferences && typeof data.preferences === "object" ? data.preferences : {};
    return { ...DEFAULT_PREFERENCES, ...(stored as Partial<Preferences>) };
  },

  async updatePreferences(preferences) {
    const id = await userId();
    const { data, error } = await db()
      .from("profiles")
      .update({ preferences: toJson(preferences) })
      .eq("id", id)
      .select("id");
    if (error) fail("Couldn't save your settings", error);
    if (data.length === 0) throw new Error("Couldn't save your settings");
  },
};
