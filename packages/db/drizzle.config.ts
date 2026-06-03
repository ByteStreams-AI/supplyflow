import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: '../../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Used only for local dev / migration runs; Workers use the pooler URL.
    url: process.env['DATABASE_URL'] ?? '',
  },
});
