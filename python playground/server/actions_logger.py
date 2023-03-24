import datetime
import os
import re

class Logger:
    def __init__(self, source_service: str | None = None, print_to_console: bool = False, file_path: str = f'logs/{datetime.datetime.now().strftime("%Y-%m-%d")}.log'):
        # make sure the logs directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        # create file if it doesn't exist
        if not os.path.exists(file_path):
            open(file_path, 'w').close()
        # set up logger
        self.source_service = source_service
        self.print_to_console = print_to_console
        self.file_name = file_path

    def log(self, message: str, override_print_to_console: bool | None = None):
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # regular expression matching all terminal escape sequences
        regex = r'\\x1b[^m]*m'
        # remove all terminal escape sequences from message
        message = re.sub(regex, '', message)

        # format message
        formatted_message = f'{self.source_service}\n{timestamp}:\t{message}' if self.source_service else f'{timestamp}:\t{message}'
        with open(self.file_name, 'a') as f:
            f.write(formatted_message)
            f.write('\n')
            f.close()
        if self.print_to_console or override_print_to_console:
            print(formatted_message)
