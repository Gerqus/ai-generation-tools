from transformers import GPTNeoXForCausalLM, AutoTokenizer, PreTrainedModel

from prompts_loop import run_prompts_loop

chatbot = GPTNeoXForCausalLM.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)
# check if model is instance of class PreTrainedModel
if (not isinstance(chatbot, PreTrainedModel)):
    raise TypeError("Model from pretrained is not a valid model")

tokenizer = AutoTokenizer.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)

# run_prompts_loop(tokenizer, chatbot)
