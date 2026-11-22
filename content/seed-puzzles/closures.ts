import type { SeedPuzzle } from "./types";

export const closures: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "functions-in-functions",
    difficulty: 1,
    theme: "pirates",
    title: "The Cannon Helper",
    description: "Predict what an inner function sees from its outer function.",
    question:
      'What does this print?\n\n```js\nfunction loadCannon(shots) {\n  function fire() {\n    console.log("Fired " + shots + " shots");\n  }\n  fire();\n}\n\nloadCannon(3);\n```',
    options: [
      "Nothing is printed",
      "Fired undefined shots",
      "Fired 3 shots",
      "An error saying shots is not defined",
    ],
    correctIndex: 2,
    explanation:
      "An inner function can use the outer function's variables, so `fire` sees `shots`, which is 3.",
  },

  // puzzle 2
  {
    kind: "mcq",
    concept: "counters",
    difficulty: 2,
    theme: "cyberpunk",
    title: "The Twin Counters",
    description: "Tell that each counter made by a function keeps its own count.",
    question:
      "What does this print?\n\n```js\nfunction makeCounter() {\n  let count = 0;\n  return () => {\n    count = count + 1;\n    return count;\n  };\n}\n\nconst a = makeCounter();\nconst b = makeCounter();\na();\na();\nconsole.log(b());\n```",
    options: ["1", "2", "3", "0"],
    correctIndex: 0,
    explanation:
      "Each call to `makeCounter()` creates its own separate `count`. `b` never shared `a`'s count, so its first call returns 1.",
  },

  // puzzle 3
  {
    kind: "mcq",
    concept: "callbacks",
    difficulty: 3,
    theme: "plain",
    title: "The Late Callback",
    description: "Predict the print order when a callback runs later.",
    question:
      'In what order do the letters print?\n\n```js\nsetTimeout(() => console.log("B"), 100);\nconsole.log("A");\nconsole.log("C");\n```',
    options: ["A, B, C", "A, C, B", "B, A, C", "B, C, A"],
    correctIndex: 1,
    explanation:
      '`setTimeout` stores its callback and moves on, so "A" and "C" print first. The callback runs 100 ms later and prints "B".',
  },

  // puzzle 4
  {
    kind: "short",
    concept: "returning-functions",
    difficulty: 3,
    theme: "fantasy",
    title: "The Remembered Number",
    description:
      "Explain why a returned function can still use its outer function's variable.",
    question:
      "In `const double = makeMultiplier(2);`, why can `double(10)` still use the 2 after `makeMultiplier` has finished running?",
    modelAnswer:
      "The returned function is a closure. It remembers the variables from where it was created, including `times`, even after the outer function finishes.",
    rubric:
      "Passes if it says the returned or inner function remembers or keeps access to the outer function's variable (a closure). Wording doesn't matter.",
    maxLength: 300,
  },

  // puzzle 5
  {
    kind: "short",
    concept: "callbacks",
    difficulty: 4,
    theme: "scifi",
    title: "The Early Launch",
    description:
      "Explain why calling a function inside setTimeout's argument is a bug and how to fix it.",
    question:
      "What is wrong with `setTimeout(launch(), 1000)`, and how do you fix it?",
    modelAnswer:
      "`launch()` runs the function right away and passes its result to setTimeout. Pass the function itself, `setTimeout(launch, 1000)`, so setTimeout calls it later.",
    rubric:
      "Passes if it says the parentheses call launch immediately, and the fix is to pass the function without calling it. Wording doesn't matter.",
    maxLength: 300,
  },

  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 4,
    theme: "pirates",
    title: "The Lookout's Shout",
    description:
      "Build a lookout that counts ships and shouts once when the limit is reached; tests the limit, quiet counts and separate lookouts.",
    starterCode: `// Build a lookout who counts ships.
// makeLookout(limit, shout) returns a function. Each call to it counts one more ship and returns the total so far.
// When the total reaches limit exactly, call shout(total). Later ships don't shout again.
// Every lookout keeps their own count.
// Example: const watch = makeLookout(2, (n) => console.log(n));
//   watch() returns 1; the next watch() calls shout(2) and returns 2.
function makeLookout(limit, shout) {

}`,
    referenceSolution: `function makeLookout(limit, shout) {
  let count = 0;
  return () => {
    count = count + 1;
    if (count === limit) {
      shout(count);
    }
    return count;
  };
}`,
    sampleTests: [
      {
        name: "counts each ship sighted",
        code: `test("counts each ship sighted", () => { const watch = makeLookout(5, () => {}); watch(); expect(watch()).toBe(2); });`,
      },
    ],
    hiddenTests: [
      {
        name: "shouts with the total when the limit is reached",
        code: `test("shouts with the total when the limit is reached", () => { const shouts = []; const watch = makeLookout(3, (n) => shouts.push(n)); watch(); watch(); watch(); expect(shouts).toEqual([3]); });`,
      },
      {
        name: "stays quiet before the limit",
        code: `test("stays quiet before the limit", () => { const shouts = []; const watch = makeLookout(3, (n) => shouts.push(n)); watch(); watch(); expect(shouts).toEqual([]); });`,
      },
      {
        name: "shouts only once when more ships follow",
        code: `test("shouts only once when more ships follow", () => { const shouts = []; const watch = makeLookout(2, (n) => shouts.push(n)); watch(); watch(); watch(); watch(); expect(shouts).toEqual([2]); });`,
      },
      {
        name: "keeps separate counts for separate lookouts",
        code: `test("keeps separate counts for separate lookouts", () => { const first = makeLookout(10, () => {}); const second = makeLookout(10, () => {}); first(); first(); expect(second()).toBe(1); });`,
      },
      {
        name: "shouts on the very first ship when the limit is one",
        code: `test("shouts on the very first ship when the limit is one", () => { const shouts = []; const watch = makeLookout(1, (n) => shouts.push(n)); watch(); expect(shouts).toEqual([1]); });`,
      },
    ],
  },
];
