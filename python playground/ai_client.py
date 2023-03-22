import socket

HOST = 'localhost'
PORT = 12345

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    s.sendall(b'Hello, World!')
    s.shutdown(socket.SHUT_WR)
    data = s.recv(1024)

print('Received', repr(data.decode()))
