"use client";

import Link from "next/link";
import { ArrowLeft } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { MaskSprite } from "@/components/game/Sprite";
import { SitePage } from "@/components/site/SitePage";

export default function NotFound() {
  return (
    <SitePage center footer>
      <div className="flex flex-col items-center gap-8 pb-10 text-center">
        <span className="retro text-[64px] leading-none sm:text-[96px]">404</span>
        <MaskSprite slug="monster" color="#c9c9d6" size={96} label="A lost monster" />
        <p className="retro text-[12px] text-muted-foreground">This page doesn&apos;t exist.</p>
        <Button asChild className="mx-1.5 gap-2 px-6 text-[11px]">
          <Link href="/">
            <ArrowLeft width={14} height={14} />
            Go home
          </Link>
        </Button>
      </div>
    </SitePage>
  );
}
