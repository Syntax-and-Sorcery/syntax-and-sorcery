// the tracks, their adventures in teaching order, and each adventure's concepts
// each concept's lesson is content/lessons/<slug>.md
// concept slugs are unique across a track; "boss" is reserved
import type { Concept, Language, TrackStatus } from "@/lib/types";

export interface TrackOutline {
  slug: string;
  title: string;
  language: Language;
  description: string;
  status: TrackStatus;
  adventures: { slug: string; title: string; summary: string; concepts: Omit<Concept, "lesson">[] }[];
}

export const javascriptTrack: TrackOutline = {
  slug: "javascript",
  title: "JavaScript",
  language: "javascript",
  description: "From your first variable to closures, one adventure at a time.",
  status: "active",
  adventures: [
    {
      slug: "basics",
      title: "The Shallow Shore",
      summary: "Name things, store them, and print them.",
      concepts: [
        { slug: "variables", name: "Variables", description: "Storing a value under a name so you can use it later." },
        { slug: "numbers", name: "Numbers", description: "Doing math and rounding results." },
        { slug: "strings", name: "Strings", description: "Joining, measuring, and slicing text." },
      ],
    },
    {
      slug: "conditionals",
      title: "The Fork in the Road",
      summary: "Make your code choose a path.",
      concepts: [
        { slug: "if-else", name: "If and else", description: "Running code only when a condition is true." },
        { slug: "comparisons", name: "Comparisons", description: "Checking whether values are equal, bigger, or smaller." },
        { slug: "logical-operators", name: "Logical operators", description: "Combining conditions with and, or, and not." },
        { slug: "switch", name: "Switch", description: "Picking one of many paths by value." },
      ],
    },
    {
      slug: "loops",
      title: "The Looping Labyrinth",
      summary: "Repeat work without repeating code.",
      concepts: [
        { slug: "for-loops", name: "For loops", description: "Repeating code a known number of times." },
        { slug: "while-loops", name: "While loops", description: "Repeating code while a condition stays true." },
        { slug: "accumulators", name: "Accumulators", description: "Building a result, like a total, one round at a time." },
        { slug: "break-continue", name: "Break and continue", description: "Leaving a loop early or skipping one round." },
      ],
    },
    {
      slug: "functions",
      title: "The Spellwright's Tower",
      summary: "Package code so you can run it again.",
      concepts: [
        { slug: "defining-functions", name: "Defining functions", description: "Naming a block of code and running it by calling that name." },
        { slug: "parameters", name: "Parameters", description: "Passing values into a function." },
        { slug: "return-values", name: "Return values", description: "Getting a result back from a function." },
        { slug: "scope", name: "Scope", description: "Where your code can see and use a variable." },
        { slug: "arrow-functions", name: "Arrow functions", description: "A shorter way to write small functions." },
      ],
    },
    {
      slug: "arrays",
      title: "The Shelves of Order",
      summary: "Keep many values in one ordered list.",
      concepts: [
        { slug: "indexes", name: "Indexes", description: "Making a list and reading or changing items by position." },
        { slug: "push-pop", name: "Push and pop", description: "Adding and removing items at the end." },
        { slug: "looping-over-arrays", name: "Looping over arrays", description: "Visiting every item in a list, one at a time." },
        { slug: "map-filter", name: "Map and filter", description: "Making a new list from an old one." },
        { slug: "find", name: "Find", description: "Getting the first item that matches." },
      ],
    },
    {
      slug: "objects",
      title: "The Keymaker's Vault",
      summary: "Group related values under names.",
      concepts: [
        { slug: "properties", name: "Properties", description: "Storing named values inside one object." },
        { slug: "methods", name: "Methods", description: "Functions that belong to an object." },
        { slug: "looping-over-keys", name: "Looping over keys", description: "Visiting every property of an object." },
        { slug: "arrays-of-objects", name: "Lists of objects", description: "Keeping many objects in one array and reading their properties." },
      ],
    },
    {
      slug: "closures",
      title: "The Closure Keep",
      summary: "Functions that remember where you created them.",
      concepts: [
        { slug: "functions-in-functions", name: "Functions in functions", description: "Defining a function inside another one." },
        { slug: "returning-functions", name: "Returning functions", description: "Making a function that builds and returns another function." },
        { slug: "counters", name: "Counters", description: "A function that keeps its own private count." },
        { slug: "callbacks", name: "Callbacks", description: "Passing a function for another function to call." },
      ],
    },
  ],
};

export const pythonTrack: TrackOutline = {
  slug: "python",
  title: "Python",
  language: "python",
  description: "From your first variable to closures, this time in Python.",
  status: "coming_soon",
  adventures: [],
};
