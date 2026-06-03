import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const tenantPlanEnum = pgEnum('tenant_plan', [
  'starter',
  'growth',
  'pro',
  'enterprise',
]);

export const tenantStatusEnum = pgEnum('tenant_status', [
  'trialing',
  'active',
  'past_due',
  'cancelled',
]);

export const locationTypeEnum = pgEnum('location_type', [
  'restaurant',
  'warehouse',
  'commissary',
]);

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'manager',
  'buyer',
  'kitchen',
  'receiving',
  'viewer',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const tenant = pgTable('tenant', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  plan: tenantPlanEnum('plan').notNull().default('starter'),
  stripe_customer_id: text('stripe_customer_id'),
  stripe_subscription_id: text('stripe_subscription_id'),
  max_locations: text('max_locations').notNull().default('1'),
  max_users: text('max_users').notNull().default('5'),
  status: tenantStatusEnum('status').notNull().default('trialing'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const location = pgTable('location', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: locationTypeEnum('type').notNull().default('restaurant'),
  address: jsonb('address').notNull().default({}),
  timezone: text('timezone').notNull().default('America/Chicago'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const appUser = pgTable('app_user', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  /** Maps to auth.users.id in Supabase Auth. */
  auth_uid: text('auth_uid').notNull().unique(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userLocationRole = pgTable('user_location_role', {
  user_id: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  location_id: uuid('location_id')
    .notNull()
    .references(() => location.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull(),
  actor_user_id: uuid('actor_user_id').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entity_id: uuid('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
