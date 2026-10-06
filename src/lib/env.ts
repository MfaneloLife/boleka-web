import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const _serverEnv = serverSchema.safeParse(process.env);
const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!_serverEnv.success && typeof window === 'undefined') {
  console.error('Invalid Server Env:', _serverEnv.error.format());
  throw new Error('Invalid Server Environment Variables');
}

export const serverEnv = (typeof window === 'undefined' ? _serverEnv.data : {}) as z.infer<typeof serverSchema>;
export const clientEnv = _clientEnv.data as z.infer<typeof clientSchema>;
