import type { TestCase, Theme } from "@/lib/types";

interface SeedBase {
  concept: string; // concept slug from content/javascript-track.ts, or "boss" for code puzzles
  difficulty: 1 | 2 | 3 | 4 | 5;
  theme?: Theme; // default "fantasy"
  title: string;
  description: string; // one sentence stating the task and what tests check
}

export type SeedPuzzle =
  | (SeedBase & { kind: "mcq"; question: string; options: string[]; correctIndex: number; explanation: string })
  | (SeedBase & { kind: "short"; question: string; modelAnswer: string; rubric: string; maxLength?: number })
  | (SeedBase & {
      kind: "code";
      starterCode: string; // the task as comments at the top, then the function to fill in
      referenceSolution: string;
      sampleTests: TestCase[]; // 1 to 2 tests shown to the player
      hiddenTests: TestCase[]; // 3 to 5 tests that decide pass/fail and enemy HP
    });
