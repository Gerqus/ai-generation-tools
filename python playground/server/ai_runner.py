import multiprocessing
from multiprocessing.connection import Connection
from typing import List, TypedDict
import torch
from transformers import T5ForConditionalGeneration, AutoTokenizer, PreTrainedTokenizer, PreTrainedTokenizerFast, PreTrainedModel
import colorama
from colorama import Fore, Style
from actions_logger import Logger
from prompts_loop import run_prompts_loop
import bytes_to_human_readable

class SupportedAIModelDefinition(TypedDict("SupportedAIModelDefinition", name=str, tokenizer=str, model=str)):
  name: str
  tokenizer: str
  model: str

supported_models: List[SupportedAIModelDefinition] = [
  {
    "name": "google/flan-ul2",
    "tokenizer": "auto",
    "model": "auto",
  }
]

log = Logger(source_service="ai_runner.py", print_to_console=True).log

colorama.init()

device_map = {
  "": "cpu"
}

def run_model(model_name: str, response_pipe: Connection) -> None:
    model_name_formatted = Style.BRIGHT + model_name + Style.NORMAL

    log(Style.NORMAL + Style.DIM + Fore.WHITE + "Loading " + model_name_formatted + " model..." + Style.NORMAL)
    model = T5ForConditionalGeneration.from_pretrained(model_name, device_map=device_map, torch_dtype=torch.float32)
    # checkl if model is instance of class PreTrainedModel
    if (not isinstance(model, PreTrainedModel)):
        raise TypeError(f"{model_name} is not a valid model")

    log(Style.NORMAL + Style.BRIGHT + Fore.GREEN + "OK")

    log(Style.NORMAL + Style.DIM +  Fore.WHITE + "Loading " + model_name_formatted + " tokenizer..." + Style.NORMAL)
    tokenizer: PreTrainedTokenizer | PreTrainedTokenizerFast = AutoTokenizer.from_pretrained(model_name, device_map=device_map, torch_dtype=torch.float32)
    log(Style.NORMAL + Style.BRIGHT + Fore.GREEN + "OK")

    log(Style.NORMAL + Fore.WHITE + "Memory footlog for " + model_name_formatted + ": " + bytes_to_human_readable.convert(model.get_memory_footprint()) + Style.NORMAL)

    input_string = "Answer the following question by reasoning step by step. The cafeteria had 23 apples, 6 oranges and 5 chairs. If they used 20 apples and 5 oranges for lunch and broke 1 chair, bought 2 chairs and 6 plums, how many fruits do they have?"

    log(Style.RESET_ALL)
    log(Fore.GREEN + "Model " + model_name_formatted + " loaded! Starting prompting loop...")
    log(Style.RESET_ALL)

    log(Style.DIM + "Example prompt:")
    log(input_string)
    log(Style.RESET_ALL)

    run_prompts_loop(tokenizer, model, output_pipe=response_pipe, expected_max_response_length=200)

if __name__ == "__main__":
    log("Choose model to run:")

    for i, model in enumerate(supported_models):
        log(f"{i}: {model['name']}")

    model_index = -1
    while (model_index < 0 or model_index >= len(supported_models)):
        model_index = int(input("Model index: "))
        if (model_index == -1 or model_index == "q"):
            log("Closing down...", override_print_to_console=True)
        exit(0)

    model_name = supported_models[model_index]["name"]

    try:
        read_pipe, write_pipe = multiprocessing.Pipe(False)
        run_model(model_name, write_pipe)
        log("Model exited. Result: " + read_pipe.recv())
    except KeyboardInterrupt:
        log("Interrupted. Closing down...")
