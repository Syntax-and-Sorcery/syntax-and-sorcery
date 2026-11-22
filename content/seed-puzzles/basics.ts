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
];
