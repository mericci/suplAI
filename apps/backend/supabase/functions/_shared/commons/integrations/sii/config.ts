const baseUrl = 'https://www4.sii.cl/consemitidosinternetui';

const urls = {
  getResumen: `${baseUrl}/services/data/facadeService/getResumen`,
  getDetalleRecibidos: `${baseUrl}/services/data/facadeService/getDetalleRecibidos`,
  siiHome: `${baseUrl}/`,
  autInicio: 'https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi',
  misiirHome: 'https://misiir.sii.cl/cgi_misii/siihome.cgi',
  // Candidate URLs for DTE XML download — tried in order until one returns 200 with content.
  // Update this list once the working URL is confirmed via probe or SII portal inspection.
  getDteXmlCandidates: [
    `${baseUrl}/services/data/facadeService/getDteXml`,
    `${baseUrl}/services/data/facadeService/getXmlDte`,
    `${baseUrl}/services/data/facadeService/getDteDocumento`,
  ] as string[],
};

const namespaces = {
  getResumen:
    'cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getResumen',
  getDetalleRecibidos:
    'cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getDetalleRecibidos',
  getDteXml:
    'cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getDteXml',
};

export { urls, namespaces };
