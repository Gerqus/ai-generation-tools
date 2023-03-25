from base64 import b64encode, b64decode
from typing import ByteString
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

def encrypt(data: str, key: ByteString) -> str:
    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(data.encode(), AES.block_size))
    iv = b64encode(cipher.iv).decode('utf-8')
    ct = b64encode(ct_bytes).decode('utf-8')
    return iv + ct

def decrypt(data: str, key: ByteString) -> str:
    iv = b64decode(data[:24])
    ct = b64decode(data[24:])
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode()
