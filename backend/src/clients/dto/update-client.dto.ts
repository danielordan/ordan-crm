import { z } from 'zod';

// Values are stored exactly as entered; only blank text counts as "no value" (ARCHITECTURE 9.2).
// PostgreSQL text cannot hold a NUL character, so it is rejected instead of failing as a 500.
const textField = z
  .string()
  .refine((value) => !value.includes('\0'))
  .transform((value) => (value.trim() === '' ? null : value))
  .nullable()
  .optional();

// Body of PATCH /api/v1/clients/:id (ARCHITECTURE 12.1). No format validation except shipmentType.
export const updateClientSchema = z
  .strictObject({
    companyName: textField,
    address: textField,
    phone: textField,
    email: textField,
    originPort: textField,
    originCountry: textField,
    destinationPort: textField,
    incoterms: textField,
    shipmentType: z.enum(['FCL', 'LCL']).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0);

export type UpdateClientDto = z.output<typeof updateClientSchema>;
