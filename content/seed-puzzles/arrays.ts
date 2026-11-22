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

  // puzzle 4
  {
    kind: "short",
    concept: "looping-over-arrays",
    difficulty: 2,
    title: "One Step Too Far",
    description: "Explain the bug in a loop that runs past the end of an array.",
    question:
      "Why is `for (let i = 0; i <= items.length; i++)` a bug when you loop over an array?",
    modelAnswer:
      "Indexes go from 0 to length minus 1. With `<=` the loop runs once more with i equal to the length, which reads past the end and gives undefined.",
    rubric:
      "Passes if it says the last valid index is length minus one, so `<=` goes one step past the end (undefined or an extra round). Wording doesn't matter.",
  },

  // puzzle 5
  {
    kind: "short",
    concept: "find",
    difficulty: 3,
    title: "The Empty Search",
    description: "Explain what find and filter return when nothing matches.",
    question:
      "What do `find` and `filter` each return when no item matches the condition?",
    modelAnswer:
      "`find` returns undefined, because it gives back a single item. `filter` returns an empty array, because it always gives back a list.",
    rubric:
      "Passes if it says find gives undefined and filter gives an empty array. Wording and examples don't matter.",
  },
];
