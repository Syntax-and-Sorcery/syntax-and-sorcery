"use client";

// sidebar, chat, and resizable side panel on desktop; collapses to one tabbed column below 1024px
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ArrowBarLeft, ArrowBarRight, ArrowLeft, MessageText } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { AdventureState } from "@/lib/rules/adventure-state";
import { cn } from "@/lib/utils";
import { ConceptBlocks } from "./ConceptBlocks";
import { SidePanel, Tab, TabRow, type PanelTab } from "./SidePanel";
import { LevelBar, SplitHandle, Tip } from "./bits";
import type { LevelInfo } from "./rules";
import { ScrollPane } from "@/components/game/ScrollPane";

type Shell = { maximised: boolean; setMaximised: (v: boolean) => void; desktop: boolean };
const ShellContext = createContext<Shell>({ maximised: false, setMaximised: () => {}, desktop: true });
export const useShell = () => useContext(ShellContext);

const DESKTOP = "(min-width: 1024px)";
function useDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

export interface SidebarInfo {
  mapHref: string;
  adventureNumber: number;
  title: string;
  state: AdventureState;
  level: LevelInfo;
  inventory: ReactNode;
}

function Sidebar({ info, collapsed, setCollapsed }: { info: SidebarInfo; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center border-r-2 border-border bg-panel pt-6">
        <Tip label="Show sidebar" side="right">
          <Button variant="ghost" size="icon" aria-label="Show sidebar" onClick={() => setCollapsed(false)}>
            <ArrowBarRight width={20} height={20} />
          </Button>
        </Tip>
      </aside>
    );
  }
  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r-2 border-border bg-panel">
      <div className="flex flex-col gap-4 border-b-2 border-border px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm" className="gap-2 px-3 text-[10px]">
            <Link href={info.mapHref}>
              <ArrowLeft width={14} height={14} />
              Map
            </Link>
          </Button>
          <Tip label="Hide sidebar">
            <Button
              variant="ghost"
              size="sm"
              className="-mr-2 px-2 text-muted-foreground"
              aria-label="Hide sidebar"
              onClick={() => setCollapsed(true)}
            >
              <ArrowBarLeft width={18} height={18} />
            </Button>
          </Tip>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Adventure {info.adventureNumber}</span>
          <span className="retro text-[12px] leading-5">{info.title}</span>
          <div className="pt-1">
            <ConceptBlocks state={info.state} showCount />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 pt-5">
        <span className="retro text-[10px] text-muted-foreground">Inventory</span>
        {info.inventory}
      </div>
      <LevelBar info={info.level} className="mt-auto border-t-2 border-border px-5 py-5" />
    </aside>
  );
}

export function AdventureScreen({
  sidebar,
  chat,
  composer,
  align = "bottom",
  chatWidth = "max-w-[720px]",
  scrollKey,
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  renderTab,
}: {
  sidebar: SidebarInfo;
  chat: ReactNode;
  composer: ReactNode;
  /** use "top" for completed adventures so reading starts at the top */
  align?: "bottom" | "top";
  chatWidth?: string;
  /** changes whenever the chat grows, so it scrolls to the newest message */
  scrollKey?: string | number;
  tabs: PanelTab[];
  /**
   * tab id, or "chat"
   * desktop always shows chat, so the side panel falls back to the first tab
   */
  activeTab: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  renderTab: (id: string) => ReactNode;
}) {
  const desktop = useDesktop();
  const [collapsed, setCollapsed] = useState(false);
  const [maximisedState, setMaximised] = useState(false);
  const maximised = maximisedState && tabs.length > 0 && desktop;
  const panelTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id;
  const mobileTab = tabs.some((t) => t.id === activeTab) ? activeTab : "chat";

  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (align === "bottom") end.current?.scrollIntoView({ block: "end" });
  }, [scrollKey, align, desktop, activeTab]);

  const chatColumn = (
    <main className="flex h-full min-w-0 flex-1 flex-col">
      <ScrollPane
        className={
          align === "bottom"
            ? "[mask-image:linear-gradient(to_bottom,transparent,black_56px)]"
            : "[mask-image:linear-gradient(to_top,transparent,black_56px)]"
        }
      >
        <div className="flex flex-1 flex-col px-4 py-8 sm:px-7">
          <div className={cn("mx-auto flex w-full flex-1 flex-col gap-7", align === "bottom" && "justify-end", chatWidth)}>
            {chat}
            <div ref={end} />
          </div>
        </div>
      </ScrollPane>
      {composer}
    </main>
  );

  const shell: Shell = { maximised, setMaximised, desktop };

  // tabs stay mounted so switching keeps a fight's state, and mobile hides the whole section on Chat so panelTab works for both
  const tabPanels = tabs.map((t) => (
    <div key={t.id} className={cn("flex min-h-0 flex-1 flex-col", t.id !== panelTab && "hidden")}>
      {renderTab(t.id)}
    </div>
  ));

  if (!desktop) {
    const all: PanelTab[] = [{ id: "chat", label: "Chat", icon: <MessageText width={14} height={14} />, closable: false }, ...tabs];
    return (
      <ShellContext.Provider value={shell}>
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
          <TabRow
            className="px-2 pt-2"
            left={
              <Button asChild variant="ghost" size="sm" className="px-2" aria-label="Map">
                <Link href={sidebar.mapHref}>
                  <ArrowLeft width={18} height={18} />
                </Link>
              </Button>
            }
          >
            {all.map((t) => (
              <Tab key={t.id} tab={t} active={mobileTab === t.id} onSelect={() => onSelectTab(t.id)} onClose={() => onCloseTab(t.id)} />
            ))}
          </TabRow>
          <div className={cn("flex min-h-0 flex-1 flex-col", mobileTab !== "chat" && "hidden")}>{chatColumn}</div>
          <section className={cn("flex min-h-0 flex-1 flex-col bg-panel", mobileTab === "chat" && "hidden")}>{tabPanels}</section>
          <footer className="flex items-center gap-3 border-t-2 border-border bg-panel px-4 py-3">
            <div className="max-w-[45%] shrink-0">{sidebar.inventory}</div>
            <LevelBar info={sidebar.level} className="min-w-0 flex-1 gap-2 pl-1" barClassName="mr-1.5 h-3" />
          </footer>
        </div>
      </ShellContext.Provider>
    );
  }

  // one stable tree for every layout, since swapping wrappers would remount the chat or the fight
  // maximizing hides the chat panel and its handle, and the side panel's flex-grow fills the space
  return (
    <ShellContext.Provider value={shell}>
      <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
        {!maximised && <Sidebar info={sidebar} collapsed={collapsed} setCollapsed={setCollapsed} />}
        <ResizablePanelGroup
          orientation="horizontal"
          className={cn("min-w-0 flex-1", maximised && "[&>[data-panel]:first-child]:hidden! [&>[data-separator]]:hidden!")}
        >
          <ResizablePanel id="chat" minSize={380}>
            {chatColumn}
          </ResizablePanel>
          {panelTab && <SplitHandle />}
          {panelTab && (
            <ResizablePanel id="side" defaultSize={640} minSize={440}>
              <SidePanel tabs={tabs} active={panelTab} onSelect={onSelectTab} onClose={onCloseTab} maximised={maximised} setMaximised={setMaximised}>
                {tabPanels}
              </SidePanel>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </ShellContext.Provider>
  );
}
