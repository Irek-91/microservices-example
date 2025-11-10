import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CreateMessageRequest,
  CreateMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
} from '@proto/generated/messages';
import { GetMessagesQuery } from '../queries/get-messages.query';
import { firstValueFrom, Observable } from 'rxjs';

interface MessageServiceNestClient {
  getMessages(data: GetMessagesRequest): Observable<GetMessagesResponse>;
  createMessage(data: CreateMessageRequest): Observable<CreateMessageResponse>;
}

@Injectable()
@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery>, OnModuleInit {
  private workerService: MessageServiceNestClient;

  constructor(@Inject('WORKER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.workerService = this.client.getService<MessageServiceNestClient>('MessageService');
  }

  async execute(query: GetMessagesQuery) {
    const request: GetMessagesRequest = {};
    const response: GetMessagesResponse = await firstValueFrom(
      this.workerService.getMessages(request),
    );

    return (response.messages || []).map(msg => ({
      text: msg.text,
      createdAt: msg.createdAt,
    }));
  }
}
