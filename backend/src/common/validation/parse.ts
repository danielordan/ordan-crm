import { BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

// Validates request input with zod; failures become 400 with field names only
export function parseOrBadRequest<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.') || 'body'))];
    throw new BadRequestException(`Invalid value for: ${fields.join(', ')}.`);
  }
  return result.data;
}
