import type { SeedPuzzle } from "./types";

export const loops: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "for-loops",
    difficulty: 1,
    theme: "pirates",
    title: "The Cannon Line",
    description: "Count how many times a for loop's body runs.",
    question:
      'How many lines does this print?\n\n```js\nfor (let cannon = 1; cannon < 4; cannon++) {\n  console.log("Cannon " + cannon);\n}\n```',
    options: ["2", "3", "4", "It never stops"],
    correctIndex: 1,
    explanation:
      "The loop runs while `cannon < 4`, so `cannon` is 1, 2 and 3. At 4 the condition is false, which gives 3 lines.",
  },
  // puzzle 2
  {
    kind: "mcq",
    concept: "while-loops",
    difficulty: 2,
    theme: "scifi",
    title: "The Fuel Jumps",
    description: "Predict the final value printed after a while loop finishes.",
    question:
      "What does this print?\n\n```js\nlet fuel = 10;\nlet jumps = 0;\n\nwhile (fuel > 3) {\n  fuel = fuel - 4;\n  jumps++;\n}\n\nconsole.log(jumps);\n```",
    options: ["1", "3", "4", "2"],
    correctIndex: 3,
    explanation:
      "Fuel goes 10, then 6, then 2. After the second jump `fuel > 3` is false, so the loop stops with `jumps` at 2.",
  },
  // puzzle 3
  {
    kind: "mcq",
    concept: "break-continue",
    difficulty: 3,
    theme: "plain",
    title: "The Skipped Room",
    description: "Predict the total from a loop that skips one round and ends early.",
    question:
      "What does this print?\n\n```js\nlet found = 0;\n\nfor (let room = 1; room <= 6; room++) {\n  if (room === 2) {\n    continue;\n  }\n  if (room === 5) {\n    break;\n  }\n  found = found + room;\n}\n\nconsole.log(found);\n```",
    options: ["13", "21", "8", "6"],
    correctIndex: 2,
    explanation:
      "`continue` skips room 2 and `break` leaves the loop at room 5, so only rooms 1, 3 and 4 are added: 1 + 3 + 4 = 8.",
  },
  // puzzle 4
  {
    kind: "short",
    concept: "while-loops",
    difficulty: 3,
    theme: "cyberpunk",
    title: "The Endless Firewall",
    description: "Explain why a particular while loop never ends and how to fix it.",
    question:
      'Why does this loop never stop, and how do you fix it?\n\n```js\nlet firewall = 10;\nwhile (firewall > 0) {\n  console.log("Holding");\n}\n```',
    modelAnswer:
      "Nothing inside the loop changes `firewall`, so `firewall > 0` stays true forever. Change it each round, for example with `firewall = firewall - 1;`.",
    rubric:
      "Passes if it says the variable in the condition never changes inside the loop, and the fix is to change it in each round. Wording doesn't matter.",
    maxLength: 300,
  },
  // puzzle 5
  {
    kind: "short",
    concept: "accumulators",
    difficulty: 3,
    theme: "fantasy",
    title: "The Reset Jar",
    description:
      "Explain where a running-total variable must be declared in relation to its loop.",
    question:
      "Why must `let total = 0;` go before a loop that adds to it, instead of inside the loop?",
    modelAnswer:
      "Inside the loop it would start again at 0 every round, losing the earlier sum, and it wouldn't exist after the loop. Declared before, it keeps its value across rounds and is usable afterwards.",
    rubric:
      "Passes if it says that declaring it inside resets it to 0 each round (or loses the running total), or that it wouldn't exist after the loop. Wording doesn't matter.",
    maxLength: 300,
  },
  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 4,
    theme: "fantasy",
    title: "The Labyrinth Hoard",
    description:
      "Add up gold from numbered rooms, skipping some and stopping at a limit; tests skipped rooms, the limit boundary and empty runs.",
    starterCode: `// Walk rooms 1 to n of the labyrinth and collect gold.
// Room r holds r * 10 gold.
// Every room whose number is a multiple of 3 is flooded: skip it.
// Stop at the first room whose gold would push the total above limit (don't take that gold).
// Return the total gold collected.
// Example: collectGold(5, 100) returns 70.
function collectGold(n, limit) {
  let total = 0;
  // Your code goes here
  return total;
}`,
    referenceSolution: `function collectGold(n, limit) {
  let total = 0;
  for (let room = 1; room <= n; room++) {
    if (room % 3 === 0) {
      continue;
    }
    const gold = room * 10;
    if (total + gold > limit) {
      break;
    }
    total = total + gold;
  }
  return total;
}`,
    sampleTests: [
      {
        name: "collects from the first rooms when the limit is far away",
        code: `test("collects from the first rooms when the limit is far away", () => { expect(collectGold(2, 100)).toBe(30); });`,
      },
    ],
    hiddenTests: [
      {
        name: "skips every flooded room",
        code: `test("skips every flooded room", () => { expect(collectGold(6, 1000)).toBe(120); });`,
      },
      {
        name: "stops before a room that would pass the limit",
        code: `test("stops before a room that would pass the limit", () => { expect(collectGold(5, 100)).toBe(70); });`,
      },
      {
        name: "accepts a total exactly at the limit",
        code: `test("accepts a total exactly at the limit", () => { expect(collectGold(2, 30)).toBe(30); });`,
      },
      {
        name: "handles no rooms and a single room",
        code: `test("handles no rooms and a single room", () => { expect(collectGold(0, 50)).toBe(0); expect(collectGold(1, 50)).toBe(10); });`,
      },
      {
        name: "handles a first room over the limit and exactly at it",
        code: `test("handles a first room over the limit and exactly at it", () => { expect(collectGold(4, 5)).toBe(0); expect(collectGold(4, 10)).toBe(10); });`,
      },
    ],
  },
];
