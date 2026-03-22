/**
 * Backend integrations barrel export.
 *
 * Usage:
 *   import { listUsers, getSiiInvoices, ping } from '@/integrations/backend';
 *   import type { User, Invoice } from '@/integrations/backend';
 */

export * from './users';
export * from './sii';
export * from './test';
export * from './organizations';
export * from './suppliers';
export * from './budget';
export * from './settings';
export type { ApiResponse, PaginatedResponse } from './client';
