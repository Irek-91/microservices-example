import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { MessageReceivedEvent } from '../events/message-received.event';
import { MessageRepository } from '../repositories/message.repository';

@Injectable()
@EventsHandler(MessageReceivedEvent)
export class MessageReceivedHandler implements IEventHandler<MessageReceivedEvent> {
  private readonly logger = new Logger(MessageReceivedHandler.name);

  constructor(private readonly messageRepository: MessageRepository) {}

  async handle(event: MessageReceivedEvent) {
    this.logger.log(`Received message: ${event.text} at ${event.createdAt}`);

    await this.messageRepository.save({
      text: event.text,
      createdAt: event.createdAt,
    });

    const allMessages = await this.messageRepository.findAll();
    this.logger.log(`Message saved. Total messages: ${allMessages.length}`);
  }
}