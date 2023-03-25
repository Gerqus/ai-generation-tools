import os
import sys

sys.path.insert(1, os.path.join(sys.path[0], '..')) 

import asyncio
import websockets
import websockets.client

from interfaces.question_message import SupportedCommands
from interfaces.answer_message import AnswerMessage
from shared.actions_logger import Logger
from shared.messager import Messager
from shared.server_access_config import *

log = Logger(source_service="ai-client.py", print_to_console=True).log

async def main():
    async with websockets.client.connect(f'ws://{HOST}:{PORT}') as websocket:
        while True:
            server_query = await Messager.expect_question_message(websocket)
            match server_query.command_name:
                case SupportedCommands.info.value:
                    if (not server_query.command_args is None):
                        log(f"Received query \"{server_query.command_args.get('msg')}\"")
                    else:
                        log(f"Received query \"{server_query}\"")
                    continue
                case SupportedCommands.identity.value:
                    user_input = input(server_query.command_args["desc"] + ": ") if server_query.command_args is not None else input("Please provide client descriptive ID or name: ")
                    answer = AnswerMessage.from_question_message(server_query, answer=user_input)
                    await Messager().send_answer_message(websocket, answer)

try:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main())
except KeyboardInterrupt:
    log("Keyboard interrupt received. Terminating...")

# Output:
# > Hello from server! Who are you?
# < {"command_name": "identity", "command_args": {"identity": "model_runner_client"}}
# > {"command_name": "run_model", "command_args": {"model_name": "test_model"}, "answer": "test_model_result"}
