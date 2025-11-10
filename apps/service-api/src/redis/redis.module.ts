import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');

        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
          retryStrategy: times => {
            return Math.min(times * 50, 2000);
          },
          lazyConnect: true,
        });

        redis.on('error', error => {
          logger.warn(`Redis connection error: ${error.message}`);
        });

        redis.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        redis.on('ready', () => {
          logger.log('Redis is ready to accept commands');
        });

        redis.on('close', () => {
          logger.warn('Redis connection closed');
        });

        redis.connect().catch(error => {
          logger.warn(`Redis initial connection failed: ${error.message}`);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}