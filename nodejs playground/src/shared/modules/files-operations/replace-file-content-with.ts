import * as fs from 'node:fs';

export function replaceFileContentWith(fileDescriptor: number, newContent: string, encoding: BufferEncoding = 'utf8'): void {
  fs.writeFileSync(fileDescriptor, newContent, { encoding })
  // fs.ftruncateSync(fileDescriptor, 0);
  // const contentBuffer = Buffer.from(newContent);
  // fs.writeSync(fileDescriptor, contentBuffer, 0, contentBuffer.length, 0);
}