import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class IdempotencyRepository {
  private readonly logger = new Logger(IdempotencyRepository.name);
  private readonly ttl: number;
  private readonly KEY_PREFIX = 'idempotency';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    const ttlConfig = this.configService.get<string>('IDEMPOTENCY_TTL_SECONDS');
    this.ttl = ttlConfig ? parseInt(ttlConfig, 10) : 24 * 60 * 60;
  }

  private getRedisKey(key: string): string {
    return `${this.KEY_PREFIX}:${key}`;
  }

  async findByIdempotencyKey(key: string): Promise<{ result: any } | null> {
    try {
      const cached = await this.redis.get(this.getRedisKey(key));
      if (!cached) return null;

      try {
        return { result: JSON.parse(cached) };
      } catch (error) {
        this.logger.warn(`Failed to parse cached result for key ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.warn(`Redis error when getting idempotency key ${key}: ${error.message}`);
      return null;
    }
  }

  async save(key: string, result: any): Promise<void> {
    try {
      await this.redis.setex(this.getRedisKey(key), this.ttl, JSON.stringify(result));
    } catch (error) {
      this.logger.warn(`Redis error when saving idempotency key ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getRedisKey(key));
    } catch (error) {
      this.logger.warn(`Redis error when deleting idempotency key ${key}: ${error.message}`);
    }
  }
}
