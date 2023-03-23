import torch
from transformers import T5ForConditionalGeneration, AutoTokenizer, PreTrainedTokenizer, PreTrainedTokenizerFast
import colorama
from colorama import Fore, Style
from prompts_loop import run_prompts_loop
from basaran.model import load_model, StreamModel
import bytes_to_human_readable

colorama.init()

device_map = {
  "": "cpu"
}

models = [
  {
    "name": "google/flan-ul2",
    "tokenizer": "auto",
    "model": "auto",
  }
]

def run_model(model_name: str) -> None:
  model_name_formatted = Style.BRIGHT + model_name + Style.NORMAL

  print(Style.NORMAL + Style.DIM + Fore.WHITE + "Loading " + model_name_formatted + " model..." + Style.NORMAL)
  model = T5ForConditionalGeneration.from_pretrained(model_name, device_map=device_map, torch_dtype=torch.float32)
  print(Style.NORMAL + Style.BRIGHT + Fore.GREEN + "OK")

  print(Style.NORMAL + Style.DIM +  Fore.WHITE + "Loading " + model_name_formatted + " tokenizer..." + Style.NORMAL)
  tokenizer: PreTrainedTokenizer | PreTrainedTokenizerFast = AutoTokenizer.from_pretrained(model_name, device_map=device_map, torch_dtype=torch.float32)
  print(Style.NORMAL + Style.BRIGHT + Fore.GREEN + "OK")

  print(Style.NORMAL + Fore.WHITE + "Memory footprint for " + model_name_formatted + ": " + bytes_to_human_readable.convert(model.model.get_memory_footprint()) + Style.NORMAL)

  input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples, 6 oranges and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

  print(Style.RESET_ALL)
  print(Fore.GREEN + "Model " + model_name_formatted + " loaded! Starting prompting loop...")
  print(Style.RESET_ALL)

  # load1, *rest = psutil.getloadavg()
  # cpu_usage = round((load1/os.cpu_count()) * 100, ndigits=1)
  # print('The CPU usage is: ', cpu_usage)

  print(Style.DIM + "Example prompt:")
  print(input_string)
  print(Style.RESET_ALL)

  run_prompts_loop(tokenizer, model, expected_max_response_length=200)

try:
  run_model("google/flan-ul2")
except KeyboardInterrupt:
  print("Interrupted. Closing down...")
