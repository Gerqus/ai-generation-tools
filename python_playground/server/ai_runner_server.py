from multiprocessing.managers import DictProxy
import os
import sys
from typing import Literal

sys.path.insert(1, os.path.join(sys.path[0], ".."))

import traceback
import asyncio
import multiprocessing
from interfaces.answer_message import AnswerMessage
from interfaces.question_message import QuestionMessage, SupportedCommands
from shared.messager import Messager
import websockets
import websockets.server
import websockets.exceptions
from websockets.server import WebSocketServerProtocol

from shared.actions_logger import Logger
from ai_runner import run_model
from shared.server_access_config import *

log = Logger(source_service="ai-runner-server.py", print_to_console=True).log


class Server:
    def __init__(self, hostname, port):
        self.hostname = hostname
        self.port = port

    def start(self):
        log(f"Starting server on {self.hostname}:{self.port}")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        start_server = websockets.server.serve(
            self.connection_handler, self.hostname, self.port
        )
        loop.run_until_complete(start_server)
        loop.run_forever()

    async def connection_handler(self, connection: WebSocketServerProtocol):
        log("Connection established!")
        while True:
            try:
                await Messager.send_question_message(
                    connection,
                    QuestionMessage(
                        SupportedCommands.identity,
                        {"desc": "Please provide client descriptive ID or name"},
                    ),
                )
                client_response: AnswerMessage = await Messager.espect_answer_message(
                    connection
                )

                # debug why client identity is not passed

                if (
                    client_response.answer is None
                    or client_response.command_name != SupportedCommands.identity.value
                ):
                    log("Client identity not provided.")
                    AnswerMessage.from_question_message(
                        client_response, answer="invalid_args"
                    )
                    continue

                client_identity = client_response.answer
                log(f"Connected client identity: {client_identity}")
                await Messager.send_question_message(
                    connection,
                    QuestionMessage(
                        SupportedCommands.info,
                        {"msg": f"Welcome to AI runner server, {client_identity}!"},
                    ),
                )

                client_response: AnswerMessage = await Messager.espect_answer_message(
                    connection
                )
                log(f'Received request "{client_response}"')
                response = self.handle_request(client_response)
                log(f'Sending response "{response}"')
                await connection.send(response.to_json())
            except websockets.exceptions.ConnectionClosed:
                log("Connection closed")
                break
            except KeyboardInterrupt:
                log("Keyboard interrupt received. Terminating...")
                break
            except Exception as e:
                log(f"Exception occurred: {e}")
                log("\n\n- ".join(traceback.format_exception(e)))
                break

    def handle_request(self, request: QuestionMessage) -> AnswerMessage:
        if not request.command_args:
            return AnswerMessage.from_question_message(
                request, answer="invalid_args - no command args field provided"
            )

        if not request.command_name:
            return AnswerMessage.from_question_message(
                request, answer="invalid_args - no command name provided"
            )

        if request.command_name == "run_model":
            if not request.command_args["model_name"]:
                return AnswerMessage.from_question_message(
                    request,
                    answer="invalid_args - expected `model_name` field for command `run_model`",
                )

            model_name = request.command_args["model_name"]
            log(f'Starting process for model "{model_name}"')
            manager = multiprocessing.Manager()
            return_dict: DictProxy[Literal["result"], str] = manager.dict()
            process = multiprocessing.Process(
                target=run_model, args=(model_name, return_dict)
            )
            process.start()
            process.join()
            log(f'Process for model "{model_name}" finished')

            if process.exitcode != 0:
                log(
                    f'Process for model "{model_name}" exited with code {process.exitcode}'
                )
                return AnswerMessage.from_question_message(
                    request, answer="model_run_error"
                )
            else:
                result = return_dict["result"]
                return AnswerMessage.from_question_message(request, answer=result)

            return AnswerMessage.from_question_message(request, answer=result)
        else:
            return AnswerMessage.from_question_message(
                request, answer="unknown_command"
            )


if __name__ == "__main__":
    try:
        server = Server(HOST, PORT)
        server.start()
    except KeyboardInterrupt:
        log("Keyboard interrupt received. Terminating...")
    finally:
        for process in multiprocessing.active_children():
            process.terminate()
            process.join()
        exit(0)
