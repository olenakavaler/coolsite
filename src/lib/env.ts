import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL є обов\'язковим'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET має бути мінімум 32 символи'),
  UPLOAD_DIR: z.string().default('./uploads'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`❌ Невалідні змінні середовища:\n${errors}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
