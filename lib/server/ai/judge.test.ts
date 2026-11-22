// @vitest-environment node
import { generateText } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/types";
import { AiUnavailableError, aiDown, explainFailure, judgeShortAnswer, plainCountFeedback } from "./judge";

vi.mock("ai", async (importOriginal) => ({ ...(await importOriginal<typeof import("ai")>()), generateText: vi.fn() }));
const generate = vi.mocked(generateText);

afterEach(() => {
  vi.unstubAllEnvs();
  generate.mockReset();
});

const puzzle = { question: "Why use a loop?", modelAnswer: "To repeat work", rubric: "Mentions repetition" };
const prefs = { ...DEFAULT_PREFERENCES, note: "PLAYER-NOTE" };
const failure = {
  task: "Double it",
  code: "function double(n) { return n; }",
  status: "ok" as const,
  failedSampleTests: [{ name: "doubles two", passed: false, error: "Expected 4, got 2" }],
  hiddenFailed: 2,
  hiddenTotal: 3,
};

describe("TC-NFR-18 fallback when the AI is down", () => {
  it("throws AiUnavailableError without calling the model when AI_DOWN=1", async () => {
    vi.stubEnv("AI_DOWN", "1");
    expect(aiDown()).toBe(true);
    await expect(judgeShortAnswer(puzzle, "answer", prefs)).rejects.toBeInstanceOf(AiUnavailableError);
    await expect(explainFailure(failure, prefs)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(generate).not.toHaveBeenCalled();
  });

  it("turns a provider error into AiUnavailableError so the route can fall back", async () => {
    const outage = new Error("529 overloaded");
    generate.mockRejectedValue(outage);
    await expect(judgeShortAnswer(puzzle, "answer", prefs)).rejects.toMatchObject({ cause: outage });
    await expect(explainFailure(failure, prefs)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("returns a plain count of passed hidden tests in plainCountFeedback", () => {
    expect(plainCountFeedback([true, false, true])).toContain("2 of 3");
    expect(plainCountFeedback([])).toContain("0 of 0");
  });
});

describe("AI judge", () => {
  it("is up unless AI_DOWN is exactly 1", () => {
    vi.stubEnv("AI_DOWN", "0");
    expect(aiDown()).toBe(false);
  });

  it("returns the model's verdict and keeps the player's note out of grading", async () => {
    generate.mockResolvedValue({ output: { correct: true, feedback: "Nice" } } as never);
    expect(await judgeShortAnswer(puzzle, "it repeats", prefs)).toEqual({ passed: true, feedback: "Nice" });
    const call = generate.mock.calls[0][0] as { instructions: string; prompt: string };
    expect(call.instructions).not.toContain("PLAYER-NOTE");
    expect(call.prompt).toContain("it repeats");
  });

  it("explains a failure using failed sample tests and hidden-test counts", async () => {
    generate.mockResolvedValue({ output: { feedback: "Check the return" } } as never);
    expect(await explainFailure(failure, prefs)).toBe("Check the return");
    const prompt = (generate.mock.calls[0][0] as { prompt: string }).prompt;
    expect(prompt).toContain("doubles two");
    expect(prompt).toContain(`${failure.hiddenFailed} of ${failure.hiddenTotal}`);
  });
});
