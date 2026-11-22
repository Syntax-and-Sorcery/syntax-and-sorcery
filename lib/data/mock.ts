// in-memory fixture GameData for NEXT_PUBLIC_DATA_SOURCE=mock
// resets on page reload
// inlines the few rules it needs so it doesn't call the lib/rules stubs that throw "TODO"
import { conceptStats } from "@/lib/rules/progress";
import type {
  Adventure,
  AdventureRun,
  AdventureStatus,
  AdventureWithProgress,
  Concept,
  Encounter,
  EncounterStatus,
  InventoryEntry,
  Item,
  PlayerPuzzle,
  Preferences,
  ProgressStats,
  TestCase,
  Track,
  TrackProgress,
} from "@/lib/types";
import type { GameData } from "./index";

// valid v4-shaped UUIDs, because the game master's schemas check ids with z.string().uuid()
const KIND = { track: 1, adventure: 2, run: 3, encounter: 4, puzzle: 5, message: 6 } as const;
export function mockId(kind: keyof typeof KIND, n: number): string {
  return `00000000-0000-4000-8000-${KIND[kind].toString(16).padStart(4, "0")}${n.toString(16).padStart(8, "0")}`;
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => structuredClone(value);

export const JS_TRACK_ID = mockId("track", 1);
const PY_TRACK_ID = mockId("track", 2);

const tracks: Track[] = [
  {
    id: JS_TRACK_ID,
    slug: "javascript",
    title: "JavaScript",
    language: "javascript",
    description: "From your first variable to closures, one adventure at a time.",
    status: "active",
  },
  {
    id: PY_TRACK_ID,
    slug: "python",
    title: "Python",
    language: "python",
    description: "The same journey in Python.",
    status: "coming_soon",
  },
];

// a lesson in the T-19 structure
// the three Loops lessons are written out; the rest use this short template
function templateLesson(name: string, description: string): string {
  return `### The problem
You keep running into this on your voyage: ${description.charAt(0).toLowerCase()}${description.slice(1)}

### The idea
${name} is the tool for it. This is mock text; the real lesson comes with ticket T-19.

### In code
\`\`\`js
console.log("${name}");
\`\`\`

### Watch out
Read the error message first. It usually names the line.`;
}

const LOOPS_LESSONS: Record<string, string> = {
  "for-loops": `### The problem
You want to look at every chest in \`[120, 40, 300]\`. One line per chest works for three chests, not for three hundred.

### The idea
A \`for\` loop repeats a block of code. Its header has three parts: where to start, when to keep going, and how to step.

### Like in real life
Counting the crew at roll call: start with the first sailor, keep going while there's someone left, step to the next.

### In code
\`\`\`js
const chests = [120, 40, 300];

for (let i = 0; i < chests.length; i++) {
  console.log(chests[i]);
}
\`\`\`

### Step by step
| Round | \`i\` | Printed |
|---|---|---|
| 1 | 0 | 120 |
| 2 | 1 | 40 |
| 3 | 2 | 300 |

### Watch out
Arrays start at index \`0\`. Start at \`1\` and you skip the first chest.

### Not just arrays
The same loop counts down a timer, draws a row of tiles or retries something three times.`,
  "while-loops": `### The problem
You want to keep bailing water until the hold is dry, but you don't know how many buckets that takes.

### The idea
A \`while\` loop repeats as long as its condition is true. Use it when you don't know the number of rounds in advance.

### Like in real life
Stirring soup until it boils: you don't count the stirs, you check the pot each time.

### In code
\`\`\`js
let water = 7;

while (water > 0) {
  water = water - 3;
  console.log(water);
}
\`\`\`

### Step by step
| Round | \`water\` before | \`water\` after |
|---|---|---|
| 1 | 7 | 4 |
| 2 | 4 | 1 |
| 3 | 1 | -2 |

### Watch out
If nothing inside the loop changes the condition, it never stops.

### Not just counting
Games use the same loop to keep running until the player quits.`,
  accumulators: `### The problem
You have three chests: \`[120, 40, 300]\`. You want the total gold. A loop visits the chests one at a time, but it doesn't remember the ones it has already seen. Where does the running total live?

### The idea
Make a variable **before** the loop to hold the result so far. Each time round, add the current chest to it. When the loop ends, the variable holds the answer. A variable used like this is called an **accumulator**.

### Like in real life
Dropping coins into a jar: the jar starts empty, one coin goes in at a time, and at the end the jar holds them all. \`total\` is the jar.

### In code
\`\`\`js
const chests = [120, 40, 300];
let total = 0; // the empty jar

for (let i = 0; i < chests.length; i++) {
  total = total + chests[i];
}

console.log(total); // 460
\`\`\`

### Step by step
| Round | \`chests[i]\` | \`total\` after |
|---|---|---|
| 1 | 120 | 120 |
| 2 | 40 | 160 |
| 3 | 300 | 460 |

### Watch out
If you write \`let total = 0\` **inside** the loop, the jar is emptied every round, and you end up with only the last chest: 300.

### Not just sums
The same pattern counts things (\`count++\`), finds the biggest (\`if (gold > max) max = gold\`), or builds a string.`,
};

type ConceptSeed = [slug: string, name: string, description: string];
const ADVENTURE_SEEDS: { slug: string; title: string; summary: string; concepts: ConceptSeed[] }[] = [
  {
    slug: "basics",
    title: "The Shallow Shore",
    summary: "Name things, store them and print them.",
    concepts: [
      ["variables", "Variables", "Storing a value under a name so you can use it later."],
      ["strings", "Strings", "Working with text: joining, measuring and slicing it."],
      ["numbers", "Numbers", "Doing arithmetic and rounding results."],
    ],
  },
  {
    slug: "conditionals",
    title: "The Fork in the Road",
    summary: "Make your code choose a path.",
    concepts: [
      ["if-else", "If and else", "Running code only when a condition is true."],
      ["comparisons", "Comparisons", "Checking whether values are equal, bigger or smaller."],
      ["logical-operators", "Logical operators", "Combining conditions with and, or and not."],
      ["switch", "Switch", "Picking one of many paths by value."],
    ],
  },
  {
    slug: "loops",
    title: "The Looping Labyrinth",
    summary: "Repeat work without repeating code.",
    concepts: [
      ["for-loops", "For loops", "Repeating code a known number of times."],
      ["while-loops", "While loops", "Repeating code until a condition stops being true."],
      ["accumulators", "Accumulators", "Building up a result, like a total, one round at a time."],
      ["break-continue", "Break and continue", "Leaving a loop early or skipping one round."],
    ],
  },
  {
    slug: "functions",
    title: "The Spellwright's Tower",
    summary: "Package code into spells you can cast again.",
    concepts: [
      ["parameters", "Parameters", "Passing values into a function."],
      ["return-values", "Return values", "Getting a result back out of a function."],
      ["scope", "Scope", "Where a variable can be seen and used."],
    ],
  },
  {
    slug: "arrays",
    title: "The Shelves of Order",
    summary: "Keep many values in one ordered list.",
    concepts: [
      ["indexes", "Indexes", "Reading and changing items by position."],
      ["push-pop", "Push and pop", "Adding and removing items at the end."],
      ["map-filter", "Map and filter", "Making a new list from an old one."],
      ["find", "Find", "Getting the first item that matches."],
    ],
  },
  {
    slug: "objects",
    title: "The Keymaker's Vault",
    summary: "Group related values under names.",
    concepts: [
      ["properties", "Properties", "Storing named values inside one object."],
      ["methods", "Methods", "Functions that belong to an object."],
      ["looping-over-keys", "Looping over keys", "Visiting every property of an object."],
    ],
  },
  {
    slug: "closures",
    title: "The Closure Keep",
    summary: "Functions that remember where they were made.",
    concepts: [
      ["functions-in-functions", "Functions in functions", "Defining a function inside another one."],
      ["counters", "Counters", "A function that keeps its own private count."],
      ["callbacks", "Callbacks", "Passing a function to be called later."],
    ],
  },
];

const adventures: Adventure[] = ADVENTURE_SEEDS.map((a, i) => ({
  id: mockId("adventure", i + 1),
  trackId: JS_TRACK_ID,
  slug: a.slug,
  title: a.title,
  summary: a.summary,
  sortOrder: i + 1,
  concepts: a.concepts.map(([slug, name, description]): Concept => ({
    slug,
    name,
    description,
    lesson: LOOPS_LESSONS[slug] ?? templateLesson(name, description),
  })),
}));
const adventureBySlug = (slug: string) => adventures.find((a) => a.slug === slug)!;
export const LOOPS_ADVENTURE_ID = adventureBySlug("loops").id;

// mock grading lives in lib/api/mock.ts rather than answer keys here
export interface MockPuzzle {
  puzzle: PlayerPuzzle;
  concept: string; // a concept slug, or "boss"
  adventureId: string;
}

const t = (name: string, code: string): TestCase => ({ name, code });
let puzzleCount = 0;
const puzzles = new Map<string, MockPuzzle>();
function addPuzzle(adventureId: string, concept: string, make: (id: string) => PlayerPuzzle): string {
  const id = mockId("puzzle", ++puzzleCount);
  puzzles.set(id, { puzzle: make(id), concept, adventureId });
  return id;
}

// hand-written puzzles for the Loops adventure, with 3 sample and 3 hidden tests each and 5 for the boss
const L = LOOPS_ADVENTURE_ID;
export const LOOPS_PUZZLES = {
  forMcq: addPuzzle(L, "for-loops", (id) => ({
    id,
    kind: "mcq",
    title: "Off by one",
    difficulty: 2,
    question:
      "This loop should print every chest. Which one does it miss?\n\n```js\nconst chests = [120, 40, 300];\nfor (let i = 1; i < chests.length; i++) {\n  console.log(chests[i]);\n}\n```",
    options: ["The last one (300)", "The first one (120)", "None, it prints all three", "It never stops"],
  })),
  forCode: addPuzzle(L, "for-loops", (id) => ({
    id,
    kind: "code",
    title: "Ring the ship's bell",
    difficulty: 2,
    language: "javascript",
    starterCode:
      "// The bell rings once per hour of the watch.\n// Return an array counting down from hours to 1.\n// countdown(3) returns [3, 2, 1].\nfunction countdown(hours) {\n  // your code here\n}\n",
    sampleTests: [
      t("a three-hour watch", "test(\"a three-hour watch\", () => { expect(countdown(3)).toEqual([3, 2, 1]); });"),
      t("a one-hour watch", "test(\"a one-hour watch\", () => { expect(countdown(1)).toEqual([1]); });"),
      t("no watch at all", "test(\"no watch at all\", () => { expect(countdown(0)).toEqual([]); });"),
    ],
    hiddenTestCount: 3,
  })),
  whileMcq: addPuzzle(L, "while-loops", (id) => ({
    id,
    kind: "mcq",
    title: "Bailing out",
    difficulty: 2,
    question:
      "How many times does the body of this loop run?\n\n```js\nlet water = 7;\nwhile (water > 0) {\n  water = water - 3;\n}\n```",
    options: ["2", "3", "7", "It never stops"],
  })),
  whileCode: addPuzzle(L, "while-loops", (id) => ({
    id,
    kind: "code",
    title: "Buckets to dry",
    difficulty: 3,
    language: "javascript",
    starterCode:
      "// The hold has some water in it. Each bucket takes out `bucket` liters.\n// Return how many buckets it takes until the hold is dry (no water left).\n// bailOut(7, 3) returns 3.\nfunction bailOut(water, bucket) {\n  // your code here\n}\n",
    sampleTests: [
      t("water left over for one more bucket", "test(\"water left over for one more bucket\", () => { expect(bailOut(7, 3)).toBe(3); });"),
      t("a hold that empties in exact buckets", "test(\"a hold that empties in exact buckets\", () => { expect(bailOut(6, 3)).toBe(2); });"),
      t("a hold that is already dry", "test(\"a hold that is already dry\", () => { expect(bailOut(0, 3)).toBe(0); });"),
    ],
    hiddenTestCount: 3,
  })),
  accMcq: addPuzzle(L, "accumulators", (id) => ({
    id,
    kind: "mcq",
    title: "Where's the jar?",
    difficulty: 1,
    question: "You want the total gold of all chests. Where does `let total = 0` go?",
    options: ["Inside the loop", "Before the loop", "After the loop", "In the loop's header"],
  })),
  accShort: addPuzzle(L, "accumulators", (id) => ({
    id,
    kind: "short",
    title: "The empty jar",
    difficulty: 2,
    question: "Why must `let total = 0` come before the loop, not inside it? Answer in one or two sentences.",
    maxLength: 280,
  })),
  kraken: addPuzzle(L, "accumulators", (id) => ({
    id,
    kind: "code",
    title: "Count the rich chests",
    difficulty: 3,
    language: "javascript",
    starterCode:
      "// The Kraken guards a row of chests. Count the rich ones:\n// a chest is rich when it holds more than 100 gold.\n// countRichChests([150, 40, 300]) returns 2.\nfunction countRichChests(chests) {\n  // your code here\n}\n",
    sampleTests: [
      t("two rich chests", "test(\"two rich chests\", () => { expect(countRichChests([150, 40, 300])).toBe(2); });"),
      t("no chests", "test(\"no chests\", () => { expect(countRichChests([])).toBe(0); });"),
      t("exactly 100 is not rich", "test(\"exactly 100 is not rich\", () => { expect(countRichChests([100])).toBe(0); });"),
    ],
    hiddenTestCount: 3,
  })),
  barnacle: addPuzzle(L, "accumulators", (id) => ({
    id,
    kind: "code",
    title: "The heaviest chest",
    difficulty: 4,
    language: "javascript",
    starterCode:
      "// Return the gold in the heaviest chest, or 0 when there are no chests.\n// heaviest([120, 40, 300]) returns 300.\nfunction heaviest(chests) {\n  // your code here\n}\n",
    sampleTests: [
      t("three chests", "test(\"three chests\", () => { expect(heaviest([120, 40, 300])).toBe(300); });"),
      t("the heaviest comes first", "test(\"the heaviest comes first\", () => { expect(heaviest([500, 40])).toBe(500); });"),
      t("no chests", "test(\"no chests\", () => { expect(heaviest([])).toBe(0); });"),
    ],
    hiddenTestCount: 3,
  })),
  breakMcq: addPuzzle(L, "break-continue", (id) => ({
    id,
    kind: "mcq",
    title: "Skip a round",
    difficulty: 2,
    question: "Which keyword skips the rest of this round and goes on with the next one?",
    options: ["break", "continue", "return", "skip"],
  })),
  breakCode: addPuzzle(L, "break-continue", (id) => ({
    id,
    kind: "code",
    title: "Find the map",
    difficulty: 3,
    language: "javascript",
    starterCode:
      "// Return the position of the first \"map\" in the cargo list, or -1 if there's none.\n// Stop looking as soon as you find it.\n// findMap([\"rope\", \"map\", \"map\"]) returns 1.\nfunction findMap(cargo) {\n  // your code here\n}\n",
    sampleTests: [
      t("a map in the middle", "test(\"a map in the middle\", () => { expect(findMap([\"rope\", \"map\", \"rum\"])).toBe(1); });"),
      t("two maps", "test(\"two maps\", () => { expect(findMap([\"map\", \"map\"])).toBe(0); });"),
      t("no map on board", "test(\"no map on board\", () => { expect(findMap([\"rope\"])).toBe(-1); });"),
    ],
    hiddenTestCount: 3,
  })),
  boss: addPuzzle(L, "boss", (id) => ({
    id,
    kind: "code",
    title: "The Leviathan's hoard",
    difficulty: 4,
    language: "javascript",
    starterCode:
      "// Add up the gold in the chests, in order.\n// Skip empty chests (0). Stop at the first cursed chest (a negative number) and don't count it.\n// tallyHoard([100, 0, 50, -1, 300]) returns 150.\nfunction tallyHoard(chests) {\n  // your code here\n}\n",
    sampleTests: [
      t("a curse in the middle", "test(\"a curse in the middle\", () => { expect(tallyHoard([100, 0, 50, -1, 300])).toBe(150); });"),
      t("no curse at all", "test(\"no curse at all\", () => { expect(tallyHoard([1, 2, 3])).toBe(6); });"),
      t("a curse on the first chest", "test(\"a curse on the first chest\", () => { expect(tallyHoard([-5, 10])).toBe(0); });"),
    ],
    hiddenTestCount: 5,
  })),
};

// generic puzzles for the remaining adventures so completed runs and no-AI mode have fixtures
// option 1 is correct
const genericPuzzles = new Map<string, { mcq: string; code: string }>();
for (const adventure of adventures) {
  if (adventure.id === L) continue;
  for (const concept of adventure.concepts) {
    const fn = concept.slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
    genericPuzzles.set(concept.slug, {
      mcq: addPuzzle(adventure.id, concept.slug, (id) => ({
        id,
        kind: "mcq",
        title: `${concept.name} check`,
        difficulty: 1 + (adventure.sortOrder % 3),
        question: `Which sentence about ${concept.name.toLowerCase()} is true?`,
        options: [
          "It only works in the browser",
          concept.description,
          "It was removed from modern JavaScript",
          "It needs a library to work",
        ],
      })),
      code: addPuzzle(adventure.id, concept.slug, (id) => ({
        id,
        kind: "code",
        title: `Practice: ${concept.name}`,
        difficulty: 2 + (adventure.sortOrder % 3),
        language: "javascript",
        starterCode: `// ${concept.description}\n// Return the answer from ${fn}(input).\nfunction ${fn}(input) {\n  // your code here\n}\n`,
        sampleTests: [
          t("a small input", `test("a small input", () => { expect(${fn}(1)).toBe(1); });`),
          t("an empty input", `test("an empty input", () => { expect(${fn}(0)).toBe(0); });`),
          t("a larger input", `test("a larger input", () => { expect(${fn}(10)).toBe(10); });`),
        ],
        hiddenTestCount: 3,
      })),
    });
  }
  addPuzzle(adventure.id, "boss", (id) => ({
    id,
    kind: "code",
    title: `${adventure.title}: the final trial`,
    difficulty: 4,
    language: "javascript",
    starterCode: `// Use everything from ${adventure.title}.\nfunction finalTrial(input) {\n  // your code here\n}\n`,
    sampleTests: [t("the trial's first case", `test("the trial's first case", () => { expect(finalTrial(1)).toBe(1); });`)],
    hiddenTestCount: 5,
  }));
}

export function mockPuzzle(puzzleId: string): MockPuzzle | undefined {
  return puzzles.get(puzzleId);
}
export function mockPuzzlesOf(adventureId: string): MockPuzzle[] {
  return [...puzzles.values()].filter((p) => p.adventureId === adventureId);
}

const items: Record<string, Item> = {
  "scroll-of-remembering": {
    slug: "scroll-of-remembering",
    name: "Scroll of Remembering",
    description: "Ask the game master one question about this fight. It doesn't cost XP.",
  },
};

interface State {
  progress: Map<string, number>; // trackId to XP; presence means enrolled
  runs: Map<string, AdventureRun>; // by adventureId
  encounters: Encounter[]; // oldest first
  inventory: Map<string, number>; // item slug to quantity
  reported: Set<string>;
  preferences: Preferences;
}

let encounterCount = 0;
function encounter(
  runId: string,
  puzzleId: string,
  enemy: Encounter["enemy"],
  status: EncounterStatus,
  extra: Partial<Pick<Encounter, "basicHints" | "xpAwarded">> = {},
): Encounter {
  const p = puzzles.get(puzzleId)!;
  return {
    id: mockId("encounter", ++encounterCount),
    runId,
    puzzleId,
    concept: p.concept,
    kind: p.puzzle.kind,
    enemy,
    isBoss: p.concept === "boss",
    status,
    basicHints: extra.basicHints ?? 0,
    xpAwarded: extra.xpAwarded ?? 0,
  };
}

// builds AI SDK UIMessage fixtures for the Loops chat log
let messageCount = 0;
let toolCallCount = 0;
const msgId = () => mockId("message", ++messageCount);
const callId = () => `call_mock_${++toolCallCount}`;
const say = (text: string) => ({ id: msgId(), role: "assistant", parts: [{ type: "text", text }] });
const user = (text: string, metadata?: unknown) => ({ id: msgId(), role: "user", metadata, parts: [{ type: "text", text }] });
function lessonMessage(concept: Concept, intro: string) {
  return {
    id: msgId(),
    role: "assistant",
    parts: [
      { type: "text", text: intro },
      {
        type: "tool-show_lesson",
        toolCallId: callId(),
        state: "output-available",
        input: { concept: concept.slug },
        output: { ok: true, concept: concept.slug, name: concept.name, lesson: concept.lesson },
      },
      { type: "text", text: "Try changing the numbers and press Run. Tell me when you're ready, or ask me anything." },
    ],
  };
}
function fightMessages(e: Encounter, intro: string, summary: string | null) {
  const { name, sprite, color } = e.enemy;
  const started = {
    id: msgId(),
    role: "assistant",
    parts: [
      { type: "text", text: intro },
      {
        type: "tool-present_puzzle",
        toolCallId: callId(),
        state: "output-available",
        input: { puzzleId: e.puzzleId, name, sprite, color },
        output: { ok: true, status: "started", encounterId: e.id },
      },
    ],
  };
  if (summary === null) return [started];
  return [started, user(summary, { action: "encounter_end", encounterIds: [e.id], summary })];
}

// fight history for the first two adventures, oldest first: W won, L lost, F fled
// picked so the progress chart shows every trend arrow and a few concepts without one
const PAST_FIGHTS: Record<string, string> = {
  variables: "WLWLWWWWWWWW", // up
  strings: "WWLWWWLWWW", // flat
  numbers: "WWWWWWW", // under 10 fights
  "if-else": "LWLWWWWWWW", // up
  comparisons: "WWWWWLWFLW", // down
  "logical-operators": "LLLWLFWWLW", // up, but still under 60%
  switch: "WFWWWWWLW", // under 10 fights
};

function initialState(): State {
  const runs = new Map<string, AdventureRun>();
  const encounters: Encounter[] = [];

  const enemies = [
    { name: "Bilge Rat", sprite: "monster", color: "#C9A227" },
    { name: "Reef Crab", sprite: "crab", color: "#F25F5C" },
    { name: "Fog Wraith", sprite: "wraith", color: "#9FB3C8" },
  ];
  for (const adventure of adventures.slice(0, 2)) {
    const runId = mockId("run", adventure.sortOrder);
    adventure.concepts.forEach((c, i) => {
      const g = genericPuzzles.get(c.slug)!;
      // a lost fight is a wrong MCQ answer and a fled one a code fight, as in real play
      [...PAST_FIGHTS[c.slug]].forEach((result, n) => {
        const enemy = enemies[(i + n) % 3];
        if (result === "L") encounters.push(encounter(runId, g.mcq, enemy, "lost"));
        else if (result === "F") encounters.push(encounter(runId, g.code, enemy, "fled", { basicHints: 1 }));
        else if (n % 2 === 0) encounters.push(encounter(runId, g.mcq, enemy, "defeated", { xpAwarded: 15 }));
        else encounters.push(encounter(runId, g.code, enemy, "defeated", { basicHints: n % 3 === 0 ? 1 : 0, xpAwarded: 45 }));
      });
    });
    const boss = mockPuzzlesOf(adventure.id).find((p) => p.concept === "boss")!;
    encounters.push(encounter(runId, boss.puzzle.id, { name: "The Tide Lord", sprite: "serpent", color: "#E4572E" }, "defeated", { xpAwarded: 225 }));
    runs.set(adventure.id, {
      id: runId,
      adventureId: adventure.id,
      status: "completed",
      storySummary:
        adventure.slug === "basics"
          ? "Mira washed up on the Shallow Shore, named her first variables and talked her way onto a ship."
          : "At the Fork in the Road, Mira out-argued the Tide Lord and chose the path to the Labyrinth.",
      messages: [],
    });
  }

  const loops = adventureBySlug("loops");
  const [forLoops, whileLoops, accumulators] = loops.concepts;
  const runId = mockId("run", loops.sortOrder);
  const P = LOOPS_PUZZLES;
  const crab = encounter(runId, P.forMcq, { name: "Bilge Crab", sprite: "crab", color: "#F25F5C" }, "defeated", { xpAwarded: 15 });
  const bat = encounter(runId, P.forCode, { name: "Bell Bat", sprite: "bat", color: "#7FD1B9" }, "defeated", { xpAwarded: 45 });
  const slime = encounter(runId, P.whileMcq, { name: "Bilge Slime", sprite: "slime", color: "#8BC34A" }, "defeated", { xpAwarded: 15 });
  const bosun = encounter(runId, P.whileCode, { name: "Skeleton Bosun", sprite: "skeleton", color: "#F4D35E" }, "defeated", { basicHints: 1, xpAwarded: 60 });
  // "barnacle" is an unknown sprite on purpose, to exercise the fallback
  const brute = encounter(runId, P.barnacle, { name: "Barnacle Brute", sprite: "barnacle", color: "#FFC857" }, "fled");
  const kraken = encounter(runId, P.kraken, { name: "The Kraken", sprite: "kraken", color: "#5BC0EB" }, "active");
  encounters.push(crab, bat, slime, bosun, brute, kraken);
  runs.set(loops.id, {
    id: runId,
    adventureId: loops.id,
    status: "in_progress",
    storySummary: null,
    messages: [
      user("Begin the adventure.", { action: "start" }),
      say("The ship drifts into a cave mouth, and the tide shuts it behind you. Every tunnel here loops back on itself. The only way out is to learn how the loops work."),
      lessonMessage(forLoops, "First, the simplest loop: one that walks along a row of chests."),
      user("Ready!"),
      ...fightMessages(crab, "Something scuttles out of the bilge.", "Defeated the Bilge Crab on the 1st Submit."),
      ...fightMessages(bat, "A bat swoops down from the bell tower.", "Defeated the Bell Bat on the 2nd Submit."),
      lessonMessage(whileLoops, "Water is pouring into the hold. Time for a loop that keeps going until the job is done."),
      user("Got it."),
      ...fightMessages(slime, "A slime oozes up through the planks.", "Defeated the Bilge Slime on the 1st Submit."),
      ...fightMessages(bosun, "The Skeleton Bosun blocks the stairs.", "Defeated the Skeleton Bosun on the 3rd Submit, 1 basic hint."),
      lessonMessage(accumulators, "The treasure room. Counting gold means remembering what you've already counted."),
      user("Ready."),
      ...fightMessages(brute, "A Barnacle Brute lumbers out of the dark.", "Fled after 2 Submits."),
      ...fightMessages(kraken, "Fair enough, that one was tough. Here's a fairer fight: the Kraken, guarding a row of chests.", null),
    ],
  });

  return {
    progress: new Map([[JS_TRACK_ID, 790]]), // level 4, 23 XP short of level 5 with the placeholder rules
    runs,
    encounters,
    inventory: new Map([["scroll-of-remembering", 2]]),
    reported: new Set(),
    preferences: {
      theme: "pirates",
      story: "short",
      difficulty: "normal",
      explanations: "step_by_step",
      note: "",
      editorTheme: "tokyo-night",
    },
  };
}

const state = initialState();

// mirrors adventureState (T-21) inline so mock mode doesn't call the stub: 2 wins including 1 MCQ
export function mockClearedConcepts(runId: string): Set<string> {
  const wins = state.encounters.filter((e) => e.runId === runId && e.status === "defeated" && !e.isBoss);
  const cleared = new Set<string>();
  for (const concept of new Set(wins.map((e) => e.concept))) {
    const own = wins.filter((e) => e.concept === concept);
    if (own.length >= 2 && own.some((e) => e.kind === "mcq")) cleared.add(concept);
  }
  return cleared;
}

export function mockRun(runId: string): AdventureRun | undefined {
  return [...state.runs.values()].find((r) => r.id === runId);
}

function adventureStatus(adventure: Adventure): AdventureStatus {
  const run = state.runs.get(adventure.id);
  if (run?.status === "completed") return "completed";
  if (run) return "in_progress";
  const previous = adventures.find((a) => a.trackId === adventure.trackId && a.sortOrder === adventure.sortOrder - 1);
  if (!previous || state.runs.get(previous.id)?.status === "completed") return "available";
  return "locked";
}

function findEncounter(encounterId: string): Encounter {
  const e = state.encounters.find((x) => x.id === encounterId);
  if (!e) throw new Error(`No encounter ${encounterId}`);
  return e;
}

function trackOfRun(runId: string): string {
  const run = mockRun(runId);
  return adventures.find((a) => a.id === run?.adventureId)?.trackId ?? JS_TRACK_ID;
}

// ends an active encounter, or returns false if it already ended
function end(encounterId: string, status: EncounterStatus): boolean {
  const e = findEncounter(encounterId);
  if (e.status !== "active") return false;
  e.status = status;
  return true;
}

export const mockGameData: GameData = {
  async listTracks() {
    await delay();
    return clone(tracks.filter((t) => t.status !== "disabled"));
  },

  async listAdventures(trackId) {
    await delay();
    return clone(
      adventures
        .filter((a) => a.trackId === trackId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((a): AdventureWithProgress => ({ ...a, status: adventureStatus(a) })),
    );
  },

  async getTrackProgress(trackId) {
    await delay();
    const xp = state.progress.get(trackId);
    return xp === undefined ? null : { trackId, xp };
  },

  async enroll(trackId) {
    await delay();
    if (!state.progress.has(trackId)) state.progress.set(trackId, 0);
    return { trackId, xp: state.progress.get(trackId)! } satisfies TrackProgress;
  },

  async getOrStartRun(adventureId) {
    await delay();
    let run = state.runs.get(adventureId);
    if (!run) {
      const adventure = adventures.find((a) => a.id === adventureId);
      if (!adventure) throw new Error(`No adventure ${adventureId}`);
      run = { id: mockId("run", adventure.sortOrder), adventureId, status: "in_progress", storySummary: null, messages: [] };
      state.runs.set(adventureId, run);
    }
    return clone(run);
  },

  async listEncounters(runId) {
    await delay();
    return clone(state.encounters.filter((e) => e.runId === runId));
  },

  async getEncounter(encounterId) {
    await delay();
    return clone(findEncounter(encounterId));
  },

  async startEncounter({ runId, puzzleId, enemy, isBoss }) {
    await delay();
    const p = puzzles.get(puzzleId);
    if (!p) throw new Error(`No puzzle ${puzzleId}`);
    if (state.encounters.some((e) => e.runId === runId && e.status === "active")) {
      throw new Error("Another fight is still active in this run");
    }
    const e = { ...encounter(runId, puzzleId, enemy, "active"), isBoss };
    state.encounters.push(e);
    return clone(e);
  },

  async getPuzzle(puzzleId) {
    await delay();
    const p = puzzles.get(puzzleId);
    if (!p) throw new Error(`No puzzle ${puzzleId}`);
    return clone(p.puzzle);
  },

  async getInventory() {
    await delay();
    return [...state.inventory]
      .filter(([, quantity]) => quantity > 0)
      .map(([slug, quantity]): InventoryEntry => ({ item: clone(items[slug]), quantity }));
  },

  async recordAttempt({ encounterId }) {
    await delay();
    findEncounter(encounterId); // validates the id; mock mode doesn't store attempts
  },

  async recordHint(encounterId) {
    await delay();
    findEncounter(encounterId).basicHints += 1;
  },

  async settleEncounter({ encounterId, xp, items: loot }) {
    await delay();
    const e = findEncounter(encounterId);
    if (!end(encounterId, "defeated")) return false; // don't grant XP or loot twice
    e.xpAwarded = xp;
    const trackId = trackOfRun(e.runId);
    state.progress.set(trackId, (state.progress.get(trackId) ?? 0) + xp);
    for (const slug of loot) state.inventory.set(slug, (state.inventory.get(slug) ?? 0) + 1);
    return true;
  },

  async fleeEncounter(encounterId) {
    await delay();
    return end(encounterId, "fled");
  },

  async loseEncounter(encounterId) {
    await delay();
    return end(encounterId, "lost");
  },

  async consumeItem(itemSlug) {
    await delay();
    const quantity = state.inventory.get(itemSlug) ?? 0;
    if (quantity <= 0) throw new Error(`No ${itemSlug} left`);
    state.inventory.set(itemSlug, quantity - 1);
  },

  async getProgressStats(trackId) {
    await delay();
    const track = tracks.find((t) => t.id === trackId && t.status === "active");
    if (!track) return { tracks: [], concepts: [] };
    const own = adventures.filter((a) => a.trackId === trackId).sort((a, b) => a.sortOrder - b.sortOrder);
    const runIds = new Set(own.map((a) => state.runs.get(a.id)?.id));
    return {
      tracks: [
        {
          trackId,
          title: track.title,
          xp: state.progress.get(trackId) ?? 0,
          completedAdventures: own.filter((a) => adventureStatus(a) === "completed").length,
          totalAdventures: own.length,
        },
      ],
      // each concept lives in one run and a run has one fight at a time, so start order is end order
      concepts: conceptStats(
        own.flatMap((a) => a.concepts),
        state.encounters.filter((e) => runIds.has(e.runId)),
      ),
    } satisfies ProgressStats;
  },

  async reportPuzzle(puzzleId) {
    await delay();
    if (state.reported.has(puzzleId)) return false;
    state.reported.add(puzzleId);
    return true;
  },

  async getPreferences() {
    await delay();
    return clone(state.preferences);
  },

  async updatePreferences(preferences) {
    await delay();
    state.preferences = clone(preferences);
  },
};

