export { CHILEAN_BANKS, ACCOUNT_TYPES } from '@/features/suppliers/constants/chilean-banks';
export type { AccountTypeKey } from '@/features/suppliers/constants/chilean-banks';

export const BACKING_TYPES = {
  boleta: 'Boleta',
  factura: 'Factura',
  comprobante: 'Comprobante',
  ticket: 'Ticket',
  otro: 'Otro',
} as const;

export type BackingTypeKey = keyof typeof BACKING_TYPES;

export const RENDICION_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
} as const;

export const VALIDATION_STATUS_LABELS = {
  pending: 'Pendiente',
  valid: 'Válido',
  invalid: 'Inválido',
} as const;
