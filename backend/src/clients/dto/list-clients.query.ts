import { z } from 'zod';

export const PAGE_SIZE = 25;
const MAX_PAGE = 10_000;

// Empty query values (e.g. "?search=") are treated as not given
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

// Query parameters of GET /api/v1/clients (ARCHITECTURE 12.1). Repeated parameters arrive as
// arrays and are rejected because every field expects a single string.
export const listClientsQuerySchema = z.object({
  search: optional(z.string().trim().max(200)),
  processingStatus: optional(z.enum(['Success', 'Failed'])),
  sortOrder: optional(z.enum(['asc', 'desc'])).transform((value) => value ?? 'desc'),
  page: optional(
    z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(MAX_PAGE)),
  ).transform((value) => value ?? 1),
  limit: optional(z.literal(String(PAGE_SIZE))).transform(() => PAGE_SIZE),
});

export type ListClientsQuery = z.output<typeof listClientsQuerySchema>;
