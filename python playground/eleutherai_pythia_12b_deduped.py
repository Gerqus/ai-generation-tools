from transformers import GPTNeoXForCausalLM, AutoTokenizer

from prompts_loop import run_prompts_loop

chatbot = GPTNeoXForCausalLM.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)

tokenizer = AutoTokenizer.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)

run_prompts_loop(tokenizer, chatbot)
