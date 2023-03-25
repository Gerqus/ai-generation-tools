from multiprocessing.connection import Connection
import time
from xAPIConnector import APIClient

def run_periodic_pinger(client: APIClient, ssid: str, pipe: Connection):
    try:
        while True:
            time.sleep(60 * 5)
            if pipe.poll():
                data = pipe.recv()
                if data == 'delay':
                    time.sleep(60 * 2)
            client.commandExecute('ping', {"streamSessionId": ssid})
    except KeyboardInterrupt:
        print("Exiting pinger process")
