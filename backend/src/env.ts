import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  SESSION_SECRET: z.string().min(10).default('change-me-in-dev'),
  FRONTEND_URL: z.string().url().default('http://localhost:4200'),
  PUBLIC_BACKEND_URL: z.string().url().optional(),

  // Ravelry OAuth 2.0 credentials
  // Create at: https://www.ravelry.com/pro/developer
  RAVELRY_CLIENT_ID: z.string().min(1).optional(),
  RAVELRY_CLIENT_SECRET: z.string().min(1).optional(),
  RAVELRY_SCOPES: z.string().default('offline'),

  // If true, backend serves mock data (useful before adding Ravelry credentials)
  MOCK_RAVELRY: z.coerce.boolean().default(false),

  // Groq API key for Generate Description (Podcaster's Assistant). If unset, fallback description only.
  GROQ_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
