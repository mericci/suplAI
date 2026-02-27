import { randomUUID } from 'node:crypto';
import { Invoice } from '../../../types';
import {
  getReceivedDteByPeriod,
  getSiiSessionTokens,
} from '../../../commons/integrations/sii';
import { createPeriods, mapSiiEventToStatus } from '../helpers';
import getDteDetails from '../../../commons/integrations/sii/get-dte-details';
import { operations } from '../../../commons/integrations/sii/constants';
import { formatRut } from '../../invoices/helpers/format-rut.js';
import { logger } from '../../../utils/logger.js';

interface GetSiiInvoicesByPeriodParams {
  taxPayerDni: string;
  taxPayerDv: string;
  password: string;
  from: string;
  to?: string;
}

interface GetSiiInvoicesByPeriodResponse {
  invoices: Invoice[];
}

async function getSiiInvoices({
  taxPayerDni,
  taxPayerDv,
  password,
  from,
  to,
}: GetSiiInvoicesByPeriodParams): Promise<GetSiiInvoicesByPeriodResponse> {
  const sessionsTokens = await getSiiSessionTokens({
    taxPayerDni,
    taxPayerDv,
    password,
  });

  const periods = createPeriods(from, to);

  const resumenDtes = [];
  for (const period of periods) {
    const result = await getReceivedDteByPeriod({
      period,
      taxPayerDni,
      taxPayerDv,
      transactionId: randomUUID(),
      siiToken: sessionsTokens.siiToken,
      client: sessionsTokens.client,
    });
    resumenDtes.push(...result.resumenDte);
  }

  const invoices: Invoice[] = [];
  for (const resumenDte of resumenDtes) {
    const dteDetails = await getDteDetails({
      client: sessionsTokens.client,
      siiToken: sessionsTokens.siiToken,
      transactionId: resumenDte.metadata.transactionId,
      period: resumenDte.periodo,
      operation: operations.received,
      documentType: resumenDte.tipoDoc,
      taxPayerDni,
      taxPayerDv,
    });

    if (!dteDetails?.detalles) {
      logger.warn('No DTE details returned from SII', {
        period: resumenDte.periodo,
        documentType: resumenDte.tipoDoc,
      });
      continue;
    }

    for (const dteDetail of dteDetails.detalles) {
      // Temporary debug log — helps confirm exact dehDescripcion values from the live SII API.
      // Remove once the string match in mapSiiEventToStatus is validated against real data.
      logger.debug('SII DTE event fields', {
        folio: dteDetail.folio,
        dehOrdenEvento: dteDetail.dehOrdenEvento,
        dehDescripcion: dteDetail.dehDescripcion,
      });

      invoices.push({
        id: randomUUID(),
        provider: dteDetail.rznSocRecep,
        amount: dteDetail.mntTotal,
        netAmount: dteDetail.mntNeto,
        taxAmount: dteDetail.mntIva,
        grossAmount: dteDetail.mntTotal,
        period: resumenDte.periodo,
        documentType: resumenDte.tipoDocDesc,
        documentTypeCode: resumenDte.tipoDoc,
        status: mapSiiEventToStatus(dteDetail.dehDescripcion),
        issuerTaxIdentifier:
          dteDetail.rutEmisor != null && dteDetail.dvEmisor != null
            ? formatRut(dteDetail.rutEmisor, dteDetail.dvEmisor)
            : '',
        issuerName: dteDetail.rznSocEmisor ?? '',
        receiverTaxIdentifier: formatRut(
          dteDetail.rutReceptor,
          dteDetail.dvReceptor,
        ),
        receiverName: dteDetail.rznSocRecep,
        documentNumber: String(dteDetail.folio),
        issueDate: dteDetail.fechaEmisionA.replace(/\//g, '-'),
        dueDate: dteDetail.fechaVencimiento
          ? dteDetail.fechaVencimiento.replace(/\//g, '-')
          : null,
      });
    }
  }

  return { invoices };
}

export default getSiiInvoices;
