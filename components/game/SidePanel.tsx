"use client";

// plain buttons instead of 8bitcn Tabs, since the pixel font overflows 640px with four tabs and the expand button
import type { ReactNode } from "react";
import { BookOpen, Close, MessageText, Scale } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";
import { Tip } from "./bits";
import { ScrollPane } from "./ScrollPane";

export type PanelTab = { id: string; label: string; icon?: ReactNode; closable: boolean };

export function Tab({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: PanelTab;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "-mb-[2px] flex h-10 shrink-0 items-center gap-2 border-2 border-b-0 px-3",
        active ? "border-border border-t-primary bg-panel text-foreground" : "border-transparent text-muted-foreground",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className="flex items-center gap-2 text-[13px] whitespace-nowrap hover:text-foreground"
      >
        {tab.icon}
        {tab.label}
      </button>
      {tab.closable && (
        <button type="button" onClick={onClose} aria-label={`Close ${tab.label}`} className="text-muted-foreground hover:text-foreground">
          <Close width={12} height={12} />
        </button>
      )}
    </div>
  );
}

export function TabRow({ children, right, left, className }: { children: ReactNode; right?: ReactNode; left?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end gap-1 border-b-2 border-border bg-background px-3 pt-3", className)}>
      {left && <div className="flex shrink-0 items-center pb-1.5">{left}</div>}
      <ScrollPane horizontal className="min-w-0">
        <div role="tablist" className="flex items-end gap-1">
          {children}
        </div>
      </ScrollPane>
      {right && <div className="ml-auto flex shrink-0 items-center gap-3 pb-1.5 pl-3">{right}</div>}
    </div>
  );
}

export function LessonChip({ name, onOpen }: { name: string; onOpen?: () => void }) {
  return (
    <div className="flex w-fit items-center gap-4 border-2 border-border bg-card py-1.5 pr-1.5 pl-3">
      <BookOpen width={18} height={18} className="shrink-0 text-primary" />
      <span className="text-sm">Lesson: {name}</span>
      {onOpen && (
        <Button variant="outline" size="sm" className="mx-1.5 px-3 text-[9px]" onClick={onOpen}>
          Open
        </Button>
      )}
    </div>
  );
}

export function SidePanel({
  tabs,
  active,
  onSelect,
  onClose,
  maximised,
  setMaximised,
  children,
}: {
  tabs: PanelTab[];
  active: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  maximised: boolean;
  setMaximised: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-panel">
      <TabRow
        right={
          maximised ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-[10px] text-muted-foreground" onClick={() => setMaximised(false)}>
              <MessageText width={14} height={14} />
              Show chat
            </Button>
          ) : (
            <Tip label="Expand panel">
              <Button variant="ghost" size="sm" className="px-2 text-muted-foreground" aria-label="Expand panel" onClick={() => setMaximised(true)}>
                <Scale width={18} height={18} />
              </Button>
            </Tip>
          )
        }
      >
        {tabs.map((t) => (
          <Tab key={t.id} tab={t} active={active === t.id} onSelect={() => onSelect(t.id)} onClose={() => onClose(t.id)} />
        ))}
      </TabRow>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
