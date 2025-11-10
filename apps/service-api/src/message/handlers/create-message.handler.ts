import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMessageCommand } from '../commands/create-message.command';
import { IdempotencyRepository } from '../repositories/idempotency.repository';
import { OutboxRepository } from '../repositories/outbox.repository';
import { OutboxProcessorService } from '../services/outbox-processor.service';

@Injectable()
@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<CreateMessageCommand>, OnModuleInit {
  private readonly logger = new Logger(CreateMessageHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly outboxProcessor: OutboxProcessorService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('CreateMessageHandler initialized');
  }

  async execute(command: CreateMessageCommand): Promise<{ status: string }> {
    if (command.idempotencyKey) {
      const existingRecord = await this.idempotencyRepository.findByIdempotencyKey(
        command.idempotencyKey,
      );

      if (existingRecord) {
        this.logger.log(
          `Idempotency key found: ${command.idempotencyKey}, returning cached result`,
        );
        return existingRecord.result;
      }
    }

    this.logger.log(`Creating message with text: ${command.text}`);

    const messageData = {
      text: command.text,
      createdAt: new Date().toISOString(),
    };

    const result = { status: 'OK' };

    try {
      await this.dataSource.transaction(async manager => {
        await this.outboxRepository.create('message_created', messageData, manager);
      });

      if (command.idempotencyKey) {
        await this.idempotencyRepository.save(command.idempotencyKey, result);
      }

      this.outboxProcessor.processImmediately().catch(error => {
        this.logger.warn(`Failed to process outbox immediately: ${error.message}`);
      });

      this.logger.log(`Message saved to outbox for topic: message_created`);

      return result;
    } catch (error) {
      this.logger.error(
        `Transaction failed, message not saved to outbox: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
