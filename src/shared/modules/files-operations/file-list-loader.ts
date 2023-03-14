import * as fs from 'node:fs';

export function importListFromFile(filePath: string, options: { delimiter: string, encoding: BufferEncoding } = { delimiter: '\n', encoding: 'utf8' }): string[] {
  console.log('Importing list from file', filePath);
  let fileHandle: number;
  try {
    fileHandle = fs.openSync(filePath, 'r');
  } catch {
    throw new Error('Could not open file in ' + filePath);
  }

  const fileContents = fs.readFileSync(fileHandle).toString(options.encoding);
  fs.closeSync(fileHandle);
  const fileEntries = fileContents.split(options.delimiter);
  return fileEntries.map(e => e.toLowerCase().trim());
}

export function importJSONFromFile(filePathOrHandle: string | number, encoding: BufferEncoding = 'utf8'): Object {
  console.log('Importing JSON from file', filePathOrHandle);
  let fileHandle: number;
  try {
    fileHandle = typeof filePathOrHandle === 'string' ? fs.openSync(filePathOrHandle, 'r') : filePathOrHandle;
  } catch {
    throw new Error('Could not open file in ' + filePathOrHandle);
  }

  const fileContents = fs.readFileSync(fileHandle).toString(encoding).trim();
  typeof filePathOrHandle === 'string' ? fs.closeSync(fileHandle) : '';

  if (!fileContents.length) {
    return {};
  }
  return JSON.parse(fileContents);
}
