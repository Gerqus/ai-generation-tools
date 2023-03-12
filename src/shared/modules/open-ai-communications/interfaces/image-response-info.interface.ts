import { GenerativeModels } from "../../../enums/generative-models.enum";

export interface ImageResponseInfo {
  prompt: string,
  all_prompts: string[],
  negative_prompt: string,
  all_negative_prompts: string[],
  seed: number,
  all_seeds: number[],
  subseed: number,
  all_subseeds: number[],
  subseed_strength: number,
  width: number,
  height: number,
  sampler_name: 'Euler a' | 'Euler' | 'LMS' | 'Heun' | 'DPM2' | 'DPM2 a' | 'DPM++ 2S a' | 'DPM++ 2M' | 'DPM++ SDE' | 'DPM fast' | 'DPM adaptive' | 'LMS Karras' | 'DPM2 Karras' | 'DPM2 a Karras' | 'DPM++ 2S a Karras' | 'DPM++ 2M Karras' | 'DPM++ SDE Karras' | 'DDIM' | 'PLMS',
  cfg_scale: number,
  steps: number,
  batch_size: number,
  restore_faces: boolean,
  face_restoration_model: null,
  sd_model_hash: GenerativeModels,
  seed_resize_from_w: number,
  seed_resize_from_h: number,
  denoising_strength: number,
  extra_generation_params: {},
  index_of_first_image: number,
  infotexts: string[],
  styles: [],
  job_timestamp: string,
  clip_skip: number,
  is_using_inpainting_conditioning: boolean,
}
