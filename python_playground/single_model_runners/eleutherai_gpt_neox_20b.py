from transformers import GPTNeoXForCausalLM, AutoTokenizer, PreTrainedModel

chatbot = GPTNeoXForCausalLM.from_pretrained(
  "EleutherAI/gpt-neox-20b",
)
# check if model is instance of class PreTrainedModel
if (not isinstance(chatbot, PreTrainedModel)):
    raise TypeError("Model from pretrained is not a valid model")

tokenizer = AutoTokenizer.from_pretrained(
  "EleutherAI/gpt-neox-20b",
)


def run_chatbot():
    while True:
        # get user input
        user_input = input("You: ")
        tokenized_input = tokenizer(user_input, return_tensors="pt")

        # generate response
        bot_response_tokens = chatbot.generate(**tokenized_input, pad_token_id=tokenizer.eos_token_id)

        # print the response
        print("Bot:", tokenizer.decode(bot_response_tokens[0]))

if __name__ == "__main__":
    run_chatbot()
