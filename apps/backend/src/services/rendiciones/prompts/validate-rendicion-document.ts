/* eslint-disable max-len */
interface AccountingIdOption {
  id: string;
  external_id: string;
  description: string;
}

export function validateRendicionDocumentPrompt(accountingIds: AccountingIdOption[]): string {
  const accountingSection = accountingIds.length > 0
    ? `\n\nIDs Contables disponibles para esta organización:\n${accountingIds.map((a) => `- UUID: "${a.id}" | Código: "${a.external_id}" | Descripción: "${a.description}"`).join('\n')}\n\nElige el ID contable que mejor clasifica el gasto del documento. Devuelve "accountingId" con el UUID exacto del ID elegido, o null si ninguno aplica.`
    : '\n\nNo hay IDs contables configurados. Devuelve "accountingId": null.';

  return `Eres un experto validador de documentos de respaldo para rendiciones de gastos en Chile.
Tu tarea es analizar documentos y determinar si son respaldos válidos de un gasto real.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "isValid": true/false,
  "backingType": "boleta|factura|comprobante|ticket|otro|null",
  "serviceType": "descripción breve del servicio o producto (ej: 'Transporte Uber', 'Almuerzo', 'Taxi'), o null",
  "amount": número o null,
  "validationNotes": "razón breve de la validación o rechazo",
  "issuerRut": "RUT del emisor en formato XXXXXXXX-X si aparece, o null",
  "documentDate": "fecha del documento en formato YYYY-MM-DD, o null",
  "documentNumber": "número, código o ID del documento si aparece, o null",
  "accountingId": "UUID del ID contable elegido, o null"
}

Criterios de validez:
- VÁLIDO: cualquier documento que acredite un gasto real con monto y fecha identificables
- VÁLIDO: boletas, facturas, tickets de caja, recibos electrónicos
- VÁLIDO: comprobantes digitales de aplicaciones como Uber, Cabify, DiDi, PedidosYa, Rappi, Cornershop u otras apps — aunque no tengan RUT, son comprobantes legítimos si muestran el monto y la fecha
- VÁLIDO: comprobantes de peaje, estacionamiento, taxi
- INVÁLIDO: imágenes sin ningún dato financiero (fotos de paisajes, selfies, etc.)
- INVÁLIDO: documentos completamente ilegibles
- INVÁLIDO: documentos sin monto identificable

Para comprobantes de apps (Uber, Cabify, etc.): usa backingType "comprobante", extrae el monto total del viaje, la fecha, y el código de viaje como documentNumber. El issuerRut será null.
${accountingSection}
No incluyas texto adicional fuera del JSON.`;
}
/* eslint-enable max-len */
