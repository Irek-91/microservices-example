export class CreateMessageCommand {
  constructor(
    public readonly text: string,
    public readonly idempotencyKey?: string,
  ) {}
}
