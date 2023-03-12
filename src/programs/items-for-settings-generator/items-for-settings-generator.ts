import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as fs from 'node:fs';
import { ITEMS_WITH_SETTINGS_MATCHING_REG_EXP } from "../../shared/constants";
import { ProgramConstantsId } from "../../shared/enums/program-constants-id.enum";
import { ItemsForSettingsConsoleParams } from "../../shared/interfaces/items-for-settings-console-params.interface";
import { ensureValidParam } from "../../shared/modules/console-utils/ensure-valid-param";
import { checkPathIsAccessible } from "../../shared/modules/files-operations/ensure-file-exists";
import { importJSONFromFile, importListFromFile } from "../../shared/modules/files-operations/file-list-loader";
import { ChatQueriesSender } from "../../shared/modules/open-ai-communications/prompt-to-chat.service";
import { chunk, isArray, isEmpty, mergeWith, uniq } from 'lodash';

const operationsParams: ItemsForSettingsConsoleParams = yargs(hideBin(process.argv)).options({
  itemsFilePath: { alias: 'i', type: 'string', default: '', require: false, description: 'Path to items list file' },
  settingsFilePath: { alias: 's', type: 'string', default: '', require: false, description: 'Path to settings list file' },
  outputFilePath: { alias: 'o', type: 'string', default: '', require: false, description: 'Path to output file' },
  promptsGenerationCount: { alias: 'c', type: 'number', default: 5, require: false, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], number: true, description: 'Count of items and settings taken into prompt in one batch. Will generate count^2 prompts.' },
  waitTime: { alias: 'w', type: 'number', default: 30, require: false, number: true, description: 'Wait time between prompts to ChatGPT' },
  processAll: { alias: 'a', type: 'boolean', default: false, require: false, description: 'Should process all entries from files under paths? Will do so in batches untill entries exhausted. Otherwise will perform work for 1 batch.'}
}).parseSync() as any;

async function ensureOperationParamsCorrect(): Promise<void> {
  operationsParams.itemsFilePath = await ensureValidParam(
    operationsParams.itemsFilePath,
    checkPathIsAccessible,
    'Please provide correct path to file with item categories',
  );
  operationsParams.settingsFilePath = await ensureValidParam(
    operationsParams.settingsFilePath,
    checkPathIsAccessible,
    'Please provide correct path to file with RPG settings',
  );
  operationsParams.outputFilePath = await ensureValidParam(
    operationsParams.outputFilePath,
    checkPathIsAccessible,
    'Please provide correct path to output file',
  );
  operationsParams.promptsGenerationCount = +(await ensureValidParam(
    operationsParams.promptsGenerationCount.toString(),
    (v) => +v === Number(v) && +v > 0 && +v <= 10,
    'Please provide correct batch size [1-10]',
  ));
  operationsParams.processAll = Boolean(operationsParams.processAll);
}

function arraysMerger(objValue: {}, srcValue: {}) {
  if (isArray(objValue)) {
    const concated = objValue.concat(srcValue);
    return uniq(concated);
  }
}

function mergeNewContentIntoOutputFile(textToMerge: string | Object): void {
  if (textToMerge === '' || !Object.keys(textToMerge).length) {
    // nothing new to be merged
    return;
  }
  const outputFileHandle = fs.openSync(operationsParams.outputFilePath, 'r+');
  const currentOutputContent = importJSONFromFile(outputFileHandle);
  let mergedOutput = null;
  let mergingFailed = false;

  try {
    mergedOutput = typeof textToMerge === 'string' ? JSON.parse(textToMerge) : textToMerge;
  } catch {
    console.log('Could not parse new content as correct JSON... Will append it at the end of file as a text.');
    mergingFailed = true;
  }
  if (mergedOutput) {
    try {
      mergedOutput = mergeWith(currentOutputContent, mergedOutput, arraysMerger);
    } catch {
      console.log('Could not merge new content into old output... Will append it at the end of file as a text.');
      mergingFailed = true;
    }
  }

  let newFileContent = '';
  if (mergingFailed) {
    newFileContent = JSON.stringify(currentOutputContent) + `\n\n<<< FAILED JSON MERGE. APPENDING TEXT: \n\n` + textToMerge;
  } else {
    newFileContent = JSON.stringify(mergedOutput);
  }

  replaceFileContentWith(outputFileHandle, newFileContent);
  fs.closeSync(outputFileHandle);
}

function replaceFileContentWith(fileDescriptor: number, newContent: string): void {
  fs.ftruncateSync(fileDescriptor, 0);
  const contentBuffer = Buffer.from(newContent);
  fs.writeSync(fileDescriptor, contentBuffer, 0, contentBuffer.length, 0);
}

function handleSingleTempFilePrep(pathToTmpFile: string, tmpFileOpenMode: string): number {
  let tmpFileHandle: number;
  if (fs.existsSync(pathToTmpFile)) {
    console.log('Reusing exisitng TEMP file under', pathToTmpFile);
    try {
      tmpFileHandle = fs.openSync(pathToTmpFile, tmpFileOpenMode);
      try {
        const tmp1FileContent = importJSONFromFile(pathToTmpFile);
        if (!isEmpty(tmp1FileContent)) {
          mergeNewContentIntoOutputFile(tmp1FileContent);
          console.log('Residue in ' + pathToTmpFile + ' detected. Successfully merged it into output.');
        } else {
          console.log(pathToTmpFile + ' empty. Moving on...');
        }
      } catch (e) {
        console.error('Could not merge tmp into output file:', e);
        process.exit();
      }
    } catch {
      console.error('Cannot check if ' + pathToTmpFile + ' is empty. Terminating to prevent data loss.');
      process.exit();
    }
  } else {
    console.log('TEMP file does not exist. Creating new TEMP file under', pathToTmpFile);
    tmpFileHandle = fs.openSync(pathToTmpFile, 'w+');
  }

  return tmpFileHandle;
}

function openTmpFiles(): number[] {
  const tmp1FilePath = './tmp/tmp_output1.txt';
  const tmp2FilePath = './tmp/tmp_output2.txt';
  const tmpFilesOpenMode = 'r+';

  checkPathIsAccessible(tmp1FilePath, true);

  const tmpOutputFileHandle1 = handleSingleTempFilePrep(tmp1FilePath, tmpFilesOpenMode);
  const tmpOutputFileHandle2 = handleSingleTempFilePrep(tmp2FilePath, tmpFilesOpenMode);

  console.log(`TEMP files ${tmp1FilePath} and ${tmp2FilePath} 'empty or merge' check: OK`);

  fs.writeFileSync(tmpOutputFileHandle1, 'test');
  fs.writeFileSync(tmpOutputFileHandle2, 'test');

  console.log(`TEMP files write: OK`);

  replaceFileContentWith(tmpOutputFileHandle1, '');
  if (fs.readFileSync(tmpOutputFileHandle1).length > 0) {
    console.error('truncation failed');
    process.exit();
  }
  
  replaceFileContentWith(tmpOutputFileHandle2, '');
  if (fs.readFileSync(tmpOutputFileHandle2).length > 0) {
    console.error('truncation failed');
    process.exit();
  }

  console.log(`TEMP files trunkation: OK`);

  return [
    tmpOutputFileHandle1,
    tmpOutputFileHandle2,
  ]
}

ensureOperationParamsCorrect()
  .then(async () => {
    console.log('Operation params confirmed:');
    console.log('itemsFilePath', operationsParams.itemsFilePath);
    console.log('settingsFilePath', operationsParams.settingsFilePath);
    console.log('outputFilePath', operationsParams.outputFilePath);
    console.log('promptsGenerationCount', operationsParams.promptsGenerationCount);
    console.log('waitTime', operationsParams.waitTime);
    console.log('processAll', operationsParams.processAll);

    const itemsLists = chunk(importListFromFile(operationsParams.itemsFilePath).reverse(), operationsParams.promptsGenerationCount);
    const settingsLists = importListFromFile(operationsParams.settingsFilePath).reverse();
    const constructedResponse: Record<string, Record<string, string[]>> = {};

    const [
      tmpOutputFileHandle1,
      tmpOutputFileHandle2,
    ] = openTmpFiles();

    const totalIterationsExpected = itemsLists.length * settingsLists.length;
    let iterationsDoneCounter = 0;

    for (const settingName of settingsLists) {
      const preparedSettingsChunk = settingName.toLowerCase().trim().replace(/[*_\.;,]/g, '');
      const settingsByComma = `"${preparedSettingsChunk}"`;

      for (let i = 0; i < itemsLists.length; ) {
        const itemsChunk = itemsLists[i];
        const preparedItemsChunk = itemsChunk.map(itemName => itemName.toLowerCase().trim().replace(/[*_]/g, ''));
        const itemsByComma: string = preparedItemsChunk.map((item: string) => `"${item}"`).join(', ');

        const openAichatService = new ChatQueriesSender(ProgramConstantsId.ITEMS_FOR_SETTINGS);
        console.log('--- --- ---');
        console.log('Sending batch query #' + (++iterationsDoneCounter) + ' / ' + totalIterationsExpected + `(${(iterationsDoneCounter / totalIterationsExpected).toFixed(1)}%)`);
        console.log('Batch payload:');
        console.log('\titemsByComma', preparedItemsChunk);
        console.log('\tsettingsByComma', preparedSettingsChunk);
        
        let generatedResponse: string;
        try {
          generatedResponse = (await openAichatService.sendQuery({ itemsByComma, settingsByComma })).content;
        } catch {
          console.error('Could not perform request. Retrying in ' + operationsParams.waitTime + 's.');
          await (new Promise(resolve => {setTimeout(resolve, operationsParams.waitTime * 1000)}));
          continue;
        }

        console.log('~');
        console.log('Response received: ' + `\n\t` + generatedResponse.slice(0, 150).split(`\n`).filter(Boolean).join(`\n\t`) + '...');
        console.log('~');

        if (!generatedResponse.length) {
          console.error('Empty response. Retrying in ' + operationsParams.waitTime + 's.');
          await (new Promise(resolve => {setTimeout(resolve, operationsParams.waitTime * 1000)}));
          continue;
        }

        const responseLines = generatedResponse.split(`\n`).flatMap(i => [...(i.matchAll(ITEMS_WITH_SETTINGS_MATCHING_REG_EXP))])

        if (responseLines.length < 2) {
          console.error('Empty or wrong response (less than 2 lines). Retrying in ' + operationsParams.waitTime + 's.');
          await (new Promise(resolve => {setTimeout(resolve, operationsParams.waitTime * 1000)}));
          continue;
        }

        let currentSetting = '';
        for (const lineMatches of responseLines) {
          const lineTopic = lineMatches[1].toLowerCase().replace(/\([^)]*\)/g, "").trim()

          if (!lineTopic) {
            continue
          }

          if (preparedSettingsChunk.toLowerCase().replace(/[\.\,\-\ \!\?]/, '').includes(lineTopic.toLowerCase().replace(/[\.\,\-\ \!\?]/, ''))) {
            currentSetting = lineTopic;
            console.log('-', lineTopic);
            continue;
          }
          if (!lineMatches[2] || !currentSetting) {
            continue;
          }
          const truncatedLine = lineMatches[2].endsWith('.') ? lineMatches[2].slice(0, -1) : lineMatches[2];
          if (!truncatedLine) {
            continue;
          }
          const isSentence = truncatedLine.includes('.');
          const objectsFromResponse = isSentence ? [truncatedLine] : truncatedLine.split(/[,;] ?/g) ?? [];

          console.log(lineTopic + ':', objectsFromResponse);

          if (!constructedResponse[currentSetting]) {
            constructedResponse[currentSetting] = {}; 
          }
          if (!constructedResponse[currentSetting][lineTopic]) {
            constructedResponse[currentSetting][lineTopic] = []; 
          }

          constructedResponse[currentSetting][lineTopic].push(...objectsFromResponse);
        }

        if (!currentSetting.length) {
          console.error('Empty or wrong response (cannot find setting topic line). Retrying in ' + operationsParams.waitTime + 's.');
          await (new Promise(resolve => {setTimeout(resolve, operationsParams.waitTime * 1000)}));
          continue;
        }

        console.log('Response parsed. Writing to TMP files...');

        const tmpPayload = JSON.stringify(constructedResponse).trim();

        try {
          replaceFileContentWith(tmpOutputFileHandle1, tmpPayload);
        } catch {
          console.error('Error writing TEMP 1 file. Terminating to prevent data corruption');
          process.exit();
        }
        
        try {
          replaceFileContentWith(tmpOutputFileHandle2, tmpPayload);
        } catch {
          console.error('Error writing TEMP 2 file. Terminating to prevent data corruption');
          process.exit();
        }
        
        ++i;
        console.log('TMP files written. Sleeping for ' + operationsParams.waitTime + 's...');
        await (new Promise(resolve => {setTimeout(resolve, operationsParams.waitTime * 1000)}));
      }
    }
    console.log('ChatGPT querying completed successfuly. Writing result to output file...');

    mergeNewContentIntoOutputFile(constructedResponse);

    console.log('Cleaning up TMP files...');

    fs.closeSync(tmpOutputFileHandle1);
    fs.closeSync(tmpOutputFileHandle2);

    console.log('Job done! Phew...!');
  });
