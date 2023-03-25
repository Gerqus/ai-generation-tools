from multiprocessing.connection import Connection
import readline
import time
from transformers import PreTrainedTokenizer, PreTrainedTokenizerFast, PreTrainedModel
from shared.actions_logger import Logger

log = Logger(source_service="prompts_loop.py", print_to_console=True).log

def run_prompts_loop(tokenizer: PreTrainedTokenizer | PreTrainedTokenizerFast, model: PreTrainedModel, output_pipe: Connection, text_appending_response = False, expected_max_response_length = 150, device="cpu"):
  if (not model.can_generate or not model.can_generate()):
    raise TypeError(f"{model._get_name} is not a text generation model")
  
  previous_user_input = ""
  last_ai_output = ""

  while True:

    user_input = ""
    log("Enter promopt. Ctrl-D or Ctrl-Z ( windows ) to run model on it")
    while True:
      try:
        line = input("")
      except EOFError:
        break

      striped_input = line.strip()
      if (not striped_input.isspace()):
        if (not len(user_input) == 0):
          user_input += "\n"
        user_input += striped_input

    if (user_input == "q"):
      log("Closing down...")
      break

    if (user_input == "" or user_input.isspace()):
      user_input = ""
      if (previous_user_input != ""):
        user_input = previous_user_input.strip() + " " + last_ai_output.strip()
      else:
        continue

    log("Query to model is: " + repr(user_input))
      
    previous_user_input = user_input

    start_time = time.time()

    tokenized_input = tokenizer(user_input, return_tensors="pt").input_ids.to(device)

    # generate response
    max_length = (len(tokenized_input.tokens) + expected_max_response_length) if text_appending_response else expected_max_response_length
    bot_response_tokens = model.generate(tokenized_input, max_length=max_length, num_beams=5, no_repeat_ngram_size=2, early_stopping=True)
    output = tokenizer.decode(bot_response_tokens[0], skip_special_tokens=True)
    
    end_time = time.time()
    
    log(f"Model response time: {end_time - start_time} seconds")
    log("Model response: " + repr(output[:20] + "..." if len(output) > 20 else output))
    output_pipe.send(repr(output))

    last_ai_output = output
