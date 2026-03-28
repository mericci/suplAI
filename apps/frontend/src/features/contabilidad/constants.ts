import type { ContabilidadPeriod } from '@/integrations/backend/contabilidad';

export const CONTABILIDAD_PERIOD = {
  ALL: 'all',
  YTD: 'ytd',
  ONE_MONTH: '1m',
  CURRENT_MONTH: 'current_month',
  ONE_YEAR: '1y',
} as const satisfies Record<string, ContabilidadPeriod>;

export const CONTABILIDAD_PERIOD_LABELS: Record<ContabilidadPeriod, string> = {
  all: 'Todo',
  ytd: 'YTD',
  '1m': '1 mes',
  current_month: 'Mes actual',
  '1y': '1 año',
};

export const CONTABILIDAD_PERIOD_OPTIONS: { value: ContabilidadPeriod; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'ytd', label: 'YTD' },
  { value: '1m', label: '1 mes' },
  { value: 'current_month', label: 'Mes actual' },
  { value: '1y', label: '1 año' },
];

export const CONTABILIDAD_TAB = {
  CENTROS_COSTOS: 'centros-costos',
  IDS_CONTABLES: 'ids-contables',
  PENDIENTES: 'pendientes',
} as const;

export const ADMIN_ROLES = ['admin', 'super_admin'];
