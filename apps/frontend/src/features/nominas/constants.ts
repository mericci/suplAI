export const NOMINA_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

export type NominaStatusKey = keyof typeof NOMINA_STATUS;

export const NOMINA_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
};

export const NOMINA_TAB = {
  FACTURAS: 'facturas',
  NOMINAS: 'nominas',
} as const;

export type NominaTabKey = typeof NOMINA_TAB[keyof typeof NOMINA_TAB];
