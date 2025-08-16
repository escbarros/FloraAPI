import { z } from 'zod';

export const UserListPaginationRequestSchema = z.object({
  userId: z.uuid(),
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

export type UserListPaginationRequestDto = z.infer<
  typeof UserListPaginationRequestSchema
>;
