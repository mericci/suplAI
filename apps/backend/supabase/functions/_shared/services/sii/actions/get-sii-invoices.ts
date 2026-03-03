import type { Invoice } from '../../../types/index.ts';
import {
  getReceivedDteByPeriod,
  getSiiSessionTokens,
} from '../../../commons/integrations/sii/index.ts';
import { createPeriods, mapSiiEventToStatus } from '../helpers/index.ts';
import getDteDetails from '../../../commons/integrations/sii/get-dte-details.ts';
import { operations } from '../../../commons/integrations/sii/constants/index.ts';
import { formatRut } from '../../invoices/helpers/format-rut.ts';
import { logger } from '../../../utils/logger.ts';

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
  const sessionTokens = await getSiiSessionTokens({
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
      transactionId: crypto.randomUUID(),
      siiToken: sessionTokens.siiToken,
      cookieString: sessionTokens.cookieString,
    });
    resumenDtes.push(...result.resumenDte);
  }

  const invoices: Invoice[] = [];
  for (const resumenDte of resumenDtes) {
    const dteDetails = await getDteDetails({
      cookieString: sessionTokens.cookieString,
      siiToken: sessionTokens.siiToken,
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
      logger.debug('SII DTE event fields', {
        folio: dteDetail.folio,
        dehOrdenEvento: dteDetail.dehOrdenEvento,
        dehDescripcion: dteDetail.dehDescripcion,
      });

      invoices.push({
        id: crypto.randomUUID(),
        provider: dteDetail.rznSocRecep,
        amount: dteDetail.mntTotal,
        netAmount: dteDetail.mntNeto,
        taxAmount: dteDetail.mntIva,
        grossAmount: dteDetail.mntTotal,
        period: resumenDte.periodo,
        documentType: resumenDte.tipoDocDesc,
        documentTypeNumber: resumenDte.tipoDoc,
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
