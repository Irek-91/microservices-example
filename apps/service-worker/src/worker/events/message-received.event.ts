export class MessageReceivedEvent {
  constructor(
    public readonly text: string,
    public readonly createdAt: string,
  ) {}
}
