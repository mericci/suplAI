import { namespaces, urls } from './config.ts';
import type { GetReceivedDteByPeriodResult } from './types/index.ts';
import { operations } from './constants/index.ts';

interface GetReceivedDteByPeriodParams {
  period: string; // YYYY-MM
  taxPayerDni: string;
  taxPayerDv: string;
  transactionId: string;
  siiToken: string;
  cookieString: string;
}

async function getReceivedDteByPeriod({
  period,
  taxPayerDni,
  taxPayerDv,
  transactionId,
  siiToken,
  cookieString,
}: GetReceivedDteByPeriodParams): Promise<GetReceivedDteByPeriodResult> {
  const body = {
    metaData: {
      namespace: namespaces.getResumen,
      conversationId: siiToken,
      transactionId: transactionId || new Date().getTime().toString(),
      page: null,
    },
    data: {
      periodo: period,
      rutContribuyente: taxPayerDni,
      dvContribuyente: taxPayerDv,
      operacion: operations.received,
    },
  };

  const response = await fetch(urls.getResumen, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const payload = json.data;
  const metadata = json.metaData;
  const items = (payload.resumenDte ?? []).map((item: unknown) => ({
    ...(item as object),
    metadata,
  }));

  return {
    resumenDte: items,
    datosAsync: payload.datosAsync ?? null,
  };
}

export default getReceivedDteByPeriod;
