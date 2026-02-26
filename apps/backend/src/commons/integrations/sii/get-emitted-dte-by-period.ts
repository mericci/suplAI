import { AxiosInstance } from 'axios';
import { namespaces, urls } from './config';
import { operations } from './constants';

interface GetEmittedDteByPeriodParams {
  period: string; // YYYY-MM
  taxPayerDni: string;
  taxPayerDv: string;
  transactionId: string;
  siiToken: string;
  client: AxiosInstance;
}

async function getEmittedDteByPeriod({
  period,
  taxPayerDni,
  taxPayerDv,
  transactionId,
  siiToken,
  client,
}: GetEmittedDteByPeriodParams): Promise<unknown> {
  const metaData = {
    namespace: namespaces.getResumen,
    conversationId: siiToken,
    transactionId: transactionId || new Date().getTime().toString(),
    page: null,
  };

  const data = {
    periodo: period,
    rutContribuyente: taxPayerDni,
    dvContribuyente: taxPayerDv,
    operacion: operations.received,
  };

  const body = {
    metaData,
    data,
  };

  const response = await client.post(urls.getResumen, body);

  return response.data.data.resumenDte;
}

export default getEmittedDteByPeriod;
