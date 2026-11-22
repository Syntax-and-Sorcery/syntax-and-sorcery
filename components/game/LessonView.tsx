// TODO(T-20): lesson tab with runnable first JS example
import type { Concept } from "@/lib/types";
import { Markdown } from "@/components/chat/Markdown";
import { ScrollPane } from "@/components/game/ScrollPane";
import { splitLesson } from "./splitLesson";

export function LessonView({ concept }: { concept: Concept }) {
  const { before, code, after } = splitLesson(concept.lesson);
  return (
    <ScrollPane>
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-7">
        <Markdown>{before}</Markdown>
        {/* the runnable example goes here in the next step */}
        {code !== null && <Markdown>{"```js\n" + code + "\n```"}</Markdown>}
        <Markdown>{after}</Markdown>
      </div>
    </ScrollPane>
  );
}
