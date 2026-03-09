/**
 * SII QueryEventos — DTE Status Checker
 *
 * Queries the SII SOAP endpoint to determine the commercial acceptance status
 * of a DTE (invoice) based on its lifecycle events.
 *
 * Event codes:
 *   ACD / ERM / ATC → acceptance signals
 *   RCD / RFP / RFT → rejection/claim signals
 *
 * Status resolution:
 *   - Any claim code present → rejected
 *   - Acceptance code (ERM or ATC) present, no claims → approved
 *   - No events or only ACD → pending
 */

import axios from 'axios';

const QUERY_EVENTOS_URL =
  'https://www4.sii.cl/wsrpceconsultaws/services/QueryEventos';

const CLAIM_CODES = ['RCD', 'RFP', 'RFT'];
const ACCEPTANCE_CODES = ['ERM', 'ATC'];

export interface CheckDteStatusParams {
  rutEmisor: string; // RUT without DV (e.g. "12345678")
  dvEmisor: string; // Check digit (e.g. "9")
  tipoDoc: number; // document_type_number
  folio: string; // document_number
  siiToken: string;
}

export type CheckDteStatusResult = {
  status: 'approved' | 'rejected' | 'pending';
};

function buildSoapEnvelope(params: Omit<CheckDteStatusParams, 'siiToken'>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:con="http://consultaws.ws.sii.cl">
  <soapenv:Header/>
  <soapenv:Body>
    <con:listarEventosHistDoc>
      <con:rutEmisor>${params.rutEmisor}</con:rutEmisor>
      <con:dvEmisor>${params.dvEmisor}</con:dvEmisor>
      <con:tipoDoc>${params.tipoDoc}</con:tipoDoc>
      <con:folio>${params.folio}</con:folio>
    </con:listarEventosHistDoc>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function resolveStatus(eventCodes: string[]): CheckDteStatusResult['status'] {
  const hasClaim = eventCodes.some((code) => CLAIM_CODES.includes(code));
  if (hasClaim) return 'rejected';

  const hasAcceptance = eventCodes.some((code) => ACCEPTANCE_CODES.includes(code));
  if (hasAcceptance) return 'approved';

  return 'pending';
}

export async function checkDteStatus(
  params: CheckDteStatusParams,
): Promise<CheckDteStatusResult> {
  const { siiToken, ...dteParams } = params;
  const soapBody = buildSoapEnvelope(dteParams);

  const response = await axios.post<string>(QUERY_EVENTOS_URL, soapBody, {
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      SOAPAction: 'listarEventosHistDoc',
      Cookie: `TOKEN=${siiToken}`,
    },
    responseType: 'text',
  });

  const xml: string =
    typeof response.data === 'string' ? response.data : String(response.data);

  const matches = [...xml.matchAll(/<codEvento>([^<]+)<\/codEvento>/g)];
  const eventCodes = matches.map((m) => m[1].trim().toUpperCase());

  return { status: resolveStatus(eventCodes) };
}
