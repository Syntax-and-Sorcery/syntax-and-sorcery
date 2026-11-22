"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash } from "pixelarticons/react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/8bit/alert-dialog";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";
import { Label } from "@/components/ui/8bit/label";
import { Spinner } from "@/components/ui/8bit/spinner";
import { Textarea } from "@/components/ui/8bit/textarea";
import { toast } from "@/components/ui/8bit/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/8bit/toggle-group";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { EDITOR_THEMES } from "@/components/editor/themes";
import { Loading } from "@/components/game/bits";
import { SitePage } from "@/components/site/SitePage";
import { IS_MOCK, signOut, useSession } from "@/components/site/session";
import { getGameData } from "@/lib/data";
import type { EditorTheme, Preferences } from "@/lib/types";

const NOTE_MAX = 300;

type Option<T extends string> = { value: T; label: string };
const THEMES: Option<Preferences["theme"]>[] = [
  { value: "fantasy", label: "Fantasy" },
  { value: "scifi", label: "Sci-fi" },
  { value: "pirates", label: "Pirates" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "plain", label: "Plain" },
];
const STORIES: Option<Preferences["story"]>[] = [
  { value: "none", label: "None" },
  { value: "short", label: "Short" },
  { value: "rich", label: "Detailed" },
];
const DIFFICULTIES: Option<Preferences["difficulty"]>[] = [
  { value: "gentle", label: "Gentle" },
  { value: "normal", label: "Normal" },
  { value: "brutal", label: "Brutal" },
];
const EXPLANATIONS: Option<Preferences["explanations"]>[] = [
  { value: "short", label: "Short" },
  { value: "step_by_step", label: "Step by step" },
  { value: "analogies", label: "With analogies" },
];
const EDITOR_OPTIONS = (Object.keys(EDITOR_THEMES) as EditorTheme[]).map((value) => ({ value, label: EDITOR_THEMES[value].label }));

const previewCode = `const chests = [120, 40, 300];
let total = 0; // the empty jar
for (const gold of chests) total += gold;`;

function Field({ id, label, children, note }: { id?: string; label: string; children: ReactNode; note?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} font="normal" className="text-sm">
        {label}
      </Label>
      {children}
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  children,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4" role="group" aria-label={label}>
      <span className="text-sm">{label}</span>
      <ToggleGroup
        type="single"
        variant="outline"
        className="flex-wrap justify-start gap-4 px-1.5"
        value={value}
        onValueChange={(v: string) => v && onChange(v as T)}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            variant="outline"
            // 8bitcn spreads className after its own, so repeat retro/relative and override rounded-lg
            className="retro relative h-9 rounded-none px-4 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {children}
    </div>
  );
}

// calls POST /api/account/delete (T-27), then signs out once the user row is gone
function DeleteAccount({ username }: { username: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      // mock mode has no real account, so it only signs out
      const res = IS_MOCK ? null : await fetch("/api/account/delete", { method: "POST" });
      if (res && !res.ok) throw new Error(String(res.status));
    } catch {
      toast("Your account couldn't be deleted. Try again in a moment.");
      setBusy(false);
      return;
    }
    // the route already cleared the cookies, so this just updates the open tab
    await signOut().catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <AlertDialog onOpenChange={() => setTyped("")}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-hp/50 px-5 py-3">
        <span className="text-sm text-muted-foreground">Deletes your account and all progress.</span>
        <AlertDialogPrimitive.Trigger asChild>
          <Button variant="destructive" size="sm" className="mx-1.5 shrink-0 gap-2 px-3 text-[10px]">
            <Trash width={14} height={14} />
            Delete account
          </Button>
        </AlertDialogPrimitive.Trigger>
      </div>
      <AlertDialogContent font="normal" className="max-w-[520px]! gap-5 p-7">
        <AlertDialogHeader>
          <AlertDialogTitle className="retro text-[14px] font-normal">Delete your account?</AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-[15px] leading-relaxed">
            This deletes your levels, XP, items and adventures for good.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="confirm-username" font="normal" className="text-sm">
            Type your username to confirm
          </Label>
          <Input id="confirm-username" font="normal" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="text-[15px]" />
        </div>
        <AlertDialogFooter className="m-0 gap-6 border-0 bg-transparent p-0 pt-2">
          {/* 8bitcn's Cancel and Action take no variant, so the primitives wrap 8bitcn Buttons */}
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="outline" className="px-5 text-[10px]">
              Cancel
            </Button>
          </AlertDialogPrimitive.Cancel>
          <Button
            variant="destructive"
            className="gap-2 px-5 text-[10px]"
            disabled={typed.trim() !== username || busy}
            onClick={remove}
          >
            {busy ? <Spinner variant="diamond" className="size-4" /> : <Trash width={14} height={14} />}
            Delete account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SettingsPage() {
  const session = useSession();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getGameData()
      .getPreferences()
      .then((p) => !cancelled && setPrefs(p));
    return () => {
      cancelled = true;
    };
  }, []);

  if (session.status !== "signed-in" || !prefs) {
    return (
      <SitePage>
        <Loading />
      </SitePage>
    );
  }

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs({ ...prefs, [key]: value });

  async function save() {
    if (!prefs) return;
    setSaving(true);
    try {
      await getGameData().updatePreferences({ ...prefs, note: prefs.note.slice(0, NOTE_MAX) });
      toast("Saved.");
    } catch {
      toast("Your settings couldn't be saved. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SitePage>
      <h1 className="display -mt-4 pb-8 text-[36px] sm:text-[44px]">Settings</h1>
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.15fr_1fr]">
        <section className="flex flex-col gap-6">
          <span className="retro text-[11px] text-muted-foreground">Profile</span>
          {/* read-only until GameData supports changing usernames */}
          <Field id="username" label="Username">
            <Input id="username" font="normal" value={session.user.username} readOnly className="text-[15px]" />
          </Field>
          <Field id="email" label="Email" note="Can't be changed.">
            <div className="relative">
              <Input id="email" font="normal" disabled value={session.user.email} className="text-[15px]" />
              <Lock width={16} height={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
          <Choice label="Code theme" options={EDITOR_OPTIONS} value={prefs.editorTheme} onChange={(v) => set("editorTheme", v)}>
            <CodeEditor value={previewCode} language="javascript" readOnly theme={prefs.editorTheme} className="border-2 border-border px-1" />
            <span className="-mt-1 text-xs text-muted-foreground">Applies to the editor, chat and lessons.</span>
          </Choice>
          <DeleteAccount username={session.user.username} />
        </section>
        <section className="flex flex-col gap-6">
          <span className="retro text-[11px] text-muted-foreground">Game preferences</span>
          <Choice label="Story theme" options={THEMES} value={prefs.theme} onChange={(v) => set("theme", v)} />
          <Choice label="Story" options={STORIES} value={prefs.story} onChange={(v) => set("story", v)} />
          <Choice label="Difficulty" options={DIFFICULTIES} value={prefs.difficulty} onChange={(v) => set("difficulty", v)} />
          <Choice label="Explanations" options={EXPLANATIONS} value={prefs.explanations} onChange={(v) => set("explanations", v)} />
          <Field id="note" label="Note to the game master">
            <div className="relative">
              <Textarea
                id="note"
                font="normal"
                value={prefs.note}
                maxLength={NOTE_MAX}
                onChange={(e) => set("note", e.target.value)}
                rows={3}
                className="resize-none text-[15px]"
              />
              <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
                {prefs.note.length} / {NOTE_MAX}
              </span>
            </div>
          </Field>
          <div>
            <Button className="mx-1.5 gap-2 px-8 text-[11px]" onClick={save} disabled={saving}>
              {saving && <Spinner variant="diamond" className="size-4" />}
              Save
            </Button>
          </div>
        </section>
      </div>
    </SitePage>
  );
}
