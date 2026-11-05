import { z } from 'zod';

// Structured output of the AI (ARCHITECTURE 8.3). Strict mode needs every field present,
// so a missing value is null rather than an omitted key.
export const extractionSchema = z.object({
  companyName: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  originPort: z.string().nullable(),
  originCountry: z.string().nullable(),
  destinationPort: z.string().nullable(),
  incoterms: z.string().nullable(),
  shipmentType: z.enum(['FCL', 'LCL']).nullable(),
});

export type ExtractedData = z.infer<typeof extractionSchema>;
