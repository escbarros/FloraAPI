import { z } from 'zod';

export const AuthSignInRequestSchema = z.object({
  email: z.email('invalid email'),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'password is required'
          : 'password is of type string',
    })
    .min(6, 'password should have at least 6 characters'),
});

export type AuthSignInRequestDto = z.infer<typeof AuthSignInRequestSchema>;
