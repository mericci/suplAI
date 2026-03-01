import { namespaces, urls } from './config.ts';
import type { GetDteDetailsResponse, Operation } from './types/index.ts';

interface GetDteDetailsParams {
  cookieString: string;
  period: string;
  taxPayerDni: string;
  taxPayerDv: string;
  operation: Operation;
  documentType: number;
  siiToken: string;
  transactionId: string;
}

async function getDteDetails({
  cookieString,
  taxPayerDni,
  taxPayerDv,
  period,
  operation,
  documentType,
  siiToken,
  transactionId,
}: GetDteDetailsParams): Promise<GetDteDetailsResponse['dataResp']> {
  const body = {
    metaData: {
      namespace: namespaces.getDetalleRecibidos,
      conversationId: siiToken,
      transactionId: transactionId || new Date().getTime().toString(),
      page: null,
    },
    data: {
      derrCodigo: documentType,
      dv: taxPayerDv,
      operacion: operation,
      periodo: period,
      refNCD: '0',
      rut: taxPayerDni,
      tipoDoc: documentType,
    },
  };

  const response = await fetch(urls.getDetalleRecibidos, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  return json.dataResp;
}

export default getDteDetails;
