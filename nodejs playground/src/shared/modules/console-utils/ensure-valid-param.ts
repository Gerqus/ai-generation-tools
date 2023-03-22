import { askQuestionInConsole } from "./console-prompt";

export async function ensureValidParam(variable: string, validator: (v: string) => boolean, msg: string): Promise<string> {
  let varCorrect = false;
  do {
    varCorrect = false;
    try {
      varCorrect = validator(variable);
    } catch {}
    if (!varCorrect) {
      console.log(msg);
      variable = await askQuestionInConsole();
    }
  } while(!varCorrect);
  return variable;
}