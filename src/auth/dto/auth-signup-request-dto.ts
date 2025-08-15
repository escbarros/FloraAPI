import { z } from 'zod';

export const AuthSignUpRequestSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'name is required'
          : 'name is of type string',
    })
    .min(1, 'name is required'),
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

export type AuthSignUpRequestDto = z.infer<typeof AuthSignUpRequestSchema>;
