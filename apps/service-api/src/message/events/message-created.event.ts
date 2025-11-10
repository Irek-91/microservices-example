export class MessageCreatedEvent {
  constructor(
    public readonly text: string,
    public readonly idempotencyKey?: string,
  ) {}
}