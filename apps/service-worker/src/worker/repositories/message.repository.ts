import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../entities/message.entity';

export interface Message {
  text: string;
  createdAt: string;
}

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async save(message: { text: string; createdAt: string }): Promise<MessageEntity> {
    const entity = this.messageRepository.create({
      text: message.text,
      createdAt: new Date(message.createdAt),
    });
    return this.messageRepository.save(entity);
  }

  async findAll(): Promise<Message[]> {
    const entities = await this.messageRepository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => ({
      text: entity.text,
      createdAt: entity.createdAt.toISOString(),
    }));
  }
}