import { z } from 'zod';

export const EntryQuerySearchRequestSchema = z.object({
  search: z.string().optional().default(''),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(10),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default(1),
});

export type EntryQuerySearchRequestDto = z.infer<
  typeof EntryQuerySearchRequestSchema
>;
