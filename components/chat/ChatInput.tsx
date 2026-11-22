"use client";

// 8bitcn draws the textarea frame with divs, so the wrapper dims the whole box when disabled
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Close, Send } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { Textarea } from "@/components/ui/8bit/textarea";
import { ItemSprite } from "@/components/game/Sprite";

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean; // true while busy, waiting for a choice, or in a fight
  scrollMode?: { onCancel: () => void }; // opens the box for a single Scroll question during a fight
  placeholder?: string;
}

const MAX = 500;

export function ChatInput({ onSend, disabled, scrollMode, placeholder = "Message the game master…" }: ChatInputProps) {
  const [text, setText] = useState("");

  function send(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-3 border-t-2 border-border bg-panel px-4 py-5 sm:px-7">
      {scrollMode && (
        <div className="flex w-fit items-center gap-2 border-2 border-primary bg-primary/10 py-1 pr-1 pl-2 text-sm">
          <ItemSprite slug="scroll-of-remembering" size={24} />
          <span>Scroll of Remembering</span>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" aria-label="Put the scroll away" onClick={scrollMode.onCancel}>
            <Close width={14} height={14} />
          </Button>
        </div>
      )}
      <div className="flex items-stretch gap-5">
        <div className="relative flex-1 has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <Textarea
            font="normal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            maxLength={MAX}
            placeholder={disabled ? undefined : scrollMode ? "Ask the game master one question…" : placeholder}
            aria-label={scrollMode ? "Your question for the game master" : "Message the game master"}
            rows={2}
            className="min-h-[72px] resize-none text-[15px] disabled:opacity-100"
          />
        </div>
        <Button type="submit" disabled={disabled} className="h-auto shrink-0 flex-col gap-2 px-5 text-[10px]">
          <Send width={20} height={20} />
          Send
        </Button>
      </div>
    </form>
  );
}
