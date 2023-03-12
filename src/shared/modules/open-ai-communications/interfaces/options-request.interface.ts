import { GenerativeModels } from "../../../enums";
import { ImagePromptParams } from "./image-prompt-params.interface";

export interface OptionsRequest extends ImagePromptParams {
  sd_model_checkpoint: GenerativeModels,
}