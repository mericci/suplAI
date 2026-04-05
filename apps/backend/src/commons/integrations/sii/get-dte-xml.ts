/**
 * Get DTE XML from SII
 *
 * Fetches the raw DTE XML document for a specific invoice from SII's portal.
 * Tries multiple candidate endpoints in order, since SII does not document a
 * public XML download API. Returns null if none of the candidates succeed.
 *
 * The request body follows the same metaData/data structure as getDteDetails.
 */

import { AxiosInstance } from 'axios';
import { namespaces, urls } from './config.js';
import { logger } from '../../../utils/logger.js';

interface GetDteXmlParams {
  client: AxiosInstance;
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
    client,
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

  for (const candidateUrl of urls.getDteXmlCandidates) {
    try {
      const response = await client.post(candidateUrl, body, {
        validateStatus: () => true,
      });

      if (response.status < 200 || response.status >= 300) {
        logger.debug('getDteXml candidate returned non-200', {
          url: candidateUrl,
          status: response.status,
          folio: documentNumber,
          tipoDoc: documentTypeNumber,
        });
        continue;
      }

      const contentType: string = response.headers['content-type'] ?? '';
      const responseData: unknown = response.data;

      // Direct XML response (Axios may have already parsed it as string)
      if (contentType.includes('xml') || (typeof responseData === 'string' && responseData.trim().startsWith('<'))) {
        const xml = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        logger.info('getDteXml: found working XML endpoint', { url: candidateUrl });
        return xml;
      }

      // JSON envelope response
      if (typeof responseData === 'object' && responseData !== null) {
        const data = (
          (responseData as Record<string, unknown>).data ??
          (responseData as Record<string, unknown>).dataResp ??
          {}
        ) as Record<string, unknown>;

        if (typeof data.xml === 'string' && data.xml.trim().startsWith('<')) {
          logger.info('getDteXml: found working XML endpoint (JSON envelope)', { url: candidateUrl });
          return data.xml;
        }

        if (typeof data.xmlBase64 === 'string') {
          const decoded = Buffer.from(data.xmlBase64, 'base64').toString('utf-8');
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
