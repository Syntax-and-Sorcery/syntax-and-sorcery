// TODO(T-08): Conditionals seed puzzles
import type { SeedPuzzle } from "./types";

export const conditionals: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "comparisons",
    difficulty: 1,
    theme: "cyberpunk",
    title: "The Shield Readout",
    description: "Predict the results of three comparisons against the same number.",
    question:
      "What do the three lines print, in order?\n\n```js\nconst shield = 10;\nconsole.log(shield >= 10);\nconsole.log(shield > 10);\nconsole.log(shield !== 10);\n```",
    options: [
      "true, false, false",
      "true, true, false",
      "false, false, true",
      "true, false, true",
    ],
    correctIndex: 0,
    explanation:
      "10 is at least 10 (true) but not more than 10 (false), and 10 is equal to 10, so `!==` is false.",
  },

  // puzzle 2
  {
    kind: "mcq",
    concept: "if-else",
    difficulty: 2,
    theme: "fantasy",
    title: "The Troll's Toll",
    description: "Predict which branch of an if and else if chain runs.",
    question:
      'What does this print?\n\n```js\nconst gold = 20;\n\nif (gold > 5) {\n  console.log("Pay the toll");\n} else if (gold > 10) {\n  console.log("Cross free");\n} else {\n  console.log("Blocked");\n}\n```',
    options: [
      "Cross free",
      "Pay the toll",
      "Blocked",
      "Pay the toll, then Cross free",
    ],
    correctIndex: 1,
    explanation:
      'Only the first true block runs. `gold > 5` is true, so it prints "Pay the toll" and skips the rest, even though `gold > 10` is also true.',
  },

  // puzzle 3
  {
    kind: "mcq",
    concept: "switch",
    difficulty: 3,
    theme: "plain",
    title: "The Missing Break",
    description: "Predict the output of a switch where one case has no break.",
    question:
      'What does this print?\n\n```js\nconst door = "red";\n\nswitch (door) {\n  case "red":\n    console.log("Lair");\n  case "blue":\n    console.log("Library");\n    break;\n  default:\n    console.log("Wall");\n}\n```',
    options: ["Lair", "Library", "Lair, then Library", "Lair, Library, then Wall"],
    correctIndex: 2,
    explanation:
      'The red case has no `break`, so JavaScript keeps running into the next case and prints "Library" too. The `break` after that stops it before `default`.',
  },
];
