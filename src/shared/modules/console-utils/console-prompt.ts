import * as readline from "node:readline";

export async function askQuestionInConsole(question = '-> '): Promise<string> {
  return new Promise<string>(resolve => {
    const prompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    prompt.question(question, resp => {
      prompt.close();
      resolve(resp);
    });
  });
}
