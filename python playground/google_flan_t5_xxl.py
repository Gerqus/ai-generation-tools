from transformers import T5ForConditionalGeneration, AutoTokenizer

from prompts_loop import run_prompts_loop

device_map = {
  "": "cpu"
}

model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-xxl", device_map=device_map)                                                                 
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-xxl", device_map=device_map)

input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples, 6 oranges and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

# run_prompts_loop(tokenizer, model, expected_max_response_length=200)
