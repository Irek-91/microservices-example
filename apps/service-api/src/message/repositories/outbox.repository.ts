import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, EntityManager } from 'typeorm';
import { OutboxEntity, OutboxStatus } from '../entities/outbox.entity';

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
  ) {}

  async create(topic: string, payload: any, manager?: EntityManager): Promise<OutboxEntity> {
    const repository = manager ? manager.getRepository(OutboxEntity) : this.outboxRepository;

    const entity = repository.create({
      topic,
      payload,
      status: OutboxStatus.PENDING,
      retryCount: 0,
    });

    return repository.save(entity);
  }

  async findPending(limit: number = 100): Promise<OutboxEntity[]> {
    return this.outboxRepository.find({
      where: { status: OutboxStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async markAsSent(id: string): Promise<void> {
    await this.outboxRepository.update(id, {
      status: OutboxStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markAsFailed(id: string, error: string, retryCount: number): Promise<void> {
    await this.outboxRepository.update(id, {
      status: OutboxStatus.FAILED,
      error,
      retryCount,
    });
  }

  async incrementRetry(id: string): Promise<void> {
    const entity = await this.outboxRepository.findOne({ where: { id } });
    if (entity) {
      await this.outboxRepository.update(id, {
        retryCount: entity.retryCount + 1,
      });
    }
  }

  async cleanupOldSent(days: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.outboxRepository.delete({
      status: OutboxStatus.SENT,
      sentAt: LessThan(cutoffDate),
    });
  }
}