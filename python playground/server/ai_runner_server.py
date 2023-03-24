import asyncio
import json
import multiprocessing
from interfaces.ws_client_message import ClientMessage, SupportedCommands
import websockets
import websockets.server
import websockets.exceptions
from websockets.server import WebSocketServerProtocol

from actions_logger import Logger
from ai_runner import run_model
    
class ServerMessage(ClientMessage):
    def __init__(self, command_name: SupportedCommands, command_args: dict, result: str | None = None):
        super().__init__(command_name, command_args)
        self.add_result(result)

    @classmethod
    def from_client_message(cls, client_message: ClientMessage, result: str | None = None):
        return ServerMessage(client_message.command_name, client_message.command_args, result)
    
    def to_json(self):
        return json.dumps({
            "command_name": self.command_name.value,
            "command_args": self.command_args,
            "result": self.result if self.result else ""
        })
    
    def add_result(self, result: str | None):
        self.result = result

log = Logger(source_service="ai-runner-server.py", print_to_console=True).log

class Server:
    def __init__(self, hostname, port):
        self.hostname = hostname
        self.port = port
    
    def start(self):
        log(f"Starting server on {self.hostname}:{self.port}")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        start_server = websockets.server.serve(self.connection_handler, self.hostname, self.port)
        loop.run_until_complete(start_server)
        loop.run_forever()

    async def connection_handler(self, connection: WebSocketServerProtocol):
        log("Connection established!")
        while True:
            try:
                await connection.send("Hello from server! Who are you?")
                client_message: ClientMessage = await self.receive_message_from_client(connection)
                if (client_message.command_name != SupportedCommands["identity"]):
                    log("Client identity not provided. Closing connection...")
                    break
                else:
                    log(f"Connected client identity: {client_message.command_args['identity']}")

                request = await self.receive_message_from_client(connection)
                log(f"Received request \"{request}\"")
                response = self.handle_request(request)
                log(f"Sending response \"{response}\"")
                await connection.send(response.to_json())
            except websockets.exceptions.ConnectionClosed:
                log("Connection closed")
                break
            except KeyboardInterrupt:
                log("Keyboard interrupt received. Terminating...")
                break
            except Exception as e:
                log(f"Exception occurred: {e}")
                break

    async def receive_message_from_client(self, connection: WebSocketServerProtocol) -> ClientMessage:
        received_data = (await connection.recv())
        received_data = received_data.decode("utf-8") if isinstance(received_data, bytes) else received_data
        request: ClientMessage = ClientMessage.from_json(received_data)
        return request

    def handle_request(self, request: ClientMessage) -> ServerMessage:
        if (request.command_name == "run_model"):
            if (not request.command_args["model_name"]):
                return ServerMessage.from_client_message(request, result="invalid_args")

            model_name = request.command_args["model_name"]
            log(f"Starting process for model \"{model_name}\"")
            (read_pipe, write_pipe) = multiprocessing.Pipe(False)
            process = multiprocessing.Process(target=run_model, args=(model_name, write_pipe))
            process.start()
            process.join()
            log(f"Process for model \"{model_name}\" finished")
            result = read_pipe.recv()
            log(f"Result for model \"{model_name}\": {result}")

            return ServerMessage.from_client_message(request, result=result)
        else:
            return ServerMessage.from_client_message(request, result="unknown_command")

if __name__ == "__main__":
    try:
        server = Server("localhost", 5000)
        server.start()
    except KeyboardInterrupt:
        log("Keyboard interrupt received. Terminating...")
    finally:
        for process in multiprocessing.active_children():
            process.terminate()
            process.join()
        exit(0)
