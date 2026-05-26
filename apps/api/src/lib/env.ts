export type Env = {
  // Secrets (set via wrangler secret / CF dashboard)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  ML_SERVICE_URL: string;
  ML_SERVICE_API_KEY: string;

  // KV namespaces
  RATE_LIMIT_KV: KVNamespace;

  // Queues
  TASK_QUEUE: Queue;

  // Vars
  ENVIRONMENT: 'development' | 'staging' | 'production';
};
