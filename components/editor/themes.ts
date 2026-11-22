"use client";

import { createContext, useContext } from "react";
import { createTheme, type CreateThemeOptions } from "@uiw/codemirror-themes";
import { draculaDarkStyle } from "@uiw/codemirror-theme-dracula";
import { githubDarkStyle, githubLightStyle } from "@uiw/codemirror-theme-github";
import { nordDarkStyle } from "@uiw/codemirror-theme-nord";
import { tokyoNightStyle } from "@uiw/codemirror-theme-tokyo-night";
import { DEFAULT_PREFERENCES, type EditorTheme } from "@/lib/types";

// colors and styles stay on the entry so inline code in the chat can match the editor
function theme(label: string, mode: "dark" | "light", background: string, foreground: string, styles: CreateThemeOptions["styles"]) {
  const settings = { background, foreground, gutterBackground: background, gutterBorder: "transparent", fontFamily: "var(--font-body), ui-monospace, monospace" };
  return { label, background, foreground, styles, extension: createTheme({ theme: mode, settings, styles }) };
}

export const EDITOR_THEMES = {
  // a touch darker than stock so it sits nicely on the app's panels
  "tokyo-night": theme("Tokyo Night", "dark", "#13141c", "#c0caf5", tokyoNightStyle),
  dracula: theme("Dracula", "dark", "#282a36", "#f8f8f2", draculaDarkStyle),
  "github-dark": theme("GitHub Dark", "dark", "#0d1117", "#c9d1d9", githubDarkStyle),
  nord: theme("Nord", "dark", "#2e3440", "#d8dee9", nordDarkStyle),
  "github-light": theme("GitHub Light", "light", "#ffffff", "#24292e", githubLightStyle),
};
export type EditorThemeEntry = ReturnType<typeof theme>;

// old or hand-edited preferences can hold a name we don't know
export function editorTheme(name: string | undefined): EditorThemeEntry {
  return name && Object.hasOwn(EDITOR_THEMES, name) ? EDITOR_THEMES[name as EditorTheme] : EDITOR_THEMES[DEFAULT_PREFERENCES.editorTheme];
}

// the adventure page passes in profiles.preferences.editorTheme
export const EditorThemeContext = createContext<EditorTheme>(DEFAULT_PREFERENCES.editorTheme);
export function useEditorTheme() {
  return editorTheme(useContext(EditorThemeContext));
}
