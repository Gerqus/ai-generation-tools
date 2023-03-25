from getpass import getpass
from hashlib import scrypt
import os

def prepare_key_from_input():
    encryption_password = getpass("Enter encryption-decrption key:")
    raw_salt = os.environ.get("xUserSalt")
    if raw_salt is None:
        print("Error: Salt not set")
        exit()

    salt = raw_salt.encode()
    key = scrypt(encryption_password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return key
