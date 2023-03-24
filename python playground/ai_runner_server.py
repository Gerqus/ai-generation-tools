import asyncio
import multiprocessing
from interfaces.ws_client_message import ClientMessage, SupportedCommands
import websockets
import websockets.server
import websockets.exceptions

from actions_logger import Logger
from ai_runner import run_model
    
class ServerMessage(ClientMessage):
    def __init__(self, command_name: SupportedCommands, command_args: dict, result: str | None = None):
        super().__init__(command_name, command_args)
        self.add_result(result)

    @classmethod
    def from_client_message(cls, client_message: ClientMessage, result: str | None = None):
        return ServerMessage(client_message.command_name, client_message.command_args, result)
    
    def add_result(self, result: str | None):
        self.result = result

log = Logger(source_service="ai-runner-server.py", print_to_console=True).log

class Server:
    def __init__(self, hostname, port):
        self.hostname = hostname
        self.port = port
    
    def start(self):
        log(f"Starting server on {self.hostname}:{self.port}")
        start_server = websockets.server.serve(self.connection_handler, self.hostname, self.port)
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

    async def connection_handler(self, connection):
        log("Connection established!")
        while True:
            try:
                connection.send("Hello from server! Who are you?")
                client_message: ClientMessage = ClientMessage.from_json(await connection.recv())
                if (client_message.command_name != SupportedCommands["identity"]):
                    log("Client identity not provided. Closing connection...")
                    break
                else:
                    log(f"Connected client identity: {client_message.command_args['identity']}")

                request: ClientMessage = ClientMessage.from_json(await connection.recv())
                log(f"Received request \"{request}\"")
                response = self.handle_request(request)
                log(f"Sending response \"{response}\"")
                await connection.send(response)
            except websockets.exceptions.ConnectionClosed:
                log("Connection closed")
                break
            except KeyboardInterrupt:
                log("Keyboard interrupt received. Terminating...")
                break

    def handle_request(self, request: ClientMessage) -> ServerMessage:
        if (request.command_name == "run_model"):
            # check if args are valid
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
            raise ValueError(f"Unknown command \"{request.command_name}\"")

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
