from diffusers import StableDiffusionPipeline
import torch

def dummy(images, **kwargs):
    return images, False

pipe = StableDiffusionPipeline.from_pretrained("XpucT/Deliberate", torch_dtype=torch.float32)
# check if model is instance of class PreTrainedModel
if (not isinstance(pipe, StableDiffusionPipeline)):
    raise TypeError("Model from pretrained is not a valid model")
pipe = pipe.to("cuda")
pipe.safety_checker = dummy # type: ignore

prompt = "extraordinary quality photo of Emma watson explicit nude tits with spread legs, in porn studio, professional light, high resolution, 8k, very detailed, sharp lens"
image = pipe(prompt=prompt, negative_prompt="blurred, pixelated, cartoon, doodle, censor, weird anatomy").images[0] # type: ignore

image.save("astronaut_rides_horse.png")
