import json
from interfaces.enum_base import BaseEnum

class SupportedCommands(BaseEnum):
    identity = "identity"
    info = "info"
    run_model = "run_model"

class QuestionMessage:
    def __init__(self, command_name: SupportedCommands, command_args: dict | None):
        self.command_name = command_name
        self.command_args = command_args
    
    @classmethod
    def from_json(cls, message: str):
        parsed_message: QuestionMessage = cls.from_dict(json.loads(message))
        if (not parsed_message.command_name in SupportedCommands):
            raise ValueError("Message is not a valid JSON object")

        return QuestionMessage(parsed_message.command_name, parsed_message.command_args)
    
    @classmethod
    def from_dict(cls, message: dict):
        if (not message["command_name"] in SupportedCommands):
            raise ValueError("Message is not a valid JSON object")

        return QuestionMessage(message["command_name"], message["command_args"])
    
    def to_json(self):
        return json.dumps({
            "command_name": self.command_name.value if self.command_name else "",
            "command_args": self.command_args if self.command_args else ""
        })
    
    def __str__(self):
        return f"QuestionMessage(command_name={self.command_name}, command_args={self.command_args})"
