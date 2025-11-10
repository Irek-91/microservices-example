import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateMessageCommand } from './commands/create-message.command';
import { GetMessagesQuery } from './queries/get-messages.query';

@Controller('messages')
export class MessageHttpController {
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
}

