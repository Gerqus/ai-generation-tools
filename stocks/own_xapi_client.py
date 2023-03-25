import json
import multiprocessing
import time
from network_methods.pinger import run_periodic_pinger
from utils.get_creds import get_creds
from utils.prepare_key_from_input import prepare_key_from_input
from xAPIConnector import APIClient as XAPIConnectorClient, loginCommand

def main():
    while True:
        try:
            key = prepare_key_from_input()
            user_id, password = get_creds(key)
            break
        except ValueError:
            print("Wrong password. Please try again")
            continue
        except KeyboardInterrupt:
            print("Exiting")
            return

    # print("encrypted value: " + encrypt(os.environ.get("xUserId"), key)) # type: ignore

    client = XAPIConnectorClient()
    loginResponse = client.execute(loginCommand(userId=user_id, password=password))
    
    print(str(loginResponse))
    if(loginResponse['status'] == False):
        print('Login failed. Error code: {0}'.format(loginResponse['errorCode']))
        return
    
    ssid = loginResponse['streamSessionId']
    print('Login successful. Stream session id: {0}'.format(ssid))

    # run keep alive ping in background subprocess
    (read_pipe, write_pipe) = multiprocessing.Pipe(False)
    process = multiprocessing.Process(target=run_periodic_pinger, args=(client, ssid, read_pipe))
    process.start()
    time.sleep(1)
    
    try:
        while True:
            command = input('Enter command:\n\t')
            if command == 'exit':
                break
            arguments = input('Enter arguments in key:value format with a "," as separator:\n\t')
            arguments = arguments.strip().replace(', ', ',').replace(' ,', ',').replace(': ', ':').replace(' :', ':')
            arguments_dict = {
                "streamSessionId": ssid
            }
            try:
                if arguments != '':
                    arguments = arguments + ','
                    for arg in arguments.split(','):
                        if arg == '':
                            continue
                        arg = arg.strip()
                        arg = arg + ':'
                        key, value, *rest = arg.split(':')
                        if value == '':
                            continue
                        # paese data to int and boolean
                        if value.lower() == 'true':
                            value = True
                        elif value.lower() == 'false':
                            value = False
                        else:
                            try:
                                value = int(value)
                            except ValueError:
                                pass
                        arguments_dict[key] = value
            except Exception as e:
                print("Could not parse arguments: ", e)
                print("Please try again.")
                continue

            raw_resp = client.commandExecute(command, arguments_dict)
            write_pipe.send('delay')

            resp = json.dumps(raw_resp)
            print(resp)
    except KeyboardInterrupt:
        print('Keyboard interrupt. Logging out...')
        client.commandExecute('logout')
        process.join()

if __name__ == "__main__":
    main()
