"use client";

// uses CodeMirror instead of Shiki for code blocks so the colors match the editor
// inline code is colored with the same theme's highlight rules
// keep Streamdown's default pre tag so it sets data-block and separates block code from inlineCode
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Streamdown } from "streamdown";
import { javascriptLanguage } from "@codemirror/lang-javascript";
import { highlightCode, tagHighlighter, type Tag } from "@lezer/highlight";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { useEditorTheme } from "@/components/editor/themes";
import { cn } from "@/lib/utils";

type Rule = { tag: Tag | readonly Tag[]; color?: string; fontWeight?: string; fontStyle?: string };

// the theme's tag-to-color rules, with stable class names so server and client render the same spans
function highlightInline(text: string, rules: Rule[]): ReactNode[] {
  const highlighter = tagHighlighter(rules.map((rule, i) => ({ tag: rule.tag as Tag, class: `r${i}` })));
  const styleFor = (classes: string): CSSProperties => {
    const style: CSSProperties = {};
    for (const cls of classes.split(" ")) {
      const rule = rules[Number(cls.slice(1))];
      if (rule?.color) style.color = rule.color;
      if (rule?.fontWeight) style.fontWeight = rule.fontWeight;
      if (rule?.fontStyle) style.fontStyle = rule.fontStyle;
    }
    return style;
  };
  const parts: ReactNode[] = [];
  highlightCode(
    text,
    javascriptLanguage.parser.parse(text),
    highlighter,
    (t, cls) =>
      parts.push(
        cls ? (
          <span key={parts.length} style={styleFor(cls)}>
            {t}
          </span>
        ) : (
          <Fragment key={parts.length}>{t}</Fragment>
        ),
      ),
    () => parts.push("\n"),
  );
  return parts;
}

function InlineCode({ children }: { children?: ReactNode }) {
  const theme = useEditorTheme();
  const text = String(children ?? "");
  return (
    <code className="px-1 py-0.5 text-[0.92em]" style={{ background: theme.background, color: theme.foreground }}>
      {highlightInline(text, theme.styles as Rule[])}
    </code>
  );
}

function BlockCode({ children }: { children?: ReactNode }) {
  const text = String(children ?? "").replace(/\n$/, "");
  return <CodeEditor value={text} language="javascript" readOnly lineNumbers={false} className="my-1 border-2 border-border px-1.5" />;
}

const components = {
  inlineCode: InlineCode,
  code: BlockCode,
  h3: ({ children }: { children?: ReactNode }) => <h3 className="retro mt-2 text-[11px] leading-5 text-primary">{children}</h3>,
  p: ({ children }: { children?: ReactNode }) => <p className="leading-relaxed">{children}</p>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold text-foreground">{children}</strong>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
  table: ({ children }: { children?: ReactNode }) => <table className="w-fit border-2 border-border text-sm">{children}</table>,
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border-b-2 border-border bg-card px-4 py-1.5 text-left font-normal text-muted-foreground">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => <td className="px-4 py-1">{children}</td>,
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <Streamdown components={components} controls={false} className={cn("flex flex-col gap-3 text-[15px] [&>*]:m-0", className)}>
      {children}
    </Streamdown>
  );
}
