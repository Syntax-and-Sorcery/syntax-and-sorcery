// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPuzzles } from "@/lib/server/puzzles";
import { finishRun, getEncounterForModel, startEncounter } from "@/lib/server/runs";
import { DEFAULT_PREFERENCES, type Concept } from "@/lib/types";
import type { GameContext, RunEncounter } from "./context";
import { gameMessageMetadataSchema, gameTools } from "./game-tools";
import { runGenerator } from "./generator";

vi.mock("@/lib/server/puzzles", () => ({ listPuzzles: vi.fn(async () => ({ puzzles: [] })) }));
vi.mock("@/lib/server/runs", () => ({
  startEncounter: vi.fn(async () => ({ ok: true, status: "started", encounterId: "e-new" })),
  finishRun: vi.fn(async () => ({ ok: true })),
  getEncounterForModel: vi.fn(async () => ({ ok: true })),
}));
vi.mock("./generator", () => ({ runGenerator: vi.fn(async () => ({ ok: true, id: "boss-new", title: "t", description: "d" })) }));

const concepts: Concept[] = [
  { slug: "loops", name: "Loops", description: "", lesson: "LOOPS_LESSON" },
  { slug: "arrays", name: "Arrays", description: "", lesson: "" },
];
const BOSS_ID = "00000000-0000-4000-8000-0000000000b0";
const PUZZLE_ID = "00000000-0000-4000-8000-000000000001";
const ENCOUNTER_ID = "00000000-0000-4000-8000-0000000000e1";

const win = (concept: string, kind: "mcq" | "code", isBoss = false): RunEncounter => ({
  id: "e", puzzleId: "p", concept, kind, difficulty: 1, status: "defeated", isBoss, basicHints: 0, enemyName: "E", createdAt: "", endedAt: null,
});
const cleared = [win("loops", "mcq"), win("loops", "code"), win("arrays", "mcq"), win("arrays", "code")];

function tools(encounters: RunEncounter[] = []) {
  const ctx = {
    adventureId: "adv", concepts, encounters, bossPuzzleIds: new Set([BOSS_ID]), preferences: DEFAULT_PREFERENCES,
  } as unknown as GameContext;
  const t = gameTools(ctx);
  const opts = { toolCallId: "call", messages: [] };
  // execute is optional on the tool type, but every tool used here defines it
  const run = async <K extends keyof typeof t>(name: K, input: unknown) =>
    (t[name] as unknown as { execute: (i: unknown, o: unknown) => Promise<{ ok: boolean }> }).execute(input, opts);
  return { ctx, run };
}
const enemy = (puzzleId: string) => ({ puzzleId, name: "Serpent", sprite: "serpent", color: "#123456" });

beforeEach(() => vi.clearAllMocks());

describe("boss lock in the game master's tools", () => {
  it("refuses boss puzzles while concepts are still uncleared", async () => {
    const { run } = tools();
    expect(await run("list_puzzles", { concept: "boss" })).toMatchObject({ ok: false });
    expect(await run("generate_puzzle", { kind: "code", concept: "boss", difficulty: 5, brief: "" })).toMatchObject({ ok: false });
    expect(await run("present_puzzle", enemy(BOSS_ID))).toMatchObject({ ok: false });
    expect(listPuzzles).not.toHaveBeenCalled();
    expect(runGenerator).not.toHaveBeenCalled();
    expect(startEncounter).not.toHaveBeenCalled();
  });

  it("allows the boss once every concept is cleared, and only as a code puzzle", async () => {
    const { ctx, run } = tools(cleared);
    expect(await run("list_puzzles", { concept: "boss" })).toMatchObject({ ok: true });
    expect(vi.mocked(listPuzzles).mock.calls[0][1]).toMatchObject({ includeBoss: true });
    expect(await run("generate_puzzle", { kind: "mcq", concept: "boss", difficulty: 5, brief: "" })).toMatchObject({ ok: false });
    expect(await run("generate_puzzle", { kind: "code", concept: "boss", difficulty: 5, brief: "" })).toMatchObject({ ok: true });
    expect(ctx.bossPuzzleIds.has("boss-new")).toBe(true);
    expect(await run("present_puzzle", enemy(BOSS_ID))).toMatchObject({ ok: true });
  });

  it("refuses to finish the adventure before the boss is beaten", async () => {
    expect(await tools(cleared).run("finish_adventure", { summary: "s" })).toMatchObject({ ok: false });
    expect(finishRun).not.toHaveBeenCalled();
    await tools([...cleared, win("boss", "code", true)]).run("finish_adventure", { summary: "s" });
    expect(finishRun).toHaveBeenCalledOnce();
  });
});

describe("game master tools", () => {
  it("refuses concepts that aren't in the adventure", async () => {
    const { run } = tools();
    expect(await run("list_puzzles", { concept: "recursion" })).toMatchObject({ ok: false });
    expect(await run("generate_puzzle", { kind: "code", concept: "recursion", difficulty: 1, brief: "" })).toMatchObject({ ok: false });
    expect(runGenerator).not.toHaveBeenCalled();
  });

  it("lists, generates, starts, and looks up fights for regular concepts", async () => {
    const { run } = tools();
    expect(await run("list_puzzles", { concept: "loops" })).toMatchObject({ ok: true });
    expect(await run("generate_puzzle", { kind: "mcq", concept: "loops", difficulty: 1, brief: "" })).toMatchObject({ ok: true });
    expect(vi.mocked(runGenerator).mock.calls[0][0]).toMatchObject({ adventureId: "adv", concept: "loops" });
    expect(await run("present_puzzle", enemy(PUZZLE_ID))).toMatchObject({ ok: true });
    expect(startEncounter).toHaveBeenCalledOnce();
    await run("get_encounter", { encounterId: ENCOUNTER_ID });
    expect(vi.mocked(getEncounterForModel).mock.calls[0][1]).toBe(ENCOUNTER_ID);
  });

  it("shows a known lesson and refuses an unknown one", async () => {
    const { run } = tools();
    expect(await run("show_lesson", { concept: "loops" })).toMatchObject({ ok: true, lesson: "LOOPS_LESSON" });
    expect(await run("show_lesson", { concept: "nope" })).toMatchObject({ ok: false });
  });
});

describe("message metadata schema", () => {
  it("accepts hint requests and fight summaries the client sends", () => {
    expect(gameMessageMetadataSchema.safeParse({ action: "basic_hint", code: null, lastResults: null }).success).toBe(true);
    expect(gameMessageMetadataSchema.safeParse({ action: "encounter_end", encounterIds: [ENCOUNTER_ID], summary: "Won" }).success).toBe(true);
  });

  it("rejects unknown actions and malformed ids", () => {
    expect(gameMessageMetadataSchema.safeParse({ action: "cheat" }).success).toBe(false);
    expect(gameMessageMetadataSchema.safeParse({ action: "encounter_end", encounterIds: ["not-a-uuid"], summary: "" }).success).toBe(false);
    expect(gameMessageMetadataSchema.safeParse({ action: "encounter_end", encounterIds: [], summary: "" }).success).toBe(false);
  });
});
