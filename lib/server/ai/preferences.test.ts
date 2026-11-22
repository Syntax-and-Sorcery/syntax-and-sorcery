// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/types";
import { buildPreferenceString, withDefaults } from "./preferences";

describe("withDefaults", () => {
  it("fills a new profile's empty preferences with the defaults", () => {
    expect(withDefaults({})).toEqual(DEFAULT_PREFERENCES);
    expect(withDefaults(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("keeps saved choices and replaces invalid ones", () => {
    const p = withDefaults({ theme: "pirates", difficulty: "impossible", note: "hi", editorTheme: "nord", story: 3 });
    expect(p).toMatchObject({ theme: "pirates", note: "hi", editorTheme: "nord" });
    expect(p.difficulty).toBe(DEFAULT_PREFERENCES.difficulty);
    expect(p.story).toBe(DEFAULT_PREFERENCES.story);
  });
});

describe("buildPreferenceString", () => {
  const prefs = { ...DEFAULT_PREFERENCES, note: `  ${"n".repeat(400)}  `, editorTheme: "dracula" as const };

  it("includes a trimmed, capped note only when includeNote is true", () => {
    const withNote = buildPreferenceString(prefs, { includeNote: true });
    const without = buildPreferenceString(prefs, { includeNote: false });
    expect(withNote).toContain("n".repeat(300));
    expect(withNote).not.toContain("n".repeat(301));
    expect(without).not.toContain("nnn");
  });

  it("never includes editorTheme in the preference string", () => {
    expect(buildPreferenceString(prefs, { includeNote: true })).not.toContain("dracula");
  });

  it("leaves out an empty note", () => {
    expect(buildPreferenceString(DEFAULT_PREFERENCES, { includeNote: true })).toBe(buildPreferenceString(DEFAULT_PREFERENCES, { includeNote: false }));
  });
});
