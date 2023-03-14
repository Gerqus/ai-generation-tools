import { ImagePromptParams } from "./image-prompt-params.interface";
import { ImageResponseInfo } from "./image-response-info.interface";

export interface ImageResponse {
  images: string[] //base63 encoded .png,
  params: ImagePromptParams,
  info: ImageResponseInfo,
}