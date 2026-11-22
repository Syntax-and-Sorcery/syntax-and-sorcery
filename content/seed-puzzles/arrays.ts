// TODO(T-10): Arrays seed puzzles
import type { SeedPuzzle } from "./types";

export const arrays: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "indexes",
    difficulty: 1,
    title: "The Second Shelf",
    description: "Read an item from an array by its index.",
    question:
      'What does this print?\n\n```js\nconst loot = ["sword", "shield", "potion"];\nconsole.log(loot[1]);\n```',
    options: ["sword", "shield", "potion", "undefined"],
    correctIndex: 1,
    explanation:
      "Indexes start at 0, so `loot[0]` is the sword and `loot[1]` is the shield.",
  },

  // puzzle 2
  {
    kind: "mcq",
    concept: "push-pop",
    difficulty: 2,
    title: "The Shrinking Bag",
    description: "Predict an array after push and pop calls.",
    question:
      'What does this print?\n\n```js\nconst bag = ["rope", "torch"];\nbag.push("map");\nbag.pop();\nbag.pop();\nconsole.log(bag);\n```',
    options: ['["map"]', '["rope", "torch"]', '["rope"]', "[]"],
    correctIndex: 2,
    explanation:
      '`push` adds "map" at the end, then each `pop` removes the last item: first "map", then "torch". Only "rope" is left.',
  },

  // puzzle 3
  {
    kind: "mcq",
    concept: "map-filter",
    difficulty: 3,
    title: "The Price Sieve",
    description: "Tell what filter returns for a condition.",
    question:
      "What does this print?\n\n```js\nconst prices = [5, 12, 8, 20];\nconst result = prices.filter((p) => p > 10);\nconsole.log(result);\n```",
    options: ["[12, 20]", "[false, true, false, true]", "[5, 8]", "2"],
    correctIndex: 0,
    explanation:
      "`filter` returns a new array holding only the items for which the condition is true: 12 and 20.",
  },
];
