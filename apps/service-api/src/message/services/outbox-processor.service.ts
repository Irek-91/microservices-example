import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { OutboxRepository } from '../repositories/outbox.repository';
import { OutboxEntity } from '../entities/outbox.entity';

@Injectable()
export class OutboxProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly MAX_RETRIES = 5;
  private readonly PROCESS_INTERVAL = 5000; // 5 seconds
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject('KAFKA_PRODUCER') private readonly kafkaClient: ClientKafka,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('message_created');
    await this.kafkaClient.connect();
    this.logger.log('Kafka producer connected for outbox processor');

    this.startProcessing();
  }

  onModuleDestroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  private startProcessing() {
    this.logger.log('Starting outbox processor');
    this.processingInterval = setInterval(() => this.processOutbox(), this.PROCESS_INTERVAL);
  }

  async processOutbox() {
    try {
      const pendingMessages = await this.outboxRepository.findPending(50);

      if (pendingMessages.length === 0) {
        return;
      }

      this.logger.debug(`Processing ${pendingMessages.length} pending outbox messages`);

      for (const message of pendingMessages) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error(`Error processing outbox: ${error.message}`, error.stack);
    }
  }

  private async processMessage(message: OutboxEntity) {
    try {
      if (message.retryCount >= this.MAX_RETRIES) {
        await this.outboxRepository.markAsFailed(
          message.id,
          'Max retries exceeded',
          message.retryCount,
        );
        this.logger.warn(`Message ${message.id} exceeded max retries`);
        return;
      }

      await firstValueFrom(this.kafkaClient.emit(message.topic, message.payload));
      this.logger.debug(`Message ${message.id} sent to Kafka topic ${message.topic}`);

      await this.outboxRepository.markAsSent(message.id);
      this.logger.log(`Message ${message.id} successfully sent and marked as SENT`);
    } catch (error) {
      await this.outboxRepository.incrementRetry(message.id);
      this.logger.error(
        `Error sending message ${message.id} to Kafka (retry ${message.retryCount + 1}/${this.MAX_RETRIES}): ${error.message}`,
        error.stack,
      );
    }
  }

  async processImmediately() {
    await this.processOutbox();
  }
}
