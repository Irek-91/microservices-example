import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GrpcMethod } from '@nestjs/microservices';
import { GetMessagesRequest, GetMessagesResponse } from '@proto/generated/messages';
import { GetMessagesQuery } from './queries/get-messages.query';

@Controller('messages')
export class WorkerController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getMessages() {
    const query = new GetMessagesQuery();
    const messages = await this.queryBus.execute(query);
    return { messages };
  }

  @GrpcMethod('MessageService', 'GetMessages')
  async getMessagesGrpc(data: GetMessagesRequest): Promise<GetMessagesResponse> {
    const query = new GetMessagesQuery();
    const messages = await this.queryBus.execute(query);
    return {
      messages: messages.map(msg => ({
        text: msg.text,
        createdAt: msg.createdAt,
      })),
    };
  }
}