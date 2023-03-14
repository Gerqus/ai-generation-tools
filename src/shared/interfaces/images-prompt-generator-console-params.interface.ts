import { UniversalConsoleParams } from "./universal-console-params.interface";

export interface ImagesPromptGeneratorConsoleParams extends UniversalConsoleParams {
  promptSubject: string;
  promptDescription: string;
  promptsGenerationCount: number;
  imagesPath: string;
  positivePrompt: string;
  negativePrompt: string;
  _: (string | number)[];
  $0: string;
}