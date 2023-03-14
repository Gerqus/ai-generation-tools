import * as GPT3Encoder from "gpt-3-encoder";
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { openConnectionToOpenAi } from "./open-connection-to-open-ai";
import { UniversalConsoleParams } from "../../interfaces/universal-console-params.interface";
import { ProgramConstantsId } from "../../../shared/enums/program-constants-id.enum";
import { CONVERSATION_STARTERS, HANDLEBAR_TEMPLATES_MATCHER, QUERY_TEMPLATES } from "../../../shared/constants";
import { ChatModel } from "../../enums/chat-model.enum";
import { UpdatedCreateChatCompletionResponse } from "./interfaces/updated-create-chat-completion-response.interface";

export class ChatQueriesSender {
  public static simpleHandlebarsReplacer(string: string, replacements: UniversalConsoleParams) {
    Array.from(string.matchAll(HANDLEBAR_TEMPLATES_MATCHER)).forEach(([_, placeholder]) => {
      const placeholderVal = replacements[placeholder];
      if (placeholderVal) {
        string = string.replace(`{${placeholder}}`, placeholderVal.toString());
      }
    });
    return string;
  }

  protected readonly primedConversation: ChatCompletionRequestMessage[] = [];
  protected readonly openAi: OpenAIApi = openConnectionToOpenAi();
  protected readonly openAiChatMaxTokens = 4096;

  constructor(
    private readonly programId: ProgramConstantsId,
    private readonly chatModel: ChatModel = ChatModel.GPT_3_5_TURBO,
  ) {
    this.primeChatConversation();
  }

  private primeChatConversation(): void {
    this.primedConversation.push(...CONVERSATION_STARTERS[this.programId]);
  }

  protected getQuery(queryTemplate: string, queryReplaceValues: UniversalConsoleParams): ChatCompletionRequestMessage[] {
    return this.primedConversation.concat(
      {
        role: ChatCompletionRequestMessageRoleEnum.User,
        content: ChatQueriesSender.simpleHandlebarsReplacer(queryTemplate, queryReplaceValues),
      },
    );
  }

  public async sendQuery(operationsParams: UniversalConsoleParams): Promise<ChatCompletionRequestMessage> {
    const query = this.getQuery(QUERY_TEMPLATES[this.programId], operationsParams);

    const tokensCount = GPT3Encoder.encode(query.map(msg => msg.content).join(`\n\n`)).length;
    const expectedMaxResponseLength = (this.openAiChatMaxTokens - tokensCount) - 1;
    if (expectedMaxResponseLength < 1) {
      console.error('Conversation starter and query are too long');
    }
    console.log('Query prepared. The query is:');
    console.log(query[query.length - 1].content);
    console.log(`Sending query to ChatGPT...`);
    console.log('Expecting response of aproximate length:', expectedMaxResponseLength);

    try {
      const res = await this.openAi.createChatCompletion({
        model: this.chatModel,
        messages: query,
        temperature: 0.5,
        stream: true,
      }, { responseType: 'stream' });

      return new Promise<ChatCompletionRequestMessage>((resolve) => {
        const response: ChatCompletionRequestMessage = {
          role: null,
          content: '',
        };

        (res.data as any).on('data', (data: CreateChatCompletionResponse) => {
          const dataString = data.toString();
          const lines = dataString.split('\n').filter((line: any) => line.trim() !== '');
          for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
              resolve(response);
              return; // Stream finished
            }

            let parsedMessage: UpdatedCreateChatCompletionResponse;
            try {
              parsedMessage = JSON.parse(message);
            } catch {}

            if (!parsedMessage?.choices?.length) {
              console.log('No choices message:', parsedMessage);
              continue;
            }

            if (parsedMessage.choices[0].delta?.role) {
              response.role = parsedMessage.choices[0].delta?.role;
            }

            if (parsedMessage.choices[0].delta?.content) {
              response.content += parsedMessage.choices[0].delta?.content;
            }
          }
        });

        (res.data as any).on('close', (data: any) => {
          console.log('Stream closed by ChatGPT. Data from close event:', data);
          resolve(response);
        });
      });
    } catch (error) {
      if (error.response?.status) {
          console.error(error.response.status, error.message);
          error.response.data.on('data', (data: any) => {
              const message = data.toString();
              try {
                  const parsed = JSON.parse(message);
                  console.error('An error occurred during OpenAI request: ', parsed);
              } catch(error) {
                  console.error('An error occurred during OpenAI request: ', message);
              }
          });
      } else {
          console.error('An error occurred during OpenAI request', error);
      }
    }
  }
}