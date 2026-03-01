import { namespaces, urls } from './config.ts';
import { operations } from './constants/index.ts';

interface GetEmittedDteByPeriodParams {
  period: string; // YYYY-MM
  taxPayerDni: string;
  taxPayerDv: string;
  transactionId: string;
  siiToken: string;
  cookieString: string;
}

async function getEmittedDteByPeriod({
  period,
  taxPayerDni,
  taxPayerDv,
  transactionId,
  siiToken,
  cookieString,
}: GetEmittedDteByPeriodParams): Promise<unknown> {
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
  return json.data.resumenDte;
}

export default getEmittedDteByPeriod;
