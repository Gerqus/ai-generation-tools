from websockets.server import WebSocketServerProtocol
from websockets.client import WebSocketClientProtocol

from interfaces.answer_message import AnswerMessage
from interfaces.question_message import QuestionMessage

class Messager:
    @classmethod
    async def espect_answer_message(cls, connection: WebSocketServerProtocol | WebSocketClientProtocol) -> AnswerMessage:
        received_data = await connection.recv()
        received_data = received_data.decode("utf-8") if isinstance(received_data, bytes) else received_data
        request: AnswerMessage = AnswerMessage.from_json(received_data)
        return request
    
    @classmethod
    async def expect_question_message(cls, connection: WebSocketServerProtocol | WebSocketClientProtocol) -> QuestionMessage:
        received_data = await connection.recv()
        received_data = received_data.decode("utf-8") if isinstance(received_data, bytes) else received_data
        request: QuestionMessage = QuestionMessage.from_json(received_data)
        return request
    
    @classmethod
    async def send_question_message(cls, connection: WebSocketServerProtocol | WebSocketClientProtocol, message: QuestionMessage):
        await connection.send(message.to_json())

    @classmethod
    async def send_answer_message(cls, connection: WebSocketServerProtocol | WebSocketClientProtocol, message: AnswerMessage):
        await connection.send(message.to_json())
