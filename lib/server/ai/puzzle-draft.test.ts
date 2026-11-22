// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, ok, type FakeResult } from "@/test/fake-supabase";
import type { PuzzleSpec } from "./generator";
import { checkDraft, draftSchemas, puzzleDraftSchema, storePuzzle, type PuzzleDraft } from "./puzzle-draft";

const db = vi.hoisted(() => ({ respond: (): unknown => null, client: null as unknown }));
vi.mock("@/lib/server/admin", () => ({ admin: () => db.client }));

const spec = (kind: PuzzleSpec["kind"]): PuzzleSpec => ({ adventureId: "a1", kind, concept: "loops", difficulty: 2, brief: "b" });
const base = { theme: "fantasy" as const, title: "Double it", description: "Return twice the input." };
const t = (name: string, body: string) => ({ name, code: `test(${JSON.stringify(name)}, () => { ${body}; });` });

const mcq: PuzzleDraft = { kind: "mcq", ...base, question: "Which loop?", options: ["for", "while", "do"], correctIndex: 1, explanation: "e" };
const short: PuzzleDraft = { kind: "short", ...base, question: "Why?", modelAnswer: "Because", rubric: "Mentions state" };
const code: Extract<PuzzleDraft, { kind: "code" }> = {
  kind: "code",
  ...base,
  starterCode: "// double n\nfunction double(n) {}",
  referenceSolution: "function double(n) { return n * 2; }",
  sampleTests: [t("doubles two", "expect(double(2)).toBe(4)")],
  hiddenTests: [t("doubles zero", "expect(double(0)).toBe(0)"), t("doubles negatives", "expect(double(-3)).toBe(-6)"), t("doubles big", "expect(double(1e6)).toBe(2e6)")],
};

describe("TC-FR-12 a generated puzzle is validated before use", () => {
  it("accepts a code puzzle whose reference solution passes all its tests", async () => {
    expect(await checkDraft(spec("code"), code)).toBeNull();
  });

  it("rejects a code puzzle whose reference solution fails a test and names that test", async () => {
    const problem = await checkDraft(spec("code"), { ...code, referenceSolution: "function double(n) { return n + 2; }" });
    expect(problem).toContain("doubles zero");
    expect(problem).not.toContain("doubles two");
  });

  it("rejects a code puzzle whose reference solution doesn't run", async () => {
    expect(await checkDraft(spec("code"), { ...code, referenceSolution: "function double(n) { return n * ; }" })).toMatch(/syntax_error/);
  });

  it("rejects tests that share a name", async () => {
    const hiddenTests = [...code.hiddenTests.slice(0, 2), code.sampleTests[0]];
    expect(await checkDraft(spec("code"), { ...code, hiddenTests })).not.toBeNull();
  });

  it("rejects a test case that doesn't call test() exactly once", async () => {
    const hiddenTests = [...code.hiddenTests.slice(0, 2), { name: "two in one", code: `${t("a", "").code}\n${t("b", "").code}` }];
    expect(await checkDraft(spec("code"), { ...code, hiddenTests })).toMatch(/exactly once/);
  });

  it("rejects a puzzle of the wrong kind", async () => {
    expect(await checkDraft(spec("code"), mcq)).not.toBeNull();
  });

  it("rejects a description that spans more than one line", async () => {
    expect(await checkDraft(spec("short"), { ...short, description: "One.\nTwo." })).not.toBeNull();
  });

  it("accepts a valid MCQ and short-answer puzzle", async () => {
    expect(await checkDraft(spec("mcq"), mcq)).toBeNull();
    expect(await checkDraft(spec("short"), short)).toBeNull();
  });

  it("rejects an MCQ whose correct index points past the options", async () => {
    expect(await checkDraft(spec("mcq"), { ...mcq, correctIndex: 3 })).not.toBeNull();
  });

  it("rejects an MCQ with two options that only differ in case or spacing", async () => {
    expect(await checkDraft(spec("mcq"), { ...mcq, options: ["for", " FOR ", "while"] })).not.toBeNull();
  });

  it("rejects drafts that fail the draft schemas", () => {
    expect(draftSchemas.code.safeParse({ ...code, hiddenTests: code.hiddenTests.slice(0, 2) }).success).toBe(false);
    expect(draftSchemas.mcq.safeParse({ ...mcq, options: ["only one"] }).success).toBe(false);
    expect(puzzleDraftSchema.safeParse({ ...mcq, theme: "western" }).success).toBe(false);
    expect(puzzleDraftSchema.safeParse(code).success).toBe(true);
  });
});

describe("storePuzzle", () => {
  let inserted: Record<string, unknown>;
  beforeEach(() => {
    const fake = fakeSupabase((q): FakeResult => {
      inserted = q.calls.find((c) => c.method === "insert")!.args[0] as Record<string, unknown>;
      return db.respond() as FakeResult;
    });
    db.client = fake.client;
    db.respond = () => ok({ id: "p-new" });
  });

  it("keeps the reference solution and hidden tests out of the visible content", async () => {
    expect(await storePuzzle(spec("code"), code, [])).toBe("p-new");
    const content = inserted.content as Record<string, unknown>;
    const answer = inserted.answer as Record<string, unknown>;
    expect(content).not.toHaveProperty("referenceSolution");
    expect(content).not.toHaveProperty("hiddenTests");
    expect(content.hiddenTestCount).toBe(code.hiddenTests.length);
    expect(answer.hiddenTests).toEqual(code.hiddenTests);
    expect(inserted.status).toBe("validated");
  });

  it("keeps the MCQ answer and short-answer rubric out of the visible content", async () => {
    await storePuzzle(spec("mcq"), mcq, []);
    expect(inserted.content).not.toHaveProperty("correctIndex");
    expect(inserted.answer).toHaveProperty("correctIndex", 1);

    await storePuzzle(spec("short"), short, []);
    expect(inserted.content).not.toHaveProperty("rubric");
    expect(inserted.content).toHaveProperty("maxLength");
    expect(inserted.answer).toHaveProperty("rubric");
  });

  it("throws when the insert fails", async () => {
    db.respond = () => ({ data: null, error: new Error("insert failed") });
    await expect(storePuzzle(spec("mcq"), mcq, [])).rejects.toThrow("insert failed");
  });
});
