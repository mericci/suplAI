import { AxiosInstance } from 'axios';
import { namespaces, urls } from './config';
import { GetDteDetailsResponse, Operation } from './types';

interface GetDteDetailsParams {
  client: AxiosInstance;
  period: string;
  taxPayerDni: string;
  taxPayerDv: string;
  operation: Operation;
  documentType: number;
  siiToken: string;
  transactionId: string;
}

async function getDteDetails({
  client,
  taxPayerDni,
  taxPayerDv,
  period,
  operation,
  documentType,
  siiToken,
  transactionId,
}: GetDteDetailsParams): Promise<GetDteDetailsResponse['dataResp']> {
  const metaData = {
    namespace: namespaces.getDetalleRecibidos,
    conversationId: siiToken,
    transactionId: transactionId || new Date().getTime().toString(),
    page: null,
  };

  const data = {
    derrCodigo: documentType,
    dv: taxPayerDv,
    operacion: operation,
    periodo: period,
    refNCD: '0',
    rut: taxPayerDni,
    tipoDoc: documentType,
  };

  const body = {
    metaData,
    data,
  };

  const response = await client.post(urls.getDetalleRecibidos, body);
  return response.data.dataResp;
}

export default getDteDetails;
