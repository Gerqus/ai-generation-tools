from transformers import T5ForConditionalGeneration, AutoTokenizer, BitsAndBytesConfig
import torch

quantization_config = BitsAndBytesConfig(llm_int8_enable_fp32_cpu_offload=True)
device_map = {
  "": "cpu",
}

model = T5ForConditionalGeneration.from_pretrained("google/flan-ul2", device_map=device_map, quantization_config=quantization_config, load_in_8bit=True)                                                                 
tokenizer = AutoTokenizer.from_pretrained("google/flan-ul2", device_map="auto")

input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

inputs = tokenizer(input_string, return_tensors="pt").input_ids.to("cuda")
outputs = model.generate(inputs, max_length=200)
s
print(tokenizer.decode(outputs[0]))
