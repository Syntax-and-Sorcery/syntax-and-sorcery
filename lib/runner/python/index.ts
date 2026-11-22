// stub strategy for the upcoming Python track
import type { LanguageStrategy } from "../types";

const notYet = (): never => {
  throw new Error("Python isn't supported yet");
};

export const pythonStrategy: LanguageStrategy = {
  language: "python",
  buildProgram: notYet,
  parseOutput: notYet,
};
