export interface DteDetalle {
  rutEmisor: number | null;
  dvEmisor: string | null;
  rznSocEmisor: string | null;
  codigoTipoDoc: number | null;
  descTipoDoc: string | null;
  periodo: string | null; // Formato YYYY-MM
  rutReceptor: number;
  dvReceptor: string;
  rznSocRecep: string;
  folio: number;
  fechaEmision: string; // Formato DD/MM/YYYY
  fechaEmisionA: string; // Formato YYYY/MM/DD
  fechaRecepcion: string;
  totalReparos: number | null;
  mntNeto: number;
  mntExento: number;
  mntIva: number;
  mntTotal: number;
  tasaImptoIVA: number;
  dehOrdenEvento: string;
  dehDescripcion: string;
  totOtrosImp: number | null;
  dhdrCodigo: number;
  rutFirmante: number | null;
  dvFirmante: string | null;
  idEnvio: number | null;
  dhdrEmiCorreo: string | null;
  dhdrEmiTelefono1: string | null;
  dehOrdenEventoPublicar: string | null;
  diasDiferenciaFchVencimiento: number | null;
  esPublicable: boolean | string | null;
  leyendaNoPub: string | null;
  diasDifFchRecep: number | null;
  fechaVencimiento: string | null;
  fechaRecepcionMas9Dias: string | null;
  dpuEliminacion: string | null;
  difFchPublicacion: number | null;
  difFchEliminacion: number | null;
  pub: string | null;
  despub: string | null;
  estadoPub: string | null;
  dpuFchPublicacion: string | null;
  derrCodigo: string | number | null;
  derrDescripcion: string | null;
  datosExpA: any | null; // Datos de exportación, estructura variable
  datosExpB1: any | null;
  datosExpB: any | null;
  dtimCodigo: number | null;
}

export interface GetDteDetailsResponse {
  data: any | null;
  dataResp: {
    detalles: DteDetalle[];
    totMntExe: number;
    totMntNeto: number;
    totMntIVA: number;
    totMntTotal: number;
  };
  dataReferencias: any | null;
  dataReferenciados: any | null;
  reparos: any | null;
  metaData: {
    conversationId: string | null;
    transactionId: string | null;
    namespace: string | null;
    info: any | null;
    errors: any[] | null;
    page: number | null;
  };
  detalleDte: any | null;
  impuestoAdicional: any | null;
  respEstado: {
    codRespuesta: number;
    msgeRespuesta: string | null;
    codError: number | string | null;
  };
}

export default GetDteDetailsResponse;
