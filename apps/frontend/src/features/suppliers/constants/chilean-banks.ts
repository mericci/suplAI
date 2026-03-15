export const CHILEAN_BANKS = [
  'Banco de Chile',
  'BancoEstado',
  'Banco Santander Chile',
  'Banco BCI',
  'Banco Itaú Chile',
  'Scotiabank Chile',
  'BBVA Chile',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco BTG Pactual Chile',
  'Banco Internacional',
  'Banco Bice',
  'Coopeuch',
  'Tenpo',
  'Mercado Pago',
] as const;

export const ACCOUNT_TYPES = {
  cuenta_corriente: 'Cuenta Corriente',
  cuenta_vista: 'Cuenta Vista',
  cuenta_ahorro: 'Cuenta de Ahorro',
  cuenta_rut: 'Cuenta RUT',
} as const;

export type AccountTypeKey = keyof typeof ACCOUNT_TYPES;

export const CURRENCIES = {
  CLP: 'Peso Chileno',
  USD: 'Dólar Americano',
  UF: 'Unidad de Fomento (UF)',
} as const;

export type CurrencyKey = keyof typeof CURRENCIES;
