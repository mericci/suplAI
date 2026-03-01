const baseUrl = 'https://www4.sii.cl/consemitidosinternetui';

const urls = {
  getResumen: `${baseUrl}/services/data/facadeService/getResumen`,
  getDetalleRecibidos: `${baseUrl}/services/data/facadeService/getDetalleRecibidos`,
  siiHome: `${baseUrl}/`,
  autInicio: 'https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi',
  misiirHome: 'https://misiir.sii.cl/cgi_misii/siihome.cgi',
};

const namespaces = {
  getResumen:
    'cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getResumen',
  getDetalleRecibidos:
    'cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getDetalleRecibidos',
};

export { urls, namespaces };
