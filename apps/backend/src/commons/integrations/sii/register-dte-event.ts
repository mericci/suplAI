import type { AxiosInstance } from 'axios';

export type DteAction = 'ACD' | 'RCD';

interface RegisterDteEventParams {
  client: AxiosInstance;
  siiToken: string;
  rutEmisor: number;
  dvEmisor: string;
  tipoDoc: number;
  folio: number;
  accionDoc: DteAction;
}

// Certification env — switch to production when ready:
// https://ws1.sii.cl/WSREGISTRORECLAMODTE/registroreclamodteservice
const SII_SOAP_URL =
  'https://ws2.sii.cl/WSREGISTRORECLAMODTECERT/registroreclamodteservice';

/**
 * Calls ingresarAceptacionReclamoDoc on the WSREGISTRORECLAMODTE SOAP service.
 * Registers an ACD (Aceptación de Contenido del DTE) or RCD (Reclamo al Contenido del DTE)
 * on behalf of the receiver organisation.
 * Throws on HTTP error or SOAP fault.
 */
async function registerDteEvent(
  params: RegisterDteEventParams,
): Promise<void> {
  const soapBody = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ws="http://ws.registroreclamodte.diii.sdi.sii.cl">
    <soapenv:Header/>
    <soapenv:Body>
      <ws:ingresarAceptacionReclamoDoc>
        <rutEmisor>${params.rutEmisor}</rutEmisor>
        <dvEmisor>${params.dvEmisor}</dvEmisor>
        <tipoDoc>${params.tipoDoc}</tipoDoc>
        <folio>${params.folio}</folio>
        <accionDoc>${params.accionDoc}</accionDoc>
      </ws:ingresarAceptacionReclamoDoc>
    </soapenv:Body>
  </soapenv:Envelope>`.trim();

  await params.client.post(SII_SOAP_URL, soapBody, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'ingresarAceptacionReclamoDoc',
      Cookie: `TOKEN=${params.siiToken}`,
    },
  });
}

export default registerDteEvent;
