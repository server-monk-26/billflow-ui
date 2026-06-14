import { z } from 'zod';

/**
 * Auth/session schemas (CLAUDE.md §10). The login/session response is validated with
 * Zod before it ever reaches the store — types are derived from these schemas (§5, §8).
 * Permissions and menus are server-driven (§16.1, §16.2), never hard-coded.
 */

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
});
export type User = z.infer<typeof userSchema>;

export interface MenuItem {
  id: string;
  labelKey: string;
  path?: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

/**
 * A nav node delivered by the server; rendered and filtered by permission (§16.1).
 * Cast through ZodType to support the recursive `children` reference (zod's inferred
 * optional type is wider than the interface under exactOptionalPropertyTypes).
 */
export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    labelKey: z.string(),
    path: z.string().optional(),
    icon: z.string().optional(),
    permission: z.string().optional(),
    children: z.array(menuItemSchema).optional(),
  }),
) as z.ZodType<MenuItem>;

export const sessionSchema = z.object({
  user: userSchema,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  tenantId: z.string(),
  menus: z.array(menuItemSchema).default([]),
  featureFlags: z.record(z.string(), z.boolean()).default({}),
  accessToken: z.string(),
  sessionId: z.string().optional(),
});
export type Session = z.infer<typeof sessionSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;
