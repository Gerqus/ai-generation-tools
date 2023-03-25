import os
from utils.encrypt_decrypt import decrypt

def get_creds(key: bytes):
    # get user credentials from environment variables
    encoded_user_id = os.environ.get("xUserId")
    encoded_password = os.environ.get("xUserPassword")

    # check if credentials are set
    if encoded_user_id is None or encoded_password is None:
        print("Error: Credentials not set")
        exit()

    password = decrypt(encoded_password, key)
    user_id = decrypt(encoded_user_id, key)
    
    return user_id, password
