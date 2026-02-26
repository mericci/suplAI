/**
 * Chilean RUT Parser
 *
 * Parses a RUT in the format XXXXXXXX-X (with or without dots)
 * into its numeric body (dni) and verification digit (dv) components.
 */

export function parseChileanRut(rut: string): { dni: string; dv: string } {
  const cleaned = rut.replace(/\./g, '').trim();
  const parts = cleaned.split('-');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw Object.assign(
      new Error('Formato de RUT inválido. Esperado: XXXXXXXX-X'),
      { code: 'VALIDATION_ERROR' },
    );
  }

  return { dni: parts[0], dv: parts[1].toUpperCase() };
}
