import Stripe from 'stripe';
import type { Env } from './env';

export function createStripe(env: Env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });
}
