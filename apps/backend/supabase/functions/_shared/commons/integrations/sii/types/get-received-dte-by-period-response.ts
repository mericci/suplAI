export interface ResumenDte {
  tipoDoc: number;
  tipoDocDesc: string;
  totalDoc: number;
  mntExento: number;
  mntNeto: number;
  mntIVA: number;
  mntTotal: number;
  seccion: string;
  periodo: string;
  rut: number;
  dv: string;
  refNCD: number;
  totalDocNCD: number;
}

export interface GetReceivedDteByPeriodData {
  resumenDte: ResumenDte[];
  datosAsync: Record<string, unknown> | null;
}

export interface GetReceivedDteByPeriodMetaData {
  conversationId: string;
  transactionId: string;
  namespace: string;
  info: Record<string, unknown> | null;
  errors: Record<string, unknown> | null;
  page: Record<string, unknown> | null;
}

export interface RespEstado {
  codRespuesta: number;
  msgeRespuesta: string | null;
  codError: string | null;
}

export interface GetReceivedDteByPeriodResponse {
  data: GetReceivedDteByPeriodData;
  metaData: GetReceivedDteByPeriodMetaData;
  respEstado: RespEstado;
}

/** ResumenDte with response metadata attached */
export type ResumenDteWithMetadata = ResumenDte & {
  metadata: GetReceivedDteByPeriodMetaData;
};

/** Result of getReceivedDteByPeriod; each resumenDte item includes metadata */
export interface GetReceivedDteByPeriodResult {
  resumenDte: ResumenDteWithMetadata[];
  datosAsync: Record<string, unknown> | null;
}
