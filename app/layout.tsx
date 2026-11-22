import type { Metadata } from "next";
import { Geist_Mono, Press_Start_2P, Silkscreen } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Geist Mono for body and code; Press Start 2P for headings, buttons, and game UI
// globals.css maps --font-sans to --font-body because shadcn init writes a self-referencing --font-sans
const body = Geist_Mono({ variable: "--font-body", subsets: ["latin"] });
const retro = Press_Start_2P({ variable: "--font-retro", weight: "400", subsets: ["latin"] });
const display = Silkscreen({ variable: "--font-display", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Syntax & Sorcery",
  description: "An RPG that teaches you programming.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${body.variable} ${retro.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        {/*
          needed by 8bitcn toast()
          no next-themes provider here, so force dark and override --ring to gold
        */}
        <Toaster theme="dark" toastOptions={{ className: "[--ring:var(--primary)]" }} />
      </body>
    </html>
  );
}
