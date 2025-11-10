import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerController } from './worker.controller';
import { WorkerKafkaController } from './worker.controller.kafka';
import { GetMessagesHandler } from './handlers/get-messages.handler';
import { MessageReceivedHandler } from './handlers/message-received.handler';
import { MessageRepository } from './repositories/message.repository';
import { MessageEntity } from './entities/message.entity';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([MessageEntity])],
  controllers: [WorkerController, WorkerKafkaController],
  providers: [GetMessagesHandler, MessageReceivedHandler, MessageRepository],
})
export class WorkerModule {}