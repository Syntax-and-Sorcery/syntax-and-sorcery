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

  // puzzle 4
  {
    kind: "short",
    concept: "logical-operators",
    difficulty: 2,
    theme: "pirates",
    title: "The Tavern Discount",
    description: "Choose and justify a logical operator for a rule with two checks.",
    question:
      "A tavern gives a free drink to anyone with a coupon or a captain's badge. Which logical operator joins the two checks, and why would the other one be wrong?",
    modelAnswer:
      "Use `||` (or), which is true when at least one check is true. `&&` would need both, so a sailor with only a coupon would get no drink.",
    rubric:
      "Passes if it names || (or) and says && would require both checks to be true. Wording and examples don't matter.",
    maxLength: 300,
  },

  // puzzle 5
  {
    kind: "short",
    concept: "comparisons",
    difficulty: 3,
    theme: "scifi",
    title: "The Rewritten Level",
    description:
      "Explain two similar-looking operators and a common mistake with them.",
    question:
      "What is the difference between `=` and `===`, and what goes wrong if you write `if (level = 10)`?",
    modelAnswer:
      "`=` stores a value and `===` compares two values. `if (level = 10)` sets `level` to 10 instead of checking it, so it doesn't test anything.",
    rubric:
      "Passes if it says = assigns or stores a value, === compares, and the if version changes the variable instead of comparing. Wording doesn't matter.",
    maxLength: 300,
  },

  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 4,
    theme: "cyberpunk",
    title: "The Server Room Gate",
    description:
      "Decide server-room entry from a badge color, required clearance and hour; tests low clearance, unknown badges and the day-shift boundaries.",
    starterCode: `// Decide whether a hacker can enter the server room.
// Input: badge (text), required (a number from 1 to 3) and hour (0 to 23).
// Clearance: "gold" is 3, "silver" is 2, "bronze" is 1, any other badge is 0.
// Entry is allowed when the clearance is at least required AND
// (the hour is from 8 to 18 inclusive OR the badge is "gold").
// Return "granted" or "denied".
// Example: checkAccess("silver", 2, 9) returns "granted".
function checkAccess(badge, required, hour) {
  let result = "denied";
  // Your code goes here
  return result;
}`,
    referenceSolution: `function checkAccess(badge, required, hour) {
  let result = "denied";
  let clearance = 0;
  switch (badge) {
    case "gold":
      clearance = 3;
      break;
    case "silver":
      clearance = 2;
      break;
    case "bronze":
      clearance = 1;
      break;
    default:
      clearance = 0;
  }
  const dayShift = hour >= 8 && hour <= 18;
  if (clearance >= required && (dayShift || badge === "gold")) {
    result = "granted";
  }
  return result;
}`,
    sampleTests: [
      {
        name: "lets a silver badge in during the day shift",
        code: `test("lets a silver badge in during the day shift", () => { expect(checkAccess("silver", 2, 9)).toBe("granted"); });`,
      },
    ],
    hiddenTests: [
      {
        name: "blocks a badge below the required clearance",
        code: `test("blocks a badge below the required clearance", () => { expect(checkAccess("bronze", 2, 10)).toBe("denied"); });`,
      },
      {
        name: "blocks an unknown badge",
        code: `test("blocks an unknown badge", () => { expect(checkAccess("purple", 1, 12)).toBe("denied"); });`,
      },
      {
        name: "lets a gold badge in at any hour",
        code: `test("lets a gold badge in at any hour", () => { expect(checkAccess("gold", 3, 3)).toBe("granted"); });`,
      },
      {
        name: "blocks a silver badge outside the day shift",
        code: `test("blocks a silver badge outside the day shift", () => { expect(checkAccess("silver", 1, 22)).toBe("denied"); });`,
      },
      {
        name: "handles the boundary hours of the day shift",
        code: `test("handles the boundary hours of the day shift", () => { expect(checkAccess("bronze", 1, 8)).toBe("granted"); expect(checkAccess("bronze", 1, 18)).toBe("granted"); expect(checkAccess("bronze", 1, 19)).toBe("denied"); });`,
      },
    ],
  },
];
