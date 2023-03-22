# import torch
# import torch.nn as nn

# import bitsandbytes as bnb
# from bitsandbytes.nn import Linear8bitLt
# from accelerate import init_empty_weights

# # any fp16 model, w moim przypadku po prostu zaimportowany checkpoint
# fp16_model = nn.Sequential(
#     nn.Linear(64, 64),
#     nn.Linear(64, 64),
# )

# # training process

# torch.save(fp16_model.state_dict(), "model.pt")

# int8_model = nn.Sequential(
#     Linear8bitLt(64, 64, has_fp16_weights=False),
#     Linear8bitLt(64, 64, has_fp16_weights=False)
# )
# int8_model.load_state_dict(torch.load("model.pt"))
# int8_model = int8_model.to(0) # Quantization (aka transformacja na 8-bit) happens here

# # to get fp16 values back:
# # (int8_model[0].weight.CB * int8_model[0].weight.SCB) / 127

# input_ = torch.randn(64, dtype=torch.float16)
# hidden_states = int8_model(input_.to(torch.device('cuda', 0)))

# with init_empty_weights():
#     model = nn.Sequential([nn.Linear(100000, 100000) for _ in range(1000)]) # This will take ~0 RAM!

# def replace_8bit_linear(model, threshold=6.0, module_to_not_convert="lm_head"):
#     for name, module in model.named_children():
#         if len(list(module.children())) > 0:
#             replace_8bit_linear(module, threshold, module_to_not_convert)

#         if isinstance(module, nn.Linear) and name != module_to_not_convert:
#             with init_empty_weights():
#                 model._modules[name] = bnb.nn.Linear8bitLt(
#                     module.in_features,
#                     module.out_features,
#                     module.bias is not None,
#                     has_fp16_weights=False,
#                     threshold=threshold,
#                 )
#     return model

from transformers import T5ForConditionalGeneration, AutoTokenizer
import torch

model = T5ForConditionalGeneration.from_pretrained("google/flan-ul2", device_map="auto", torch_dtype=torch.float32)                                                                 
tokenizer = AutoTokenizer.from_pretrained("google/flan-ul2", device_map="auto", torch_dtype=torch.float32)

input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

inputs = tokenizer(input_string, return_tensors="pt").input_ids.to("cpu")
outputs = model.generate(inputs, max_length=200)

print(tokenizer.decode(outputs[0]))
