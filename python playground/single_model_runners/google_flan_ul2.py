from transformers import T5ForConditionalGeneration, AutoTokenizer, PreTrainedModel
import torch

model = T5ForConditionalGeneration.from_pretrained("google/flan-ul2", device_map="auto", torch_dtype=torch.float32)
# check if model is instance of class PreTrainedModel
if (not isinstance(model, PreTrainedModel)):
    raise TypeError("Model from pretrained is not a valid model")                                                                 
tokenizer = AutoTokenizer.from_pretrained("google/flan-ul2", device_map="auto", torch_dtype=torch.float32)

input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

inputs = tokenizer(input_string, return_tensors="pt").input_ids.to("cpu")
outputs = model.generate(inputs, max_length=200)

print(tokenizer.decode(outputs[0]))
