import type { SeedPuzzle } from "./types";

export const objects: SeedPuzzle[] = [
  // puzzle 1
  {
    kind: "mcq",
    concept: "properties",
    difficulty: 1,
    theme: "fantasy",
    title: "The Upgraded Hero",
    description: "Predict an object's values after properties are changed and added.",
    question:
      'What does this print?\n\n```js\nconst hero = { name: "Ana", level: 3 };\nhero.level = hero.level + 1;\nhero.weapon = "sword";\nconsole.log(hero.level + " " + hero.weapon);\n```',
    options: ["3 sword", "4 sword", "4 undefined", "An error"],
    correctIndex: 1,
    explanation:
      "The second line raises `level` from 3 to 4, and the third line adds a new `weapon` property. Both are in place when the last line reads them.",
  },
  // puzzle 2
  {
    kind: "mcq",
    concept: "methods",
    difficulty: 2,
    theme: "scifi",
    title: "The Burning Engine",
    description: "Predict a value returned by a method that updates its own object.",
    question:
      "What does this print?\n\n```js\nconst ship = {\n  fuel: 50,\n  burn(amount) {\n    this.fuel = this.fuel - amount;\n    return this.fuel;\n  },\n};\n\nship.burn(10);\nconsole.log(ship.burn(15));\n```",
    options: ["40", "35", "25", "15"],
    correctIndex: 2,
    explanation:
      "`this` is `ship`, so the fuel carries over between calls: 50 - 10 = 40, then 40 - 15 = 25.",
  },
  // puzzle 3
  {
    kind: "mcq",
    concept: "looping-over-keys",
    difficulty: 3,
    theme: "plain",
    title: "The Vote Count",
    description:
      "Predict the result of a for...in loop that tracks the largest value.",
    question:
      'What does this print?\n\n```js\nconst votes = { red: 4, blue: 7, green: 2 };\nlet best = "";\nlet most = 0;\n\nfor (const color in votes) {\n  if (votes[color] > most) {\n    best = color;\n    most = votes[color];\n  }\n}\n\nconsole.log(best);\n```',
    options: ["7", "red", "green", "blue"],
    correctIndex: 3,
    explanation:
      'The loop visits each color name. `blue` has the highest count (7), so `best` ends up holding the name "blue", not the number 7.',
  },
  // puzzle 4
  {
    kind: "short",
    concept: "arrays-of-objects",
    difficulty: 3,
    theme: "pirates",
    title: "The Nameless Crew",
    description:
      "Explain a failed property read on a list of objects and how to fix it.",
    question:
      'Given `const crew = [{ name: "Ann" }, { name: "Bo" }];`, why does `crew.name` give `undefined`, and how do you read Bo\'s name?',
    modelAnswer:
      "`crew` is an array, and only the objects inside it have a `name`. Pick an item first: `crew[1].name`.",
    rubric:
      "Passes if it says the array itself has no name property (only its items do) and shows how to reach Bo's name through an item, like crew[1].name or looping over the array. Wording doesn't matter.",
    maxLength: 300,
  },
  // puzzle 5
  {
    kind: "short",
    concept: "properties",
    difficulty: 2,
    theme: "cyberpunk",
    title: "The Misspelled Key",
    description: "Describe the result of reading a property name that doesn't exist.",
    question:
      "If `hero` has a property `gold` and you write `hero.glod` by mistake, what happens?",
    modelAnswer:
      "You get `undefined` instead of an error, so the typo quietly gives no value.",
    rubric:
      "Passes if it says the result is undefined (no error is thrown). Wording and examples don't matter.",
    maxLength: 300,
  },
  // puzzle 6 (boss)
  {
    kind: "code",
    concept: "boss",
    difficulty: 4,
    theme: "fantasy",
    title: "The Keymaker's Party Report",
    description:
      "Summarize a party of heroes and their bags into one report object; tests bags, ties, empty parties and the describe method.",
    starterCode: `// party is an array of heroes like { name: "Ana", gold: 50, bag: { potion: 2, scroll: 1 } }.
// bag counts each item the hero carries.
// Return an object with:
//   totalGold: the gold of all heroes added together
//   totalItems: every number in every bag added together
//   richest: the name of the hero with the most gold ("nobody" for an empty party; on a tie the earlier hero wins)
//   describe(): a method returning text like "50 gold in 3 items", using this
// Example: for [{ name: "Ana", gold: 30, bag: { potion: 2 } }], totalItems is 2 and richest is "Ana".
function partyReport(party) {

}`,
    referenceSolution: `function partyReport(party) {
  const report = {
    totalGold: 0,
    totalItems: 0,
    richest: "nobody",
    describe() {
      return this.totalGold + " gold in " + this.totalItems + " items";
    },
  };
  let mostGold = -1;
  for (const hero of party) {
    report.totalGold = report.totalGold + hero.gold;
    for (const item in hero.bag) {
      report.totalItems = report.totalItems + hero.bag[item];
    }
    if (hero.gold > mostGold) {
      mostGold = hero.gold;
      report.richest = hero.name;
    }
  }
  return report;
}`,
    sampleTests: [
      {
        name: "adds up the gold and finds the richest hero",
        code: `test("adds up the gold and finds the richest hero", () => { const report = partyReport([{ name: "Ana", gold: 50, bag: { potion: 2 } }, { name: "Bo", gold: 80, bag: { scroll: 1 } }]); expect(report.totalGold).toBe(130); expect(report.richest).toBe("Bo"); });`,
      },
    ],
    hiddenTests: [
      {
        name: "counts every item across all bags",
        code: `test("counts every item across all bags", () => { const report = partyReport([{ name: "Ana", gold: 10, bag: { potion: 2, scroll: 1 } }, { name: "Bo", gold: 5, bag: { potion: 3 } }]); expect(report.totalItems).toBe(6); });`,
      },
      {
        name: "reports an empty party",
        code: `test("reports an empty party", () => { const report = partyReport([]); expect(report.totalGold).toBe(0); expect(report.totalItems).toBe(0); expect(report.richest).toBe("nobody"); });`,
      },
      {
        name: "lets the earlier hero win a tie for richest",
        code: `test("lets the earlier hero win a tie for richest", () => { const report = partyReport([{ name: "Ana", gold: 40, bag: {} }, { name: "Bo", gold: 40, bag: {} }]); expect(report.richest).toBe("Ana"); });`,
      },
      {
        name: "handles a hero with an empty bag",
        code: `test("handles a hero with an empty bag", () => { const report = partyReport([{ name: "Ana", gold: 20, bag: {} }]); expect(report.totalItems).toBe(0); expect(report.totalGold).toBe(20); });`,
      },
      {
        name: "describes the party with its method",
        code: `test("describes the party with its method", () => { const report = partyReport([{ name: "Ana", gold: 30, bag: { potion: 2 } }, { name: "Bo", gold: 20, bag: { scroll: 1 } }]); expect(report.describe()).toBe("50 gold in 3 items"); });`,
      },
    ],
  },
];
