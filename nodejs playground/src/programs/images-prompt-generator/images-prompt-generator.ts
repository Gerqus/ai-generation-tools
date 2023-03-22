import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openAi";
import * as fs from "node:fs";
import * as http from "node:http";
import { ImagePromptParams, ImageResponse, ImageResponseInfo } from "../../shared/modules/open-ai-communications/interfaces";
import { ImagesPromptGeneratorConsoleParams } from "../../shared/interfaces/images-prompt-generator-console-params.interface";
import { PROMPTS_MATCHING_REG_EXP } from "../../shared/constants";
import { UpdatedCreateChatCompletionResponse } from "../../shared/modules/open-ai-communications/interfaces/updated-create-chat-completion-response.interface";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { checkPathIsAccessible } from "../../shared/modules/files-operations/ensure-file-exists";
import { askQuestionInConsole } from "../../shared/modules/console-utils/console-prompt";
import { ChatQueriesSender } from "../../shared/modules/open-ai-communications/prompt-to-chat.service";
import { ProgramConstantsId } from "../../shared/enums/program-constants-id.enum";
import { logTerminalArguments } from "../../shared/modules/logger/log-terminal-arguments";

/*
 * TODO:
 * - split file
 * - add presets of styles to positive and negative prompts, like realistic and detailed photo, intricate drawing, sticker, 3d render, isometric and so on. This app will append styles prompts to whatever GPT came up with
 * - create many images + add interrogation and quality classification checks to filter out bad results
 * - sanitize imputs from console on save to local vars
 * - generate prompt over all models to select best image
 * - możliwość wysyłania promptów po różne dane - prompty, listy
 */

const operationsParams: ImagesPromptGeneratorConsoleParams = yargs(hideBin(process.argv)).options({
  promptSubject: { alias: 's', type: 'string', default: '', description: 'Subject of your generation. Should Be short and precise' },
  promptDescription: { alias: 'd', type: 'string', default: '', description: 'Additional attibutes of your image and instructions for AI on what prompt to generate' },
  promptsGenerationCount: { alias: 'c', type: 'number', default: 5, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], number: true, description: 'Number of generated prompts (and thus - images)' },
  imagesPath: { alias: 'i', type: 'string', default: './images/', description: 'Path for saving generated images.' },
  waitTime: { alias: 'w', type: 'number', default: 30, require: false, number: true, description: 'Wait time between prompts to ChatGPT' },
  positivePrompt: {alias: 'p', type: 'string', default: '', description: 'Positive prompt to use directly instead of generating through GPT. Must be provided together with negatie prompt.'},
  negativePrompt: {alias: 'n', type: 'string', default: '', description: 'Negative prompt to use directly instead of generating through GPT. Must be provided together with positive prompt.'},
}).parseSync() as any;

checkPathIsAccessible(operationsParams.imagesPath, true);

function getImageFileSavePath(info: ImageResponseInfo): string {
  const modelNameMatch = info.infotexts[0].match(/, Model: (.+?), Seed/);
  const modelName = modelNameMatch ? modelNameMatch[1] : '---';
  return info.prompt.substring(0, 50).replace(/ /g, '_').replace(/,/g, '') + '__net_' + modelName + '__seed_' + info.seed + '__date_' + ((new Date()).toLocaleDateString().replace(/\./g, '_')) + '_T' + ((new Date()).toLocaleTimeString().replace(/:/g, '_'))
}

async function generateFromChatPrompts(match: RegExpMatchArray): Promise<ImageResponse> {
  const payloadData: Partial<ImagePromptParams> = {
    prompt: match.groups.positive,
    negative_prompt: match.groups.negative,
    width: 768,
    height: 768,
    batch_size: 1,
    cfg_scale: 7,
    steps: 30,
  };

  const payload = JSON.stringify(payloadData);

  let dataBuffer: Buffer = Buffer.alloc(0, 0);

  return new Promise((resolve, reject) => {
    const conn = http.request('http://127.0.0.1:7860/sdapi/v1/txt2img', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
      },
    }, (res) => {
      res.setEncoding('utf-8');
      res.on('data', (data: string) => {
        const tmp = Buffer.concat([dataBuffer, Buffer.from(data)]);
        dataBuffer = tmp;
      });
      res.on('close', () => {
        const parsedResponse = JSON.parse(dataBuffer.toString());
        parsedResponse.info = JSON.parse(parsedResponse.info);
        resolve(parsedResponse);
      });
      res.on('error', (rsp) => reject(rsp));
    });

    conn.write(payload);
    conn.end();
  });
}

async function ensurePromptSubject(): Promise<void> {
  while (operationsParams.promptSubject.endsWith('.')) {
    operationsParams.promptSubject = operationsParams.promptSubject.slice(0, -1);
  }

  if (operationsParams.promptSubject) {
    return;
  }

  const promptSubjects = getUsedPromptSubjects();

  if (!operationsParams.promptSubject) {
    console.log('Prompt subject not defined.');

    do {
      printAvailableSubjects(promptSubjects);
      console.log('Please provide prompt subject.');
      console.log('Enter empty value to list already used subjects.');
      console.log('Enter number of one of available subjects (or repeat subjcet literally) to choose it and make more images for it.');
      console.log('Enter short text to use it as prompt subject.');
      const input = await askQuestionInConsole();
      if (input) {
        operationsParams.promptSubject = input;
      }

      if (+operationsParams.promptSubject === parseInt(operationsParams.promptSubject)) {
        if (+operationsParams.promptSubject >= 0) {
          operationsParams.promptSubject = promptSubjects[+operationsParams.promptSubject];
        } else {
          operationsParams.promptSubject = '';
        }
      }

      while (operationsParams.promptSubject.endsWith('.')) {
        operationsParams.promptSubject = operationsParams.promptSubject.slice(0, -1);
      }

    } while (!operationsParams.promptSubject);
  }

  const confirmation = await askQuestionInConsole(`Do you want to set prompt subject to: "${operationsParams.promptSubject}"? (Y/n)`);
  if (['Y', 'y', ''].includes(confirmation)) {
    console.log('Prompt subject set to:', operationsParams.promptSubject, `\n`);
  } else {
    operationsParams.promptSubject = '';
    await ensurePromptSubject();
  }
}

async function askForDescription(): Promise<void> {
  while (operationsParams.promptDescription?.endsWith('.')) {
    operationsParams.promptDescription = operationsParams.promptDescription.slice(0, -1);
  }

  if (operationsParams.promptDescription) {
    return;
  }

  console.log('Additional prompt description and instructions not defined.');
  console.log('If you\'d like to add a secondary description or instructions, please do so now. To skip, enter empty value.')
  const input = await askQuestionInConsole();
  operationsParams.promptDescription = input;

  while (operationsParams.promptDescription?.endsWith('.')) {
    operationsParams.promptDescription = operationsParams.promptDescription.slice(0, -1);
  }

  if (!operationsParams.promptDescription) {
    console.log('Do you want to continue without secondary description and only basic instructions?');
    const confirmation = await askQuestionInConsole(`(y/N) `);
    if (['N', 'n', ''].includes(confirmation)) {
      await askForDescription();
    }
  }

  console.log(`Do you want to set secondary description to: "${operationsParams.promptDescription}"?`);
  const confirmation = await askQuestionInConsole(`(Y/n) `);
  if (['Y', 'y', ''].includes(confirmation)) {
    console.log('Prompt secondary description set to:', operationsParams.promptDescription, `\n`);
  } else {
    operationsParams.promptDescription = '';
    await askForDescription();
  }
}

function printAvailableSubjects(promptSubjects: string[]) {
  console.log('Available subjects:');
  let output = '';
  for (let i = 0; i < promptSubjects.length; ++i) {
    output += (`(${i})`.padEnd(6, ' ') + promptSubjects[i] + `\t`);
    if (i % 5 === 5) {
      output += `\n`;
    }
  }
  console.log(output);
}

function checkForPromptsFromParams(): boolean {
  return !!operationsParams.positivePrompt && !!operationsParams.negativePrompt;
}

function createResponseFromParams(): Promise<ChatCompletionRequestMessage> {
  return Promise.resolve({
    role: null,
    content: `--positive-prompt ${operationsParams.positivePrompt} --negative-prompt ${operationsParams.negativePrompt}`,
  });
}

function getUsedPromptSubjects(): string[] {
  const foldersNames = fs.readdirSync(operationsParams.imagesPath);
  return foldersNames.map(name => name.replace(/_/g, ' '));
}

(checkForPromptsFromParams() ? createResponseFromParams() : (ensurePromptSubject()
  .then(() => askForDescription())
  .then(() => {
    logTerminalArguments(operationsParams);

    const openAichatService = new ChatQueriesSender(ProgramConstantsId.IMAGES_PROMPTS);
    return openAichatService.sendQuery(operationsParams);
  })))
  .then(async (resp) => {
    console.log('Response:');
    const promptsText = resp.content + `\n`;
    console.log('---');
    console.log(promptsText);
    console.log('---');
    console.log('Processing response...');
    const promptsMaches = promptsText.matchAll(PROMPTS_MATCHING_REG_EXP);
    let i = 0;
    for (const match of promptsMaches) {
      ++i;
      console.log('Checking prompt #' + i + '...');
      if (!match.groups?.positive || !match.groups?.negative) {
        console.error('Could not extract some of prompts from generated text!');
        console.log('Positive prompt:', match.groups?.positive || '-');
        console.log('Negative prompt:', match.groups?.negative || '-');
        console.log('Debug ---\nPrompts text:', promptsText);
        continue;
      }
      console.log('Prompt #' + i + ' OK');
      console.log('PP: "' + match.groups?.positive.slice(0, 10) + '..." NP:"' + match.groups?.negative.slice(0, 10) + '"');
      console.log('Generating from prompt #' + i + '...');
      console.log('---');
      await generateFromChatPrompts(match)
        .then(({ images, info }) => {
          const dirPath = operationsParams.imagesPath + operationsParams.promptSubject.replace(/ /g, '_').replace(/,\./g, '').toLowerCase();
          try {
            fs.opendirSync(dirPath).close();
          } catch {
            fs.mkdirSync(dirPath);
          }
          fs.writeFileSync(dirPath + '/' + getImageFileSavePath(info) + '.png', images[0], 'base64');
        });
    }
  });

