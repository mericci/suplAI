/**
 * SII DTE Event Registration
 *
 * Registers a commercial acceptance (ACD) or rejection (RCD) event
 * for a DTE (invoice) with the SII SOAP endpoint.
 *
 * Event types:
 *   ACD — Acuse de Recibo y Conformidad (commercial acceptance)
 *   RCD — Reclamo de Contenido del DTE (commercial rejection)
 */

import axios from 'axios';

const REGISTRO_EVENTOS_URL =
  'https://www4.sii.cl/wsrpceconsultaws/services/RegistroEventos';

export type DteEventType = 'ACD' | 'RCD';

export interface RegisterDteEventParams {
  rutEmisor: string;
  dvEmisor: string;
  rutReceptor: string;
  dvReceptor: string;
  tipoDoc: number;
  folio: string;
  eventType: DteEventType;
  siiToken: string;
}

function buildSoapEnvelope(
  params: Omit<RegisterDteEventParams, 'siiToken'>,
): string {
  const { rutEmisor, dvEmisor, rutReceptor, dvReceptor, tipoDoc, folio, eventType } = params;
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="http://registroeventos.ws.sii.cl">
  <soapenv:Header/>
  <soapenv:Body>
    <reg:registrarEvento>
      <reg:rutEmisor>${rutEmisor}</reg:rutEmisor>
      <reg:dvEmisor>${dvEmisor}</reg:dvEmisor>
      <reg:rutReceptor>${rutReceptor}</reg:rutReceptor>
      <reg:dvReceptor>${dvReceptor}</reg:dvReceptor>
      <reg:tipoDoc>${tipoDoc}</reg:tipoDoc>
      <reg:folio>${folio}</reg:folio>
      <reg:codigoEvento>${eventType}</reg:codigoEvento>
    </reg:registrarEvento>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function registerDteEvent(
  params: RegisterDteEventParams,
): Promise<void> {
  const { siiToken, ...eventParams } = params;
  const soapBody = buildSoapEnvelope(eventParams);

  await axios.post<string>(REGISTRO_EVENTOS_URL, soapBody, {
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      SOAPAction: 'registrarEvento',
      Cookie: `TOKEN=${siiToken}`,
    },
    responseType: 'text',
  });
}
