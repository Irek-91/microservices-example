import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.SERVICE_WORKER_PORT || 3001;
  await app.listen(port);
  console.log(`Service Worker HTTP server is listening on port ${port}`);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'nestjs-microservices',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'service-worker-group',
      },
    },
  });

  const protoPath = join(process.cwd(), 'proto', 'messages.proto');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'messages',
      protoPath: protoPath,
      url: `0.0.0.0:${process.env.WORKER_GRPC_PORT || 5002}`,
    },
  });

  await app.startAllMicroservices();
  console.log('Service Worker Kafka consumer is listening');
  console.log(
    `Service Worker gRPC server is listening on port ${process.env.WORKER_GRPC_PORT || 5002}`,
  );
}

bootstrap();
