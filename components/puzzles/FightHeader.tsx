"use client";

// uses Radix dialog primitives around 8bitcn Buttons because 8bitcn's Action/Cancel take no variant
import { useState, type ReactNode } from "react";
import { Bug, Flag } from "pixelarticons/react";
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
import HealthBar from "@/components/ui/8bit/health-bar";
import { HpLabel } from "@/components/game/EnemyCard";
import { useShell } from "@/components/game/AdventureScreen";
import { EnemyAvatar } from "@/components/game/Sprite";
import { Skulls, Tip } from "@/components/game/bits";
import type { Enemy, PuzzleKind } from "@/lib/types";

const footerReset = "m-0 gap-6 border-0 bg-transparent p-0 pt-2";

function ConfirmDialog({
  trigger,
  title,
  description,
  confirm,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      {trigger}
      <AlertDialogContent font="normal" className="max-w-[480px]! gap-5 p-7">
        <AlertDialogHeader>
          <AlertDialogTitle className="retro text-[13px] leading-6 font-normal">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={footerReset}>
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="outline" className="px-5 text-[10px]">
              Cancel
            </Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button className="px-5 text-[10px]" onClick={onConfirm}>
              {confirm}
            </Button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FightHeader({
  enemy,
  difficulty,
  kind,
  hp,
  maxHp,
  disabled,
  onReport,
  onFlee,
}: {
  enemy: Enemy;
  difficulty: number;
  kind: PuzzleKind;
  hp: number;
  maxHp: number;
  disabled: boolean;
  onReport: () => Promise<void>;
  onFlee: () => void;
}) {
  const [reported, setReported] = useState(false);
  const { desktop } = useShell();
  return (
    <div className="flex gap-4 border-b-2 border-border px-4 pt-4 pb-4 sm:gap-5 sm:px-7 sm:pt-5 sm:pb-5">
      {desktop ? <EnemyAvatar enemy={enemy} /> : <EnemyAvatar enemy={enemy} size={32} box={44} />}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="retro text-[14px] leading-6 sm:text-[17px]">{enemy.name}</h2>
          <div className="flex items-center gap-1">
            <ConfirmDialog
              trigger={
                <Tip label="Report puzzle">
                  <AlertDialogPrimitive.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mt-1 px-2 text-muted-foreground"
                      aria-label="Report puzzle"
                      disabled={reported}
                    >
                      <Bug width={16} height={16} />
                    </Button>
                  </AlertDialogPrimitive.Trigger>
                </Tip>
              }
              title="Report this puzzle as broken?"
              description="We'll hide it from future fights until we check it."
              confirm="Report puzzle"
              onConfirm={() => {
                setReported(true);
                void onReport().catch(() => setReported(false));
              }}
            />
            <ConfirmDialog
              trigger={
                <AlertDialogPrimitive.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mt-1 -mr-2 gap-1.5 text-[10px] text-muted-foreground"
                    disabled={disabled}
                    aria-label="Flee"
                  >
                    <Flag width={14} height={14} />
                    <span className="hidden sm:inline">Flee</span>
                  </Button>
                </AlertDialogPrimitive.Trigger>
              }
              title={`Flee from ${enemy.name}?`}
              description="You get no XP for it. The enemy may come back later."
              confirm="Flee"
              onConfirm={onFlee}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Skulls value={difficulty} />
          <HealthBar value={maxHp > 0 ? (hp / maxHp) * 100 : 0} className="h-3 w-[120px] sm:w-[180px]" />
          <HpLabel hp={hp} max={maxHp} kind={kind} />
        </div>
      </div>
    </div>
  );
}
