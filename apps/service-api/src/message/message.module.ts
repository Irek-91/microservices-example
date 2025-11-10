import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MessageController } from './message.controller';
import { CreateMessageHandler } from './handlers/create-message.handler';
import { GetMessagesHandler } from './handlers/get-messages.handler';
import { IdempotencyRepository } from './repositories/idempotency.repository';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxEntity } from './entities/outbox.entity';
import { OutboxProcessorService } from './services/outbox-processor.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OutboxEntity]),
    ClientsModule.register([
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID || 'nestjs-microservices',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'service-api-group',
          },
        },
      },
      {
        name: 'WORKER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'messages',
          protoPath: join(process.cwd(), 'proto', 'messages.proto'),
          url: process.env.WORKER_GRPC_URL || 'localhost:5002',
        },
      },
    ]),
  ],
  controllers: [MessageController],
  providers: [
    CreateMessageHandler,
    GetMessagesHandler,
    IdempotencyRepository,
    OutboxRepository,
    OutboxProcessorService,
  ],
})
export class MessageModule {}
