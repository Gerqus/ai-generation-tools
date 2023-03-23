from diffusers import StableDiffusionPipeline
import torch

model_id = "XpucT/Deliberate"
pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float32)
pipe = pipe.to("cuda")

prompt = "a photo of an astronaut riding a horse on mars"
image = pipe(prompt=prompt, negative_prompt="", ).images[0]

image.save("astronaut_rides_horse.png")
