import { UniversalConsoleParams } from "./universal-console-params.interface";

export interface ItemsForSettingsConsoleParams extends UniversalConsoleParams {
  itemsFilePath: string;
  settingsFilePath: string;
  outputFilePath: string;
  promptsGenerationCount: number;
  waitTime: number;
  processAll: boolean;
}