import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetMessagesQuery } from '../queries/get-messages.query';
import { MessageRepository } from '../repositories/message.repository';

@Injectable()
@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(query: GetMessagesQuery) {
    return this.messageRepository.findAll();
  }
}