"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Logout, SettingsCog, User } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/8bit/dropdown-menu";
import { getGameData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "./session";

// placeholder links until we have the real URLs
const GITHUB_URL = "https://github.com/Syntax-and-Sorcery/syntax-and-sorcery";
export const CONTACT_URL = GITHUB_URL;

// points the header Map link at the first active track
let mapHrefCache: string | null = null;
export function useMapHref(): string | null {
  const [href, setHref] = useState(mapHrefCache);
  useEffect(() => {
    if (mapHrefCache) return;
    let cancelled = false;
    getGameData()
      .listTracks()
      .then((tracks) => {
        const track = tracks.find((t) => t.status === "active");
        if (!track || cancelled) return;
        mapHrefCache = `/play/${track.slug}`;
        setHref(mapHrefCache);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return href;
}

function Logo() {
  return (
    <Link href="/" className="retro text-[13px] whitespace-nowrap">
      Syntax <span className="text-primary">&amp;</span> Sorcery
    </Link>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className={cn("hidden text-[10px] sm:inline-flex", active && "text-primary")}>
      <Link href={href} aria-current={active ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
}

function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const mapHref = useMapHref();
  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      <NavLink href={mapHref ?? "/"} active={pathname.startsWith("/play/")}>
        Map
      </NavLink>
      <NavLink href="/progress" active={pathname === "/progress"}>
        Progress
      </NavLink>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2 gap-2 px-3 text-[10px]">
            <User width={14} height={14} />
            {username}
            <ChevronDown width={14} height={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={10} className="w-48">
          <DropdownMenuItem className="gap-3 text-[10px] sm:hidden" onSelect={() => router.push(mapHref ?? "/")}>
            Map
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 text-[10px] sm:hidden" onSelect={() => router.push("/progress")}>
            Progress
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 text-[10px]" onSelect={() => router.push("/settings")}>
            <SettingsCog width={14} height={14} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-3 text-[10px]"
            onSelect={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
          >
            <Logout width={14} height={14} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

/** set bare to hide the Sign in and Sign up links, like on auth pages */
export function SiteHeader({ bare }: { bare?: boolean }) {
  const session = useSession();
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b-2 border-border bg-panel px-4 sm:px-10">
      <Logo />
      {session.status === "signed-in" ? (
        <UserMenu username={session.user.username} />
      ) : session.status === "signed-out" && !bare ? (
        <div className="flex items-center gap-3 sm:gap-6">
          <Button asChild variant="outline" size="sm" className="px-3 text-[10px] sm:px-4">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="px-3 text-[10px] sm:px-4">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}

const footerLinks = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "Kenney 1-Bit Pack", href: "https://kenney.nl/assets/1-bit-pack" },
  { label: "Pixelarticons", href: "https://pixelarticons.com" },
  { label: "8bitcn", href: "https://www.8bitcn.com" },
];

export function SiteFooter() {
  return (
    <footer className="grid w-full grid-cols-1 gap-8 border-t-2 border-border bg-panel px-4 py-6 sm:px-10 md:grid-cols-[1fr_auto_320px] md:gap-20">
      {/* Silkscreen's "&" reads as "$", so the ampersand comes from Press Start 2P, as in the header */}
      <span className="display text-[40px] leading-[1.05]">
        Syntax <span className="retro align-[-4px] text-[29px] leading-none text-primary">&amp;</span>
        <br />
        Sorcery
      </span>
      <div className="flex flex-col gap-3">
        <span className="retro text-[10px] text-muted-foreground">Links</span>
        <ul className="flex flex-col gap-1.5">
          {footerLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="text-xs text-muted-foreground hover:text-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <span className="retro text-[10px] text-muted-foreground">About</span>
        <p className="text-xs leading-relaxed text-muted-foreground">
          A student project for a software engineering course. An AI game master teaches JavaScript through lessons and fights.
        </p>
      </div>
    </footer>
  );
}

export function SitePage({
  children,
  center,
  footer,
  bare,
  className,
}: {
  children: ReactNode;
  center?: boolean;
  footer?: boolean;
  bare?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader bare={bare} />
      <main
        className={cn(
          "mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-4 py-12 sm:px-10",
          center && "justify-center pb-16",
          className,
        )}
      >
        {children}
      </main>
      {footer && <SiteFooter />}
    </div>
  );
}

/** gold pixel frame for the main card, since 8bitcn draws borders with --ring */
export const GOLD_FRAME = "[--ring:var(--primary)]";
