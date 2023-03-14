import * as fs from "node:fs";

export function checkPathIsAccessible(providedPath: string, createMissingFolders = false): true | never {
  const pathParts = providedPath.replace(/[(\\\\)(\/\/)]/g, '/').replace(/\\/g, '/').split('/');
  if (!providedPath || !pathParts?.length) {
    throw new Error('Path existence checker: provided path is empty.');
  }
  if (pathParts.some(part => part.includes('\\') || part.includes('//'))) {
    console.error('Cannot parse path to folder at part:', providedPath);
    process.exit();
  }

  const endsWithFile: boolean = pathParts[pathParts.length - 1].includes('.');
  const reconstructedPath: string[] = [];
  let fileOperationMode = false;

  for (const pathPart of pathParts) {
    reconstructedPath.push(pathPart);
    const currPath = reconstructedPath.join('/');
    fileOperationMode = endsWithFile && pathPart === pathParts[pathParts.length - 1];
    console.log('Checking path:', currPath + '...');
    try {
      if (fileOperationMode) {
        fs.accessSync(currPath, fs.constants.R_OK);
      } else {
        fs.opendirSync(currPath).closeSync();
      }
    } catch {
      try {
        if (createMissingFolders && !fileOperationMode) {
          fs.mkdirSync(currPath);
          fs.opendirSync(currPath).closeSync();
        } else {
          throw new Error();
        }
      } catch (e) {
        if (createMissingFolders) {
          console.error('Provided path does not exist and cannot be created:', providedPath, e);
        } else {
          console.error('Provided path does not exist or cannot be accessed:', providedPath, e);
        }
        console.error('Failed at sub-path:', currPath);
        process.exit();
      }
    }
  }
  console.log('OK');

  return true;
}