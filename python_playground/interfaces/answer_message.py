import json
from interfaces.question_message import QuestionMessage, SupportedCommands

class AnswerMessage(QuestionMessage):
    def __init__(self, command_name: SupportedCommands, command_args: dict | None, answer: str | None = None):
        super().__init__(command_name, command_args)
        self.add_answer(answer)

    @classmethod
    def from_question_message(cls, client_message: QuestionMessage, answer: str | None = None):
        return AnswerMessage(client_message.command_name, client_message.command_args, answer)
    
    @classmethod
    def from_json(cls, message: str):
        parsed_message: AnswerMessage = cls.from_dict(json.loads(message))
        if (not parsed_message.command_name in SupportedCommands):
            raise ValueError("Message is not a valid JSON object")

        return AnswerMessage(parsed_message.command_name, parsed_message.command_args, parsed_message.answer)
    
    @classmethod
    def from_dict(cls, message: dict):
        return AnswerMessage(message["command_name"], message["command_args"], message["answer"])
    
    def to_json(self):
        return json.dumps({
            "command_name": self.command_name if self.command_name else "",
            "command_args": self.command_args if self.command_args else "",
            "answer": self.answer if self.answer else ""
        })
    
    def add_answer(self, answer: str | None):
        self.answer = answer

    def __str__(self):
        return f"AnswerMessage(command_name={self.command_name}, command_args={self.command_args}, answer={self.answer})"
