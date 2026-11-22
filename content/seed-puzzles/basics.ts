// TODO(T-08): Basics seed puzzles
import type { SeedPuzzle } from "./types";

export const basics: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "variables",
    difficulty: 1,
    theme: "fantasy",
    title: "The Spent Mana",
    description:
      "Predict a variable's value after it is reassigned using its old value.",
    question:
      "What does this print?\n\n```js\nlet mana = 10;\nmana = mana - 4;\nconsole.log(mana);\n```",
    options: ["10", "6", "4", "An error"],
    correctIndex: 1,
    explanation:
      "The second line works out 10 - 4 = 6 and stores it back in `mana`, replacing the old 10.",
  },

  // puzzle 2
  {
    kind: "mcq",
    concept: "numbers",
    difficulty: 2,
    theme: "scifi",
    title: "The Leftover Crew",
    description: "Use the remainder operator to find what is left after dividing.",
    question:
      "What does this print?\n\n```js\nconst crew = 17;\nconst pods = 5;\nconsole.log(crew % pods);\n```",
    options: ["3", "3.4", "2", "12"],
    correctIndex: 2,
    explanation:
      "`%` gives the remainder. 5 goes into 17 three times (15), which leaves 2.",
  },

  // puzzle 3
  {
    kind: "mcq",
    concept: "strings",
    difficulty: 3,
    theme: "cyberpunk",
    title: "The Glitched Credits",
    description: "Predict what + does when one side is a string.",
    question:
      'What does this print?\n\n```js\nconst credits = "5";\nconsole.log(credits + 3);\n```',
    options: ["8", "An error", "5 3", "53"],
    correctIndex: 3,
    explanation:
      '`credits` is a string, so `+` joins the text instead of adding, and the result is "53".',
  },

  // puzzle 4
  {
    kind: "short",
    concept: "variables",
    difficulty: 2,
    theme: "plain",
    title: "Let or Const",
    description: "Explain when to use const instead of let.",
    question: "When should you declare a variable with `const` instead of `let`?",
    modelAnswer:
      "Use `const` for a value that never changes, because trying to give it a new value causes an error. Use `let` when the value will change later.",
    rubric:
      "Passes if it says const is for values that never change or can't be reassigned, and let is for values that change. Wording and examples don't matter.",
  },

  // puzzle 5
  {
    kind: "short",
    concept: "strings",
    difficulty: 3,
    theme: "pirates",
    title: "The Captain's Slice",
    description:
      "Explain what slice returns and whether the end position is included.",
    question:
      'What does `"Captain".slice(0, 3)` return, and is the character at position 3 included?',
    modelAnswer:
      'It returns "Cap". The start position is included but the end position is not, so it stops just before position 3.',
    rubric:
      'Passes if it says the result is "Cap" and that the end position is not included. Wording doesn\'t matter.',
  },

  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 3,
    theme: "fantasy",
    title: "The Treasure Ledger",
    description:
      "Split gold among heroes and return a sentence with each share and the leftover; tests even splits, remainders and one hero.",
    starterCode: `// Split gold evenly among heroes and report the result.
// Input: hero (a name), gold and heroes (whole numbers, heroes is at least 1).
// Each hero gets a whole number of coins; the rest is left over.
// Return the text: <hero> gets <share> gold (<left> left over)
// Example: describeLoot("Ana", 25, 4) returns "Ana gets 6 gold (1 left over)".
function describeLoot(hero, gold, heroes) {
  let report = "";
  // Your code goes here
  return report;
}`,
    referenceSolution: `function describeLoot(hero, gold, heroes) {
  let report = "";
  const share = Math.floor(gold / heroes);
  const left = gold % heroes;
  report = hero + " gets " + share + " gold (" + left + " left over)";
  return report;
}`,
    sampleTests: [
      {
        name: "reports the share and leftover for a typical split",
        code: `test("reports the share and leftover for a typical split", () => { expect(describeLoot("Ana", 25, 4)).toBe("Ana gets 6 gold (1 left over)"); });`,
      },
    ],
    hiddenTests: [
      {
        name: "reports no leftover when the gold divides evenly",
        code: `test("reports no leftover when the gold divides evenly", () => { expect(describeLoot("Bo", 20, 5)).toBe("Bo gets 4 gold (0 left over)"); });`,
      },
      {
        name: "gives everything as leftover when gold is short of a round",
        code: `test("gives everything as leftover when gold is short of a round", () => { expect(describeLoot("Cy", 7, 10)).toBe("Cy gets 0 gold (7 left over)"); });`,
      },
      {
        name: "gives a lone hero all the gold",
        code: `test("gives a lone hero all the gold", () => { expect(describeLoot("Dee", 9, 1)).toBe("Dee gets 9 gold (0 left over)"); });`,
      },
      {
        name: "uses a longer name and a bigger pile",
        code: `test("uses a longer name and a bigger pile", () => { expect(describeLoot("Elara", 100, 3)).toBe("Elara gets 33 gold (1 left over)"); });`,
      },
    ],
  },
];
