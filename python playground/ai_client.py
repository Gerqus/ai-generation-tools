import asyncio
import websockets
import websockets.client

HOST = 'localhost'
PORT = 5000

async def main():
    async with websockets.client.connect(f'ws://{HOST}:{PORT}') as websocket:
        await websocket.send('Hello from client!')
        print(f'> {await websocket.recv()}')

asyncio.get_event_loop().run_until_complete(main())

# Output:
# > Hello from server! Who are you?
# < {"command_name": "identity", "command_args": {"identity": "model_runner_client"}}
# > {"command_name": "run_model", "command_args": {"model_name": "test_model"}, "result": "test_model_result"}
