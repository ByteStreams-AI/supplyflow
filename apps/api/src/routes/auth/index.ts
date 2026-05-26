import { Hono } from 'hono';
import type { AppEnv } from '../../index';

export const authRoutes = new Hono<AppEnv>();

// POST /v1/auth/signup — create tenant + first user
authRoutes.post('/signup', async (c) => {
  return c.json({ message: 'TODO: signup' }, 501);
});

// POST /v1/auth/invite — invite a user to the tenant
authRoutes.post('/invite', async (c) => {
  return c.json({ message: 'TODO: invite' }, 501);
});

// POST /v1/auth/onboarding — complete onboarding wizard step
authRoutes.post('/onboarding', async (c) => {
  return c.json({ message: 'TODO: onboarding' }, 501);
});
