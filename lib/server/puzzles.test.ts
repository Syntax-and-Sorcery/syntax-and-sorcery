// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { fakeSupabase, ok, type FakeQuery, type FakeResult } from "@/test/fake-supabase";
import { DEFAULT_PREFERENCES, type Concept, type EncounterStatus, type PuzzleKind } from "@/lib/types";
import type { GameContext, RunEncounter } from "./ai/context";
import { eligiblePuzzles, existingDescriptions, listPuzzles, loadCodePuzzle, loadPuzzle, storedEnemies } from "./puzzles";

const db = vi.hoisted(() => ({ respond: (() => null) as (q: unknown) => unknown, client: null as unknown }));
vi.mock("./admin", () => ({ admin: () => db.client }));

function useAdmin(respond: (q: FakeQuery) => FakeResult) {
  const fake = fakeSupabase(respond);
  db.client = fake.client;
  return fake.queries;
}

const concepts: Concept[] = [
  { slug: "loops", name: "Loops", description: "", lesson: "" },
  { slug: "arrays", name: "Arrays", description: "", lesson: "" },
];

let n = 0;
function row(concept: string, kind: PuzzleKind, difficulty = 1, extra: Record<string, unknown> = {}) {
  const id = `${(++n).toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
  return { id, kind, concept, difficulty, theme: "fantasy", title: `T${n}`, description: "d", content: { hiddenTestCount: 4, question: "q" }, ...extra };
}

function win(concept: string, kind: PuzzleKind, isBoss = false, status: EncounterStatus = "defeated", puzzleId = "x"): RunEncounter {
  return { id: `e${++n}`, puzzleId, concept, kind, difficulty: 1, status, isBoss, basicHints: 0, enemyName: "E", createdAt: "", endedAt: null };
}

function context(rows: unknown[], over: Partial<GameContext> = {}) {
  const fake = fakeSupabase(() => ok(rows));
  const ctx = {
    adventureId: "adv",
    runStatus: "in_progress",
    concepts,
    encounters: [],
    preferences: DEFAULT_PREFERENCES,
    targetDifficulty: 3,
    supabase: fake.client,
    ...over,
  } as unknown as GameContext;
  return { ctx, queries: fake.queries };
}

const loopsMcq = row("loops", "mcq", 2);
const loopsCode = row("loops", "code", 1);
const loopsShort = row("loops", "short");
const arraysMcq = row("arrays", "mcq");
const boss = row("boss", "code", 5);
const stray = row("closures", "code");
const catalog = [arraysMcq, boss, loopsCode, stray, loopsShort, loopsMcq];
const clearedBoth = [win("loops", "mcq"), win("loops", "code"), win("arrays", "mcq"), win("arrays", "code")];

describe("TC-NFR-18 no-AI mode falls back to stored puzzles", () => {
  it("offers validated MCQ and code puzzles of this adventure, never short answers", async () => {
    const { ctx, queries } = context(catalog);
    const enemies = await storedEnemies(ctx);
    expect(enemies.map((e) => e.puzzleId).sort()).toEqual([loopsMcq.id, loopsCode.id, arraysMcq.id].sort());
    expect(queries[0].has("eq", "status", "validated")).toBe(true);
    expect(queries[0].has("eq", "adventure_id", "adv")).toBe(true);
  });

  it("orders cards by concept, MCQs before code", async () => {
    const { ctx } = context(catalog);
    expect((await storedEnemies(ctx)).map((e) => e.puzzleId)).toEqual([loopsMcq.id, loopsCode.id, arraysMcq.id]);
  });

  it("builds enemy cards without content or answer fields", async () => {
    const { ctx } = context(catalog);
    for (const card of await storedEnemies(ctx)) {
      expect(card).not.toHaveProperty("content");
      expect(card).not.toHaveProperty("answer");
      expect(card.hiddenTestCount).toBe(card.kind === "code" ? 4 : 1);
    }
  });

  it("keeps the same sprite for a puzzle across reloads", async () => {
    const { ctx } = context(catalog);
    const [first, second] = [await storedEnemies(ctx), await storedEnemies(ctx)];
    expect(second.map((e) => e.sprite)).toEqual(first.map((e) => e.sprite));
  });

  it("adds the boss last once every concept is cleared, and drops it once beaten", async () => {
    const unlocked = await storedEnemies(context(catalog, { encounters: clearedBoth }).ctx);
    expect(unlocked.at(-1)).toMatchObject({ puzzleId: boss.id, isBoss: true });
    expect(unlocked.filter((e) => e.isBoss)).toHaveLength(1);

    const beaten = await storedEnemies(context(catalog, { encounters: [...clearedBoth, win("boss", "code", true)] }).ctx);
    expect(beaten.some((e) => e.isBoss)).toBe(false);
  });

  it("offers nothing once the run is completed", async () => {
    const { ctx, queries } = context(catalog, { runStatus: "completed" });
    expect(await storedEnemies(ctx)).toEqual([]);
    expect(queries).toHaveLength(0);
  });
});

describe("eligiblePuzzles", () => {
  it("skips active puzzles and previously seen MCQs, but keeps fled code puzzles", async () => {
    const { ctx } = context([loopsMcq, loopsCode, arraysMcq]);
    const met = [
      { puzzleId: loopsMcq.id, kind: "mcq" as const, status: "lost" as const },
      { puzzleId: loopsCode.id, kind: "code" as const, status: "fled" as const },
      { puzzleId: arraysMcq.id, kind: "mcq" as const, status: "active" as const },
    ];
    const rows = await eligiblePuzzles(ctx.supabase, { adventureId: "adv", conceptSlugs: ["loops", "arrays"], includeBoss: false, met });
    expect(rows.map((r) => r.id)).toEqual([loopsCode.id]);
  });

  it("passes concept and kind filters to the query", async () => {
    const { ctx, queries } = context([]);
    await eligiblePuzzles(ctx.supabase, { adventureId: "adv", conceptSlugs: [], includeBoss: false, met: [], concept: "loops", kind: "code" });
    expect(queries[0].has("eq", "concept", "loops")).toBe(true);
    expect(queries[0].has("eq", "kind", "code")).toBe(true);
  });

  it("throws when the query fails", async () => {
    const fake = fakeSupabase(() => ({ data: null, error: new Error("rls") }));
    const client = fake.client as unknown as GameContext["supabase"];
    await expect(eligiblePuzzles(client, { adventureId: "adv", conceptSlugs: [], includeBoss: false, met: [] })).rejects.toThrow("rls");
  });
});

describe("listPuzzles", () => {
  it("returns at most eight puzzles, closest to the target difficulty first, without content", async () => {
    const rows = [1, 5, 3, 2, 4, 3, 1, 5, 2, 4, 3, 1].map((d) => row("loops", "code", d));
    const { ctx } = context(rows, { targetDifficulty: 3 });
    const { puzzles } = await listPuzzles(ctx, { includeBoss: false });
    expect(puzzles.length).toBeLessThanOrEqual(8);
    expect(puzzles.length).toBeLessThan(rows.length);
    const distances = puzzles.map((p) => Math.abs(p.difficulty - 3));
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(puzzles[0]).not.toHaveProperty("content");
  });

  it("breaks ties in favor of the player's theme and honors an explicit difficulty", async () => {
    const plain = row("loops", "code", 2, { theme: "plain" });
    const pirates = row("loops", "code", 2, { theme: "pirates" });
    const far = row("loops", "code", 5);
    const { ctx } = context([plain, far, pirates], { preferences: { ...DEFAULT_PREFERENCES, theme: "pirates" } });
    const { puzzles } = await listPuzzles(ctx, { includeBoss: false, difficulty: 2 });
    expect(puzzles.map((p) => p.id)).toEqual([pirates.id, plain.id, far.id]);
  });
});

describe("loadPuzzle", () => {
  const stored = {
    id: "p1", adventure_id: "adv-load", concept: "loops", kind: "code", difficulty: 2, theme: "fantasy", title: "t",
    description: "d", content: { starterCode: "" }, answer: { hiddenTests: [] }, status: "validated",
  };
  const respond = (puzzle: unknown) => (q: FakeQuery) =>
    q.table === "puzzles" ? ok(puzzle) : q.table === "adventures" ? ok({ track_id: "t1" }) : ok({ language: "javascript" });

  it("maps the stored row and reads the language from the track once per adventure", async () => {
    const queries = useAdmin(respond(stored));
    const puzzle = await loadPuzzle("p1");
    expect(puzzle).toMatchObject({ id: "p1", adventureId: "adv-load", kind: "code", language: "javascript" });
    await loadPuzzle("p1");
    expect(queries.filter((q) => q.table === "tracks")).toHaveLength(1);
  });

  it("returns null for a missing puzzle, and loadCodePuzzle returns null for other kinds", async () => {
    useAdmin(respond(null));
    expect(await loadPuzzle("missing")).toBeNull();
    useAdmin(respond({ ...stored, kind: "mcq" }));
    expect(await loadCodePuzzle("p1")).toBeNull();
  });

  it("throws when a query fails", async () => {
    useAdmin(() => ({ data: null, error: new Error("down") }));
    await expect(loadPuzzle("p1")).rejects.toThrow("down");
  });
});

describe("existingDescriptions", () => {
  it("formats stored puzzles with kind and title for the generator", async () => {
    const queries = useAdmin(() => ok([{ kind: "mcq", title: "Count chests", description: "Count them." }]));
    const [line] = await existingDescriptions({ adventureId: "adv", concept: "loops" });
    expect(line).toContain("mcq");
    expect(line).toContain("Count chests");
    expect(queries[0].has("eq", "concept", "loops")).toBe(true);
  });
});
