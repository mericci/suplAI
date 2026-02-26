import { AxiosInstance } from 'axios';
import { namespaces, urls } from './config';
import type { GetReceivedDteByPeriodResult } from './types';
import { operations } from './constants';

interface GetEmittedDteByPeriodParams {
  period: string; // YYYY-MM
  taxPayerDni: string;
  taxPayerDv: string;
  transactionId: string;
  siiToken: string;
  client: AxiosInstance;
}

async function getReceivedDteByPeriod({
  period,
  taxPayerDni,
  taxPayerDv,
  transactionId,
  siiToken,
  client,
}: GetEmittedDteByPeriodParams): Promise<GetReceivedDteByPeriodResult> {
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
  const payload = response.data.data;
  const metadata = response.data.metaData;
  const items = (payload.resumenDte ?? []).map((item) => ({
    ...item,
    metadata,
  }));

  return {
    resumenDte: items,
    datosAsync: payload.datosAsync ?? null,
  };
}

export default getReceivedDteByPeriod;
