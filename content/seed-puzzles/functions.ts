import type { SeedPuzzle } from "./types";

export const functions: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "parameters",
    difficulty: 1,
    theme: "scifi",
    title: "The Docking Order",
    description: "Predict the output of a function call with two arguments.",
    question:
      'What does this print?\n\n```js\nfunction dock(ship, bay) {\n  console.log(ship + " docks in bay " + bay);\n}\n\ndock(7, "Aurora");\n```',
    options: [
      "Aurora docks in bay 7",
      "7 docks in bay Aurora",
      "undefined docks in bay undefined",
      "An error",
    ],
    correctIndex: 1,
    explanation:
      'Arguments match parameters by position. 7 is the first argument, so `ship` is 7, and "Aurora" is the second, so `bay` is "Aurora".',
  },
  // puzzle 2
  {
    kind: "mcq",
    concept: "return-values",
    difficulty: 2,
    theme: "cyberpunk",
    title: "The Silent Bonus",
    description: "Predict what a function hands back and what it prints.",
    question:
      "What does this print?\n\n```js\nfunction addBonus(score) {\n  console.log(score + 50);\n}\n\nconst total = addBonus(100);\nconsole.log(total);\n```",
    options: ["150", "undefined", "150, then undefined", "150, then 150"],
    correctIndex: 2,
    explanation:
      "`console.log` inside the function prints 150, but the function never uses `return`, so `total` holds `undefined`, which the second `console.log` prints.",
  },
  // puzzle 3
  {
    kind: "mcq",
    concept: "scope",
    difficulty: 3,
    theme: "pirates",
    title: "The Second Treasure Chest",
    description: "Predict the value of an outer variable after a function runs.",
    question:
      "What does this print?\n\n```js\nlet gold = 10;\n\nfunction plunder() {\n  let gold = 0;\n  gold = gold + 25;\n}\n\nplunder();\nconsole.log(gold);\n```",
    options: ["35", "10", "25", "0"],
    correctIndex: 1,
    explanation:
      "`let gold = 0` inside the function makes a separate variable. The changes happen to that one, so the outer `gold` is still 10.",
  },
  // puzzle 4
  {
    kind: "short",
    concept: "arrow-functions",
    difficulty: 3,
    theme: "plain",
    title: "The Braces Bug",
    description:
      "Explain why a particular arrow function gives back no value and how to fix it.",
    question:
      "Why does `const double = (gold) => { gold * 2 };` return `undefined`, and how do you fix it?",
    modelAnswer:
      "With curly braces an arrow function needs an explicit `return`, so this one returns nothing. Write `return gold * 2;` inside the braces, or drop the braces: `(gold) => gold * 2`.",
    rubric:
      "Passes if it says that braces require a return statement (otherwise nothing is returned) and gives either fix: add return or remove the braces. Wording doesn't matter.",
    maxLength: 300,
  },
  // puzzle 5
  {
    kind: "short",
    concept: "defining-functions",
    difficulty: 2,
    theme: "fantasy",
    title: "Two Ways to Say It",
    description: "Compare two ways of writing a function's name in code.",
    question:
      "What is the difference between writing `castSpell` and `castSpell()` in your code?",
    modelAnswer:
      "`castSpell()` calls the function and runs its code. `castSpell` without parentheses only refers to the function and runs nothing.",
    rubric:
      "Passes if it says the parentheses call or run the function, and the name alone only refers to it without running it. Wording doesn't matter.",
    maxLength: 300,
  },

  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 4,
    theme: "fantasy",
    title: "The Potion Merchant's Ledger",
    description:
      "Write an arrow function for a taxed price and a function that totals several potions; tests the tax, the count and repeated calls.",
    starterCode: `// A potion shop adds 10% tax to every price.
// 1. priceWithTax: an arrow function that takes price and returns price plus 10% of it.
//    Example: priceWithTax(20) returns 22.
// 2. totalCost(price, count): returns what count potions cost, tax included, using priceWithTax.
//    Keep your working variables inside the function.
//    Example: totalCost(20, 3) returns 66.
const priceWithTax = null; // replace null with an arrow function

function totalCost(price, count) {

}`,
    referenceSolution: `const priceWithTax = (price) => price + price / 10;

function totalCost(price, count) {
  let total = 0;
  total = priceWithTax(price) * count;
  return total;
}`,
    sampleTests: [
      {
        name: "adds ten percent tax to one price",
        code: `test("adds ten percent tax to one price", () => { expect(priceWithTax(20)).toBe(22); });`,
      },
    ],
    hiddenTests: [
      {
        name: "totals the cost of several potions",
        code: `test("totals the cost of several potions", () => { expect(totalCost(20, 3)).toBe(66); });`,
      },
      {
        name: "charges nothing for zero potions",
        code: `test("charges nothing for zero potions", () => { expect(totalCost(50, 0)).toBe(0); });`,
      },
      {
        name: "handles a price whose tax has a fraction",
        code: `test("handles a price whose tax has a fraction", () => { expect(totalCost(15, 2)).toBe(33); });`,
      },
      {
        name: "gives the same answer on repeated calls",
        code: `test("gives the same answer on repeated calls", () => { expect(totalCost(20, 3)).toBe(66); expect(totalCost(20, 3)).toBe(66); });`,
      },
      {
        name: "taxes other prices on their own",
        code: `test("taxes other prices on their own", () => { expect(priceWithTax(50)).toBe(55); expect(priceWithTax(0)).toBe(0); });`,
      },
    ],
  },
];
