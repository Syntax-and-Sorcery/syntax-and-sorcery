export interface SplitLesson {
  before: string; // everything above the first js block
  code: string | null; //null if there is no js block
  after: string; // everything below it
}

export function splitLesson(lesson: string): SplitLesson {
  const match = /```js\r?\n([\s\S]*?)\r?\n```/.exec(lesson); //regex to extract the first js block

  if (!match) return { before: lesson, code: null, after: "" };

  return {
    before: lesson.slice(0, match.index),
    code: match[1],
    after: lesson.slice(match.index + match[0].length),
  };
}
