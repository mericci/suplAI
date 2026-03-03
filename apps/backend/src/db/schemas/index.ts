/**
 * Database Schemas - Central Export
 *
 * This file exports all database schemas for validation.
 * Import schemas from here to ensure data integrity before DB operations.
 */

// User Schemas
export {
  // Schemas
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
  UserListFiltersSchema,
  UserStatusEnum,
  UserRoleEnum,

  // Types
  type CreateUserInput,
  type UpdateUserInput,
  type UserQueryInput,
  type UserListFilters,
  type UserStatus,
  type UserRole,

  // Validation Functions
  validateCreateUser,
  validateUpdateUser,
  validateUserQuery,
  validateUserListFilters,
  safeValidateCreateUser,
  safeValidateUpdateUser,
} from './user.schema.js';

// Organization Schemas
export {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationListFiltersSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type OrganizationListFilters,
  validateCreateOrganization,
  validateUpdateOrganization,
  validateOrganizationListFilters,
} from './organization.schema.js';

// Supplier Schemas
export {
  CreateSupplierSchema,
  UpdateSupplierSchema,
  UpsertSupplierSchema,
  SupplierListFiltersSchema,
  type CreateSupplierInput,
  type UpdateSupplierInput,
  type UpsertSupplierInput,
  type SupplierListFilters,
  validateCreateSupplier,
  validateUpdateSupplier,
  validateUpsertSupplier,
  validateSupplierListFilters,
} from './supplier.schema.js';

// Invoice Schemas
export {
  InvoiceStatusEnum,
  UpsertInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceListFiltersSchema,
  type InvoiceStatus,
  type UpsertInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceListFilters,
  validateUpsertInvoice,
  validateUpdateInvoice,
  validateInvoiceListFilters,
} from './invoice.schema.js';
