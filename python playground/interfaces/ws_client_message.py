from enum import Enum
import json

class SupportedCommands(Enum):
    identity = "identity"
    run_model = "run_model"

class ClientMessage:
    # can be one of the following: identity, run_model
    command_name: SupportedCommands
    command_args: dict
    
    def __init__(self, command_name: SupportedCommands, command_args: dict):
        self.command_name = command_name
        self.command_args = command_args
    
    @classmethod
    def from_json(cls, message: str):
        parsed_message: ClientMessage = json.loads(message)
        if (not parsed_message.command_name in SupportedCommands):
            raise ValueError("Message is not a valid JSON object")

        return ClientMessage(parsed_message.command_name, parsed_message.command_args)
    
    def to_json(self):
        return json.dumps({
            "command_name": self.command_name.value,
            "command_args": self.command_args
        })
