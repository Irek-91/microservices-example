import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateMessageSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  idempotency_key: z.string().optional(),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
