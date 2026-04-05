/**
 * Get DTE XML from SII
 *
 * Fetches the raw DTE XML document for a specific invoice from SII's portal.
 * Tries multiple candidate endpoints in order, since SII does not document a
 * public XML download API. Returns null if none of the candidates succeed.
 *
 * The request body follows the same metaData/data structure as getDteDetails.
 */

import { namespaces, urls } from './config.ts';
import { logger } from '../../../utils/logger.ts';

interface GetDteXmlParams {
  cookieString: string;
  siiToken: string;
  /** Receiver's RUT digits (no DV, no dots) — the organization querying SII */
  taxPayerDni: string;
  taxPayerDv: string;
  /** Issuer's RUT digits (no DV, no dots) — the supplier who issued the DTE */
  issuerDni: string;
  issuerDv: string;
  documentTypeNumber: number;
  documentNumber: string;
}

async function getDteXml(params: GetDteXmlParams): Promise<string | null> {
  const {
    cookieString,
    siiToken,
    taxPayerDni,
    taxPayerDv,
    issuerDni,
    issuerDv,
    documentTypeNumber,
    documentNumber,
  } = params;

  const body = {
    metaData: {
      namespace: namespaces.getDteXml,
      conversationId: siiToken,
      transactionId: new Date().getTime().toString(),
      page: null,
    },
    data: {
      rut: taxPayerDni,
      dv: taxPayerDv,
      rutEmisor: issuerDni,
      dvEmisor: issuerDv,
      tipoDoc: documentTypeNumber,
      folio: documentNumber,
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookieString,
  };

  for (const candidateUrl of urls.getDteXmlCandidates) {
    try {
      const response = await fetch(candidateUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.debug('getDteXml candidate returned non-200', {
          url: candidateUrl,
          status: response.status,
          folio: documentNumber,
          tipoDoc: documentTypeNumber,
        });
        continue;
      }

      const contentType = response.headers.get('content-type') ?? '';

      // Direct XML response
      if (contentType.includes('xml')) {
        const xml = await response.text();
        if (xml.trim().startsWith('<')) {
          logger.info('getDteXml: found working XML endpoint', { url: candidateUrl });
          return xml;
        }
      }

      // JSON envelope response — check for xml or xmlBase64 fields
      if (contentType.includes('json')) {
        const json = await response.json() as Record<string, unknown>;
        const data = (json.data ?? json.dataResp ?? {}) as Record<string, unknown>;

        if (typeof data.xml === 'string' && data.xml.trim().startsWith('<')) {
          logger.info('getDteXml: found working XML endpoint (JSON envelope)', { url: candidateUrl });
          return data.xml;
        }

        if (typeof data.xmlBase64 === 'string') {
          const decoded = atob(data.xmlBase64);
          logger.info('getDteXml: found working XML endpoint (Base64 envelope)', { url: candidateUrl });
          return decoded;
        }

        logger.debug('getDteXml candidate returned JSON but no xml field', {
          url: candidateUrl,
          keys: Object.keys(data),
          folio: documentNumber,
        });
      }
    } catch (err) {
      logger.debug('getDteXml candidate threw', {
        url: candidateUrl,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return null;
}

export default getDteXml;
