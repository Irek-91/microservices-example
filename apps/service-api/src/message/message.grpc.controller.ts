import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import {
  CreateMessageRequest,
  CreateMessageResponse,
  GetMessagesResponse,
} from '@proto/generated/messages';
import { CreateMessageCommand } from './commands/create-message.command';
import { GetMessagesQuery } from './queries/get-messages.query';

@Controller()
export class MessageGrpcController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod('MessageService', 'CreateMessage')
  async createMessage(
    @Payload() data: CreateMessageRequest,
  ): Promise<CreateMessageResponse> {
    const command = new CreateMessageCommand(data.text, data.idempotencyKey);
    const result = await this.commandBus.execute(command);
    return {
      status: result.status,
    };
  }

  @GrpcMethod('MessageService', 'GetMessages')
  async getMessages(): Promise<GetMessagesResponse> {
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

