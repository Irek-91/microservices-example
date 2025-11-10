import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateMessageRequest,
  CreateMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
} from '@proto/generated/messages';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateMessageCommand } from './commands/create-message.command';
import { GetMessagesQuery } from './queries/get-messages.query';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createMessage(
    @Body() dto: CreateMessageDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const command = new CreateMessageCommand(dto.text, idempotencyKey || dto.idempotency_key);
    return this.commandBus.execute(command);
  }

  @Get()
  async getMessages() {
    const query = new GetMessagesQuery();
    const messages = await this.queryBus.execute(query);
    return { messages };
  }

  @GrpcMethod('MessageService', 'CreateMessage')
  async createMessageGrpc(data: CreateMessageRequest): Promise<CreateMessageResponse> {
    const command = new CreateMessageCommand(data.text, data.idempotencyKey || undefined);
    const result = await this.commandBus.execute(command);
    return {
      status: result.status,
    };
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