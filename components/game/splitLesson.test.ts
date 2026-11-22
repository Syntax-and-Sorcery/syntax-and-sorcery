import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { splitLesson } from "./splitLesson";

// built from lines because a code fence inside a template literal needs escaping
const lesson = [
  "### The idea",
  "Text before.",
  "",
  "### In code",
  "```js",
  "const a = 1;",
  "console.log(a);",
  "```",
  "",
  "### Step by step",
  "Text after.",
].join("\n");

describe("splitLesson", () => {
  it("cuts a lesson into the text before, the first example, and the text after", () => {
    const { before, code, after } = splitLesson(lesson);
    expect(before).toBe("### The idea\nText before.\n\n### In code\n");
    expect(code).toBe("const a = 1;\nconsole.log(a);");
    expect(after).toBe("\n\n### Step by step\nText after.");
  });

  it("returns the whole lesson as text when there is no js example", () => {
    expect(splitLesson("Just text, no code.")).toEqual({
      before: "Just text, no code.",
      code: null,
      after: "",
    });
  });

  it("makes only the first example runnable and leaves later ones in the text after", () => {
    const two = [
      "```js",
      "first();",
      "```",
      "between",
      "```js",
      "second();",
      "```",
    ].join("\n");
    const { code, after } = splitLesson(two);
    expect(code).toBe("first();");
    expect(after).toContain("second();");
  });
});

describe("the real lessons", () => {
  const dir = join(process.cwd(), "content", "lessons");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  it.each(files)("%s has a js example to run", (file) => {
    const { code } = splitLesson(readFileSync(join(dir, file), "utf8"));
    expect(code).not.toBeNull();
  });
});
