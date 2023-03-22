from transformers import GPTNeoXForCausalLM, AutoTokenizer

chatbot = GPTNeoXForCausalLM.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)

tokenizer = AutoTokenizer.from_pretrained(
  "EleutherAI/pythia-12b-deduped",
  revision="step143000",
)


def run_chatbot():
    while True:
        # get user input
        user_input = input("You: ")
        tokenized_input = tokenizer(user_input, return_tensors="pt")

        # generate response
        bot_response_tokens = chatbot.generate(**tokenized_input, pad_token_id=tokenizer.eos_token_id, max_length=(len(tokenized_input.tokens) + 100))

        # print the response
        print("Bot 0:", tokenizer.decode(bot_response_tokens[0]))

if __name__ == "__main__":
    run_chatbot()
