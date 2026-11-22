import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ScrollBar } from "@/components/ui/8bit/scroll-area";
import { cn } from "@/lib/utils";

// 8bitcn scroll area for every scrolling box in the app, vertical by default
// Radix wraps the content in a display:table div, which breaks min-h-full and justify-end, so vertical panes make it a flex column
export function ScrollPane({
  className,
  horizontal = false,
  children,
}: {
  className?: string;
  horizontal?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", !horizontal && "min-h-0 flex-1", className)}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn("size-full", !horizontal && "[&>div]:flex! [&>div]:min-h-full [&>div]:flex-col")}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation={horizontal ? "horizontal" : "vertical"} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
