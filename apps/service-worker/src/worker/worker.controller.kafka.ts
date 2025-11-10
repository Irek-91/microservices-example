import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { EventBus } from '@nestjs/cqrs';
import { MessageReceivedEvent } from './events/message-received.event';

@Controller()
export class WorkerKafkaController {
  private readonly logger = new Logger(WorkerKafkaController.name);

  constructor(private readonly eventBus: EventBus) {}

  @EventPattern('message_created')
  async handleMessageCreated(
    @Payload() data: { text: string; createdAt: string },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received Kafka message: ${JSON.stringify(data)}`);

    this.eventBus.publish(new MessageReceivedEvent(data.text, data.createdAt));
  }
}