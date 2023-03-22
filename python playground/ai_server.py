import socket
import threading
from queue import Queue
import signal
import sys

class Server:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.bind((self.host, self.port))
        self.socket.setblocking(False)
        self.queue = Queue()
        self.is_running = False

    def start(self):
        self.is_running = True
        self.socket.listen()
        print(f"Server listening on {self.host}:{self.port}")

        # Start request processing thread as a daemon thread
        threading.Thread(target=self.process_request, daemon=True).start()

        # Register signal handler for keyboard interrupt
        signal.signal(signal.SIGINT, self.handle_signal)

        while self.is_running:
            try:
                client, address = self.socket.accept()
                print(f"Connection from {address} established.")
                request = client.recv(1024).decode()
                self.queue.put((request, client))
                print(f"Request added to queue: {request}")
            except BlockingIOError:
                pass

        self.socket.close()

    def stop(self):
        print("Stopping server...")
        self.is_running = False
        self.socket.close()

    def handle_signal(self, sig, frame):
        print("Keyboard interrupt received")
        self.stop()

    def process_request(self):
        while self.is_running:
            if not self.queue.empty():
                request, client = self.queue.get()
                print(f"Processing request: {request}")
                # Do some heavy processing here
                response = "Processed: " + request
                client.send(response.encode())
                client.close()
                print(f"Response sent: {response}")

if __name__ == "__main__":
    server = Server("localhost", 12345)
    server.start()
