import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const UuidSchema = z.string().uuid();
export const DatetimeSchema = z.string().datetime();
export const DateSchema = z.string().date();

// ---------------------------------------------------------------------------
// Tenancy & Access
// ---------------------------------------------------------------------------

export const TenantPlanSchema = z.enum(['starter', 'growth', 'pro', 'enterprise']);
export type TenantPlan = z.infer<typeof TenantPlanSchema>;

export const TenantStatusSchema = z.enum(['trialing', 'active', 'past_due', 'cancelled']);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const TenantSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  plan: TenantPlanSchema,
  stripe_customer_id: z.string().nullable(),
  stripe_subscription_id: z.string().nullable(),
  max_locations: z.number().int().positive(),
  max_users: z.number().int().positive(),
  status: TenantStatusSchema,
  created_at: DatetimeSchema,
  updated_at: DatetimeSchema,
});
export type Tenant = z.infer<typeof TenantSchema>;

// ---------------------------------------------------------------------------

export const LocationTypeSchema = z.enum(['restaurant', 'warehouse', 'commissary']);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const LocationSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(200),
  type: LocationTypeSchema,
  address: z.record(z.string(), z.unknown()),
  timezone: z.string(),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
});
export type Location = z.infer<typeof LocationSchema>;

// ---------------------------------------------------------------------------

export const UserRoleSchema = z.enum([
  'owner',
  'manager',
  'buyer',
  'kitchen',
  'receiving',
  'viewer',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AppUserSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  email: z.string().email(),
  name: z.string().min(1).max(200),
  auth_uid: z.string(),
  is_active: z.boolean(),
  created_at: DatetimeSchema,
});
export type AppUser = z.infer<typeof AppUserSchema>;

export const UserLocationRoleSchema = z.object({
  user_id: UuidSchema,
  location_id: UuidSchema,
  role: UserRoleSchema,
});
export type UserLocationRole = z.infer<typeof UserLocationRoleSchema>;

// ---------------------------------------------------------------------------

export const AuditLogSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  actor_user_id: UuidSchema,
  action: z.string(),
  entity: z.string(),
  entity_id: UuidSchema,
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  created_at: DatetimeSchema,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// JWT claims injected by the Supabase Auth hook + propagated through the API
export const JwtClaimsSchema = z.object({
  sub: z.string(),
  tenant_id: UuidSchema,
  role: UserRoleSchema,
  location_ids: z.array(UuidSchema),
  exp: z.number(),
});
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;
