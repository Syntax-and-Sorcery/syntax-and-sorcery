import type { Concept } from "@/lib/types";
import { Markdown } from "@/components/chat/Markdown";
import { ScrollPane } from "@/components/game/ScrollPane";
import { splitLesson } from "./splitLesson";
import { RunnableExample } from "./RunnableExample";

export function LessonView({ concept }: { concept: Concept }) {
  const { before, code, after } = splitLesson(concept.lesson);
  return (
    <ScrollPane>
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-7">
        <Markdown>{before}</Markdown>
        {code !== null && <RunnableExample initialCode={code} />}
        <Markdown>{after}</Markdown>
      </div>
    </ScrollPane>
  );
}
