/**
 * User Database Schema
 *
 * Defines the structure, types, and validation rules for the users table.
 * Users belong to exactly one Organization.
 */

import { z } from 'zod';

export const UserStatusEnum = z.enum([
  'active',
  'inactive',
  'suspended',
  'deleted',
]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const UserRoleEnum = z.enum([
  'admin',
  'standard',
  'moderator',
  'super_admin',
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

const BaseUserSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .trim()
    .optional(),

  // Legacy field — kept for backward compatibility
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),

  organizationId: z
    .string()
    .uuid('Invalid organization ID')
    .optional()
    .nullable(),

  avatar_url: z.string().url('Invalid URL format').optional().nullable(),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),

  role: UserRoleEnum.default('standard'),

  status: UserStatusEnum.default('active'),

  metadata: z.record(z.unknown()).optional().nullable() as z.ZodType<
    Record<string, unknown> | null | undefined,
    z.ZodTypeDef,
    Record<string, unknown> | null | undefined
  >,
});

export const CreateUserSchema = BaseUserSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});

export const UpdateUserSchema = BaseUserSchema.partial().extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});

export const UserQuerySchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: UserStatusEnum.optional(),
  role: UserRoleEnum.optional(),
});

export const UserListFiltersSchema = z.object({
  status: UserStatusEnum.optional(),
  role: UserRoleEnum.optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100)
    .default(10),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserQueryInput = z.infer<typeof UserQuerySchema>;
export type UserListFilters = z.infer<typeof UserListFiltersSchema>;

export function validateCreateUser(data: unknown): CreateUserInput {
  return CreateUserSchema.parse(data);
}

export function validateUpdateUser(data: unknown): UpdateUserInput {
  return UpdateUserSchema.parse(data);
}

export function validateUserQuery(data: unknown): UserQueryInput {
  return UserQuerySchema.parse(data);
}

export function validateUserListFilters(data: unknown): UserListFilters {
  return UserListFiltersSchema.parse(data);
}

export function safeValidateCreateUser(
  data: unknown,
): z.SafeParseReturnType<unknown, CreateUserInput> {
  return CreateUserSchema.safeParse(data);
}

export function safeValidateUpdateUser(
  data: unknown,
): z.SafeParseReturnType<unknown, UpdateUserInput> {
  return UpdateUserSchema.safeParse(data);
}
