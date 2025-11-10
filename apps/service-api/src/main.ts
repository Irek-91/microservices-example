import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ZodValidationPipe } from 'nestjs-zod';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());

  const protoPath = join(process.cwd(), 'proto', 'messages.proto');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'messages',
      protoPath: protoPath,
      url: `0.0.0.0:${process.env.GRPC_PORT || 5001}`,
    },
  });

  await app.startAllMicroservices();
  console.log(`Service API gRPC server is listening on port ${process.env.GRPC_PORT || 5001}`);

  const httpPort = process.env.SERVICE_API_PORT || 3000;
  await app.listen(httpPort);
  console.log(`Service API HTTP server is listening on port ${httpPort}`);
}

bootstrap();
