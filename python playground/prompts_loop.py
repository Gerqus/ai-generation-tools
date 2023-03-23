import readline
from transformers import PreTrainedTokenizer, PreTrainedTokenizerFast, PreTrainedModel

def run_prompts_loop(tokenizer: PreTrainedTokenizer | PreTrainedTokenizerFast, model: PreTrainedModel, text_appending_response = False, expected_max_response_length = 150, device="cpu"):
  if (not model.can_generate or not model.can_generate()):
    raise TypeError(f"{model._get_name} is not a text generation model")
  
  previous_user_input = ""
  last_ai_output = ""

  while True:

    user_input = ""
    print("Enter promopt. Ctrl-D or Ctrl-Z ( windows ) to run model on it")
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
      print("Closing down...")
      break

    if (user_input == "" or user_input.isspace()):
      user_input = ""
      if (previous_user_input != ""):
        user_input = previous_user_input.strip() + " " + last_ai_output.strip()
      else:
        continue

    print("Query to model is:", repr(user_input))
      
    previous_user_input = user_input

    tokenized_input = tokenizer(user_input, return_tensors="pt").input_ids.to(device)

    # generate response
    max_length = (len(tokenized_input.tokens) + expected_max_response_length) if text_appending_response else expected_max_response_length
    print("Result:")
    for choice in model(user_input, max_tokens=max_length, max_length=max_length):
      output = choice.get("text")
      print(output, end="")
      last_ai_output = output
    print("")

    # print the response
    # print("Result:\n", tokenizer.decode(bot_response_tokens[0]), end="\n\n")
    print("\t---\t---\t---", end="\n\n")
