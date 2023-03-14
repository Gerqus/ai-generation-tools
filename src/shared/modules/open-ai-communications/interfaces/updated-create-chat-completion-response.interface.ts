import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";

export interface UpdatedCreateChatCompletionResponse extends CreateChatCompletionResponse {
  choices: {
    index?: number;
    message?: never;
    delta?: Partial<ChatCompletionRequestMessage>;
    finish_reason?: string;
  }[];
}