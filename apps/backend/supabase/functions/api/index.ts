// src/utils/response.ts
function successResponse(data, message, status = 200 /* OK */) {
  const body = {
    success: true,
    data,
    message
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
function errorResponse(error, status = 400 /* BAD_REQUEST */, details) {
  const body = {
    success: false,
    error,
    ...details && { details }
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
function validationError(message, fields) {
  return errorResponse(message, 422 /* UNPROCESSABLE_ENTITY */, fields);
}
function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401 /* UNAUTHORIZED */);
}
function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404 /* NOT_FOUND */);
}
function serverError(message = "Internal server error") {
  return errorResponse(message, 500 /* INTERNAL_SERVER_ERROR */);
}

// src/utils/logger.ts
function filterSensitiveData(data) {
  const sensitiveKeys = [
    "password",
    "token",
    "apiKey",
    "secret",
    "authorization"
  ];
  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        acc[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        acc[key] = filterSensitiveData(value);
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
}
function log(level, message, context) {
  const logEntry = {
    level,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...context
  };
  const filtered = filterSensitiveData(logEntry);
  console.log(JSON.stringify(filtered));
}
var logger = {
  debug: (msg, ctx) => log("debug" /* DEBUG */, msg, ctx),
  info: (msg, ctx) => log("info" /* INFO */, msg, ctx),
  warn: (msg, ctx) => log("warn" /* WARN */, msg, ctx),
  error: (msg, ctx) => log("error" /* ERROR */, msg, ctx)
};

// src/utils/error.ts
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Unknown error occurred";
}

// src/lib/router.ts
var Router = class {
  constructor() {
    this.routes = [];
    this.corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
    };
  }
  /**
   * Register a route
   */
  addRoute(method, path, handler) {
    const pathParams = [];
    const pattern = path.replace(/:([^/]+)/g, (_, param) => {
      pathParams.push(param);
      return "([^/]+)";
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      handler,
      pathParams
    });
  }
  /**
   * HTTP method helpers
   */
  get(path, handler) {
    this.addRoute("GET", path, handler);
  }
  post(path, handler) {
    this.addRoute("POST", path, handler);
  }
  put(path, handler) {
    this.addRoute("PUT", path, handler);
  }
  patch(path, handler) {
    this.addRoute("PATCH", path, handler);
  }
  delete(path, handler) {
    this.addRoute("DELETE", path, handler);
  }
  /**
   * Handle incoming requests
   */
  async handle(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: this.corsHeaders
      });
    }
    const url = new URL(req.url);
    const { pathname } = url;
    logger.info("Incoming request", {
      method: req.method,
      path: pathname
    });
    const route = this.routes.find(
      (r) => r.method === req.method && pathname.match(r.pattern)
    );
    if (route) {
      try {
        const response = await route.handler(req);
        const headers = new Headers(response.headers);
        Object.entries(this.corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (error) {
        logger.error("Handler error", {
          method: req.method,
          path: pathname,
          error: getErrorMessage(error)
        });
        return this.addCorsHeaders(
          errorResponse(
            "Internal server error",
            500 /* INTERNAL_SERVER_ERROR */
          )
        );
      }
    }
    logger.warn("Route not found", { method: req.method, path: pathname });
    return this.addCorsHeaders(notFoundResponse("Route"));
  }
  /**
   * Add CORS headers to a response
   */
  addCorsHeaders(response) {
    const headers = new Headers(response.headers);
    Object.entries(this.corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};

// src/services/test/actions/hello-world.ts
function helloWorld(name) {
  logger.info("Hello World action called", { name });
  const greeting = name ? `Hello, ${name}!` : "Hello, World!";
  return {
    message: greeting,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV ?? "development"
  };
}

// src/services/test/handlers/hello-world.ts
function helloWorld2(name) {
  return helloWorld(name);
}

// src/services/test/http/hello-world.ts
async function helloWorldHandler(req) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name") ?? void 0;
    const result = helloWorld2(name);
    return Promise.resolve(successResponse(result));
  } catch (error) {
    return Promise.resolve(serverError(getErrorMessage(error)));
  }
}

// src/services/test/http/ping.ts
async function pingHandler(_req) {
  return Promise.resolve(
    successResponse({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })
  );
}

// src/services/test/routes.ts
function registerTestRoutes(router2) {
  router2.get("/api/test/hello", helloWorldHandler);
  router2.get("/api/test/ping", pingHandler);
}

// src/services/sii/actions/get-sii-invoices.ts
import { randomUUID } from "node:crypto";

// src/commons/integrations/sii/config.ts
var baseUrl = "https://www4.sii.cl/consemitidosinternetui";
var urls = {
  getResumen: `${baseUrl}/services/data/facadeService/getResumen`,
  getDetalleRecibidos: `${baseUrl}/services/data/facadeService/getDetalleRecibidos`,
  siiHome: `${baseUrl}/`,
  autInicio: "https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi",
  misiirHome: "https://misiir.sii.cl/cgi_misii/siihome.cgi"
};
var namespaces = {
  getResumen: "cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getResumen",
  getDetalleRecibidos: "cl.sii.sdi.lob.diii.consemitidos.data.api.interfaces.FacadeService/getDetalleRecibidos"
};

// src/commons/integrations/sii/constants/operations.ts
var operations = {
  emitted: 1,
  received: 2
};
var operations_default = operations;

// src/commons/integrations/sii/get-received-dte-by-period.ts
async function getReceivedDteByPeriod({
  period,
  taxPayerDni,
  taxPayerDv,
  transactionId,
  siiToken,
  client
}) {
  const metaData = {
    namespace: namespaces.getResumen,
    conversationId: siiToken,
    transactionId: transactionId || (/* @__PURE__ */ new Date()).getTime().toString(),
    page: null
  };
  const data = {
    periodo: period,
    rutContribuyente: taxPayerDni,
    dvContribuyente: taxPayerDv,
    operacion: operations_default.received
  };
  const body = {
    metaData,
    data
  };
  const response = await client.post(urls.getResumen, body);
  const payload = response.data.data;
  const metadata = response.data.metaData;
  const items = (payload.resumenDte ?? []).map((item) => ({
    ...item,
    metadata
  }));
  return {
    resumenDte: items,
    datosAsync: payload.datosAsync ?? null
  };
}
var get_received_dte_by_period_default = getReceivedDteByPeriod;

// src/commons/integrations/sii/get-session-tokens.ts
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
var LOGIN_PAGE_URL = "https://zeusr.sii.cl//AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi";
var AUTH_POST_URL = "https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi";
var BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "es-ES,es;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Cache-Control": "max-age=0",
  "Upgrade-Insecure-Requests": "1"
};
async function getSessionTokens({
  taxPayerDni,
  taxPayerDv,
  password
}) {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({ jar, withCredentials: true, maxRedirects: 5 })
  );
  await client.get(LOGIN_PAGE_URL, {
    headers: {
      ...BROWSER_HEADERS,
      Host: "zeusr.sii.cl",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1"
    }
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 800);
  });
  const rutcntr = `${taxPayerDni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${taxPayerDv}`;
  const payload = new URLSearchParams({
    rut: taxPayerDni,
    dv: taxPayerDv,
    referencia: "https://misiir.sii.cl/cgi_misii/siihome.cgi",
    "411": "",
    rutcntr,
    clave: password
  }).toString();
  const loginResponse = await client.post(AUTH_POST_URL, payload, {
    headers: {
      ...BROWSER_HEADERS,
      Host: "zeusr.sii.cl",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://zeusr.sii.cl",
      Referer: LOGIN_PAGE_URL,
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1"
    }
  });
  const loginHtml = loginResponse.data;
  if (loginHtml.includes("Transaccion Rechazada")) {
    const errorId = loginHtml.match(/ID:\s*(\d+)/)?.[1] ?? "Desconocido";
    throw new Error(`Rechazo CT del SII (ID: ${errorId}).`);
  }
  await client.get("https://misiir.sii.cl/cgi_misii/siihome.cgi", {
    headers: {
      ...BROWSER_HEADERS,
      Host: "misiir.sii.cl",
      Referer: "https://zeusr.sii.cl/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-site"
    }
  });
  await client.get("https://www4.sii.cl/consemitidosinternetui/", {
    headers: {
      ...BROWSER_HEADERS,
      Host: "www4.sii.cl",
      Referer: "https://misiir.sii.cl/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-site"
    }
  }).catch(() => {
  });
  const allCookies = [
    ...await jar.getCookies("https://sii.cl"),
    ...await jar.getCookies("https://misiir.sii.cl"),
    ...await jar.getCookies("https://www4.sii.cl"),
    ...await jar.getCookies("https://zeusr.sii.cl")
  ];
  const tokenCookie = allCookies.find((c) => c.key === "TOKEN");
  if (!tokenCookie) {
    throw new Error("TOKEN no encontrado tras autenticaci\xF3n.");
  }
  return { siiToken: tokenCookie.value, client };
}
var get_session_tokens_default = getSessionTokens;

// src/commons/integrations/sii/register-dte-event.ts
var SII_SOAP_URL = "https://ws2.sii.cl/WSREGISTRORECLAMODTECERT/registroreclamodteservice";
async function registerDteEvent(params) {
  const soapBody = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ws="http://ws.registroreclamodte.diii.sdi.sii.cl">
    <soapenv:Header/>
    <soapenv:Body>
      <ws:ingresarAceptacionReclamoDoc>
        <rutEmisor>${params.rutEmisor}</rutEmisor>
        <dvEmisor>${params.dvEmisor}</dvEmisor>
        <tipoDoc>${params.tipoDoc}</tipoDoc>
        <folio>${params.folio}</folio>
        <accionDoc>${params.accionDoc}</accionDoc>
      </ws:ingresarAceptacionReclamoDoc>
    </soapenv:Body>
  </soapenv:Envelope>`.trim();
  await params.client.post(SII_SOAP_URL, soapBody, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "ingresarAceptacionReclamoDoc",
      Cookie: `TOKEN=${params.siiToken}`
    }
  });
}
var register_dte_event_default = registerDteEvent;

// src/services/sii/helpers/create-periods.ts
var PERIOD_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;
function parsePeriod(period) {
  if (!PERIOD_FORMAT.test(period)) {
    throw new Error(`Invalid period format: expected YYYY-MM, got "${period}"`);
  }
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m };
}
function periodToString(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
function createPeriods(from, to) {
  const start = parsePeriod(from);
  const now = /* @__PURE__ */ new Date();
  const end = to !== void 0 ? parsePeriod(to) : { year: now.getFullYear(), month: now.getMonth() + 1 };
  let { year } = start;
  let { month } = start;
  const result = [];
  while (year < end.year || year === end.year && month <= end.month) {
    result.push(periodToString(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}
var create_periods_default = createPeriods;

// src/services/sii/helpers/index.ts
function mapSiiEventToStatus(dehDescripcion) {
  if (!dehDescripcion) return "pending";
  if (dehDescripcion.toLowerCase().includes("reclamo")) return "rejected";
  return "pending";
}

// src/commons/integrations/sii/get-dte-details.ts
async function getDteDetails({
  client,
  taxPayerDni,
  taxPayerDv,
  period,
  operation,
  documentType,
  siiToken,
  transactionId
}) {
  const metaData = {
    namespace: namespaces.getDetalleRecibidos,
    conversationId: siiToken,
    transactionId: transactionId || (/* @__PURE__ */ new Date()).getTime().toString(),
    page: null
  };
  const data = {
    derrCodigo: documentType,
    dv: taxPayerDv,
    operacion: operation,
    periodo: period,
    refNCD: "0",
    rut: taxPayerDni,
    tipoDoc: documentType
  };
  const body = {
    metaData,
    data
  };
  const response = await client.post(urls.getDetalleRecibidos, body);
  return response.data.dataResp;
}
var get_dte_details_default = getDteDetails;

// src/services/invoices/helpers/format-rut.ts
function formatRut(dni, dv) {
  return `${dni}-${dv}`;
}

// src/services/sii/actions/get-sii-invoices.ts
async function getSiiInvoices({
  taxPayerDni,
  taxPayerDv,
  password,
  from,
  to
}) {
  const sessionsTokens = await get_session_tokens_default({
    taxPayerDni,
    taxPayerDv,
    password
  });
  const periods = create_periods_default(from, to);
  const resumenDtes = [];
  for (const period of periods) {
    const result = await get_received_dte_by_period_default({
      period,
      taxPayerDni,
      taxPayerDv,
      transactionId: randomUUID(),
      siiToken: sessionsTokens.siiToken,
      client: sessionsTokens.client
    });
    resumenDtes.push(...result.resumenDte);
  }
  const invoices = [];
  for (const resumenDte of resumenDtes) {
    const dteDetails = await get_dte_details_default({
      client: sessionsTokens.client,
      siiToken: sessionsTokens.siiToken,
      transactionId: resumenDte.metadata.transactionId,
      period: resumenDte.periodo,
      operation: operations_default.received,
      documentType: resumenDte.tipoDoc,
      taxPayerDni,
      taxPayerDv
    });
    if (!dteDetails?.detalles) {
      logger.warn("No DTE details returned from SII", {
        period: resumenDte.periodo,
        documentType: resumenDte.tipoDoc
      });
      continue;
    }
    for (const dteDetail of dteDetails.detalles) {
      logger.debug("SII DTE event fields", {
        folio: dteDetail.folio,
        dehOrdenEvento: dteDetail.dehOrdenEvento,
        dehDescripcion: dteDetail.dehDescripcion
      });
      invoices.push({
        id: randomUUID(),
        provider: dteDetail.rznSocRecep,
        amount: dteDetail.mntTotal,
        netAmount: dteDetail.mntNeto,
        taxAmount: dteDetail.mntIva,
        grossAmount: dteDetail.mntTotal,
        period: resumenDte.periodo,
        documentType: resumenDte.tipoDocDesc,
        documentTypeCode: resumenDte.tipoDoc,
        status: mapSiiEventToStatus(dteDetail.dehDescripcion),
        issuerTaxIdentifier: dteDetail.rutEmisor != null && dteDetail.dvEmisor != null ? formatRut(dteDetail.rutEmisor, dteDetail.dvEmisor) : "",
        issuerName: dteDetail.rznSocEmisor ?? "",
        receiverTaxIdentifier: formatRut(
          dteDetail.rutReceptor,
          dteDetail.dvReceptor
        ),
        receiverName: dteDetail.rznSocRecep,
        documentNumber: String(dteDetail.folio),
        issueDate: dteDetail.fechaEmisionA.replace(/\//g, "-"),
        dueDate: dteDetail.fechaVencimiento ? dteDetail.fechaVencimiento.replace(/\//g, "-") : null
      });
    }
  }
  return { invoices };
}
var get_sii_invoices_default = getSiiInvoices;

// src/services/sii/handlers/get-sii-invoices.ts
async function getSiiInvoices2(params) {
  return get_sii_invoices_default(params);
}

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
var missing = requiredEnvVars.find((envVar) => !process.env[envVar]);
if (missing) {
  throw new Error(`Missing required environment variable: ${missing}`);
}
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_ANON_KEY;
var supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// src/db/user.db.ts
async function findById(userId) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findByIdInOrganization(userId, organizationId) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).eq("organization_id", organizationId).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findByEmail(email) {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function create(userData) {
  const { data, error } = await supabase.from("users").insert(userData).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}
async function update(userId, updates) {
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).is("deleted_at", null).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}
async function softDeleteById(userId) {
  const { error } = await supabase.from("users").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", userId).is("deleted_at", null);
  if (error) throw new Error(`Database error: ${error.message}`);
}
async function findAllByOrganization(organizationId, limit, offset) {
  const { count, error: countError } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null);
  if (countError) throw new Error(`Database error: ${countError.message}`);
  const { data, error } = await supabase.from("users").select("*").eq("organization_id", organizationId).is("deleted_at", null).range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new Error(`Database error: ${error.message}`);
  return {
    users: data ?? [],
    total: count ?? 0
  };
}

// src/db/organization.db.ts
async function findById2(id) {
  const { data, error } = await supabase.from("organizations").select("*").eq("id", id).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findByTaxIdentifier(taxIdentifier) {
  const { data, error } = await supabase.from("organizations").select("*").eq("tax_identifier", taxIdentifier).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function create2(data) {
  const { data: org, error } = await supabase.from("organizations").insert(data).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return org;
}
async function update2(id, data) {
  const { data: org, error } = await supabase.from("organizations").update(data).eq("id", id).is("deleted_at", null).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return org;
}
async function softDeleteById2(id) {
  const { error } = await supabase.from("organizations").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(`Database error: ${error.message}`);
}
async function findAll(limit, offset, search) {
  let countQuery = supabase.from("organizations").select("*", { count: "exact", head: true }).is("deleted_at", null);
  let dataQuery = supabase.from("organizations").select("*").is("deleted_at", null);
  if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
  }
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);
  const { data, error } = await dataQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new Error(`Database error: ${error.message}`);
  return {
    organizations: data ?? [],
    total: count ?? 0
  };
}

// src/commons/encryption/index.ts
import crypto from "node:crypto";
var ALGORITHM = "aes-256-gcm";
var KEY_BYTES = 32;
var IV_BYTES = 16;
var SEPARATOR = ":";
function getMasterKey() {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error(
      "Missing required environment variable: ENCRYPTION_MASTER_KEY"
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes / 256 bits). Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return key;
}
function encrypt(plaintext) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64")
  ].join(SEPARATOR);
}
function decrypt(ciphertext) {
  const key = getMasterKey();
  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error(
      "Invalid ciphertext format. Expected: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>"
    );
  }
  const [ivB64, authTagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}

// src/services/sii/helpers/parse-rut.ts
function parseChileanRut(rut) {
  const cleaned = rut.replace(/\./g, "").trim();
  const parts = cleaned.split("-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw Object.assign(
      new Error("Formato de RUT inv\xE1lido. Esperado: XXXXXXXX-X"),
      { code: "VALIDATION_ERROR" }
    );
  }
  return { dni: parts[0], dv: parts[1].toUpperCase() };
}

// src/services/sii/actions/get-my-org-sii-invoices.ts
async function getMyOrgSiiInvoices({
  email,
  from,
  to
}) {
  const user = await findByEmail(email);
  if (!user) {
    throw Object.assign(new Error("User not found"), { code: "NOT_FOUND" });
  }
  const org = await findById2(user.organization_id);
  if (!org) {
    throw Object.assign(new Error("Organization not found"), {
      code: "NOT_FOUND"
    });
  }
  if (!org.tax_authority_password_enc) {
    throw Object.assign(
      new Error("Organization has no SII credentials configured"),
      { code: "CONFIGURATION_ERROR" }
    );
  }
  const password = decrypt(org.tax_authority_password_enc);
  const { dni, dv } = parseChileanRut(org.tax_identifier);
  return get_sii_invoices_default({
    taxPayerDni: dni,
    taxPayerDv: dv,
    password,
    from,
    to
  });
}

// src/services/sii/handlers/get-my-org-sii-invoices.ts
async function getMyOrgSiiInvoices2(params) {
  return getMyOrgSiiInvoices(params);
}

// src/utils/validation.ts
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPassword(password) {
  if (password.length < 8) {
    return false;
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
}
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
function validateRequiredFields(data, requiredFields) {
  const missing2 = requiredFields.filter(
    (field) => data[field] === void 0 || data[field] === null || data[field] === ""
  );
  return {
    valid: missing2.length === 0,
    missing: missing2
  };
}

// src/services/sii/http/get-sii-invoices.ts
var PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidPeriod(value) {
  return typeof value === "string" && PERIOD_REGEX.test(value);
}
async function getSiiInvoicesHandler(req) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const taxPayerDni = params.get("taxPayerDni");
    const taxPayerDv = params.get("taxPayerDv");
    const password = params.get("password");
    const from = params.get("from");
    const to = params.get("to");
    const bodyObj = {
      taxPayerDni: taxPayerDni ?? void 0,
      taxPayerDv: taxPayerDv ?? void 0,
      password: password ?? void 0,
      from: from ?? void 0,
      to: to ?? void 0
    };
    const validation = validateRequiredFields(bodyObj, [
      "taxPayerDni",
      "taxPayerDv",
      "password",
      "from"
    ]);
    if (!validation.valid) {
      return validationError("Missing required query params", {
        missing: validation.missing.join(", ")
      });
    }
    if (!isValidPeriod(from)) {
      return validationError("from must be a period in YYYY-MM format");
    }
    if (to !== void 0 && to !== null && to !== "" && !isValidPeriod(to)) {
      return validationError("to must be a period in YYYY-MM format");
    }
    const result = await getSiiInvoices2({
      taxPayerDni,
      taxPayerDv,
      password,
      from,
      to: to && to !== "" ? to : void 0
    });
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/sii/http/get-my-org-sii-invoices.ts
var PERIOD_REGEX2 = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidPeriod2(value) {
  return typeof value === "string" && PERIOD_REGEX2.test(value);
}
async function getMyOrgSiiInvoicesHandler(req, context) {
  try {
    if (!context.email) {
      return serverError("User email not available in token");
    }
    const url = new URL(req.url);
    const params = url.searchParams;
    const from = params.get("from");
    const to = params.get("to");
    if (!from) {
      return validationError("Missing required query param: from");
    }
    if (!isValidPeriod2(from)) {
      return validationError("from must be a period in YYYY-MM format");
    }
    if (to !== null && to !== "" && !isValidPeriod2(to)) {
      return validationError("to must be a period in YYYY-MM format");
    }
    const result = await getMyOrgSiiInvoices2({
      email: context.email,
      from,
      to: to && to !== "" ? to : void 0
    });
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/auth/middleware.ts
function extractToken(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1] ?? null;
}
async function authenticate(req) {
  const token = extractToken(req);
  if (!token) {
    return null;
  }
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);
    if (error ?? !user) {
      logger.warn("Invalid authentication token");
      return null;
    }
    return {
      userId: user.id,
      email: user.email ?? void 0,
      role: user.role ?? void 0
    };
  } catch (error) {
    logger.error("Authentication error", { error: getErrorMessage(error) });
    return null;
  }
}
function requireAuth(handler) {
  return async (req) => {
    const context = await authenticate(req);
    if (!context) {
      return unauthorizedResponse();
    }
    return handler(req, context);
  };
}

// src/services/sii/routes.ts
function registerSiiRoutes(router2) {
  router2.get(
    "/api/sii/invoices/me",
    requireAuth(async (req, ctx) => getMyOrgSiiInvoicesHandler(req, ctx))
  );
  router2.get("/api/sii/invoices", getSiiInvoicesHandler);
}

// src/db/schemas/user.schema.ts
import { z } from "zod";
var UserStatusEnum = z.enum([
  "active",
  "inactive",
  "suspended",
  "deleted"
]);
var UserRoleEnum = z.enum([
  "admin",
  "standard",
  "moderator",
  "super_admin"
]);
var BaseUserSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  firstName: z.string().min(1, "First name is required").max(100, "First name must not exceed 100 characters").trim().optional(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must not exceed 100 characters").trim().optional(),
  // Legacy field — kept for backward compatibility
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must not exceed 100 characters").trim().optional(),
  organizationId: z.string().uuid("Invalid organization ID").optional().nullable(),
  avatar_url: z.string().url("Invalid URL format").optional().nullable(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional().nullable(),
  role: UserRoleEnum.default("standard"),
  status: UserStatusEnum.default("active"),
  metadata: z.record(z.unknown()).optional().nullable()
});
var CreateUserSchema = BaseUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").optional()
});
var UpdateUserSchema = BaseUserSchema.partial().extend({
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").optional()
});
var UserQuerySchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: UserStatusEnum.optional(),
  role: UserRoleEnum.optional()
});
var UserListFiltersSchema = z.object({
  status: UserStatusEnum.optional(),
  role: UserRoleEnum.optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10)
});
function validateCreateUser(data) {
  return CreateUserSchema.parse(data);
}
function validateUpdateUser(data) {
  return UpdateUserSchema.parse(data);
}

// src/db/schemas/organization.schema.ts
import { z as z2 } from "zod";
var CreateOrganizationSchema = z2.object({
  legalName: z2.string().min(2, "Legal name must be at least 2 characters").max(200, "Legal name must not exceed 200 characters").trim(),
  taxIdentifier: z2.string().min(1, "Tax identifier is required").max(50, "Tax identifier must not exceed 50 characters").trim(),
  taxAuthorityUsername: z2.string().max(200).trim().optional().nullable(),
  // Plain text password — encrypted by the action layer before storage.
  taxAuthorityPassword: z2.string().min(1).optional().nullable()
});
var UpdateOrganizationSchema = CreateOrganizationSchema.partial();
var OrganizationListFiltersSchema = z2.object({
  search: z2.string().optional(),
  page: z2.number().int().positive().default(1),
  limit: z2.number().int().positive().max(100).default(10)
});
function validateCreateOrganization(data) {
  return CreateOrganizationSchema.parse(data);
}
function validateUpdateOrganization(data) {
  return UpdateOrganizationSchema.parse(data);
}
function validateOrganizationListFilters(data) {
  return OrganizationListFiltersSchema.parse(data);
}

// src/db/schemas/supplier.schema.ts
import { z as z3 } from "zod";
var CreateSupplierSchema = z3.object({
  legalName: z3.string().min(2, "Legal name must be at least 2 characters").max(200, "Legal name must not exceed 200 characters").trim(),
  taxIdentifier: z3.string().min(1, "Tax identifier is required").max(50, "Tax identifier must not exceed 50 characters").trim()
});
var UpdateSupplierSchema = CreateSupplierSchema.partial();
var UpsertSupplierSchema = CreateSupplierSchema;
var SupplierListFiltersSchema = z3.object({
  search: z3.string().optional(),
  page: z3.number().int().positive().default(1),
  limit: z3.number().int().positive().max(100).default(10)
});
function validateUpdateSupplier(data) {
  return UpdateSupplierSchema.parse(data);
}
function validateUpsertSupplier(data) {
  return UpsertSupplierSchema.parse(data);
}
function validateSupplierListFilters(data) {
  return SupplierListFiltersSchema.parse(data);
}

// src/db/schemas/invoice.schema.ts
import { z as z4 } from "zod";
var DocumentTypeEnum = z4.enum([
  "invoice",
  "credit_note",
  "debit_note",
  "receipt"
]);
var InvoiceStatusEnum = z4.enum(["pending", "approved", "rejected", "paid"]);
var UpsertInvoiceSchema = z4.object({
  organizationId: z4.string().uuid("Invalid organization ID"),
  supplierId: z4.string().uuid("Invalid supplier ID"),
  issuerTaxIdentifier: z4.string().min(1, "Issuer tax identifier is required").max(50).trim(),
  receiverTaxIdentifier: z4.string().min(1, "Receiver tax identifier is required").max(50).trim(),
  documentType: DocumentTypeEnum,
  documentNumber: z4.string().min(1, "Document number is required").max(50).trim(),
  issueDate: z4.coerce.date(),
  dueDate: z4.coerce.date().optional().nullable(),
  status: InvoiceStatusEnum.optional().default("pending"),
  netAmount: z4.number().nonnegative().nullable().optional(),
  taxAmount: z4.number().nonnegative().nullable().optional(),
  grossAmount: z4.number().nonnegative().nullable().optional()
});
var UpdateInvoiceSchema = z4.object({
  status: InvoiceStatusEnum.optional(),
  dueDate: z4.coerce.date().optional().nullable(),
  approvedByUserId: z4.string().uuid().optional().nullable(),
  approvedAt: z4.coerce.date().optional().nullable()
});
var InvoiceListFiltersSchema = z4.object({
  status: InvoiceStatusEnum.optional(),
  supplierId: z4.string().uuid().optional(),
  issuedAfter: z4.coerce.date().optional(),
  issuedBefore: z4.coerce.date().optional(),
  grossAmountGte: z4.coerce.number().optional(),
  grossAmountLte: z4.coerce.number().optional(),
  grossAmountEq: z4.coerce.number().optional(),
  page: z4.number().int().positive().default(1),
  limit: z4.number().int().positive().max(100).default(10)
});
function validateUpsertInvoice(data) {
  return UpsertInvoiceSchema.parse(data);
}
function validateUpdateInvoice(data) {
  return UpdateInvoiceSchema.parse(data);
}
function validateInvoiceListFilters(data) {
  return InvoiceListFiltersSchema.parse(data);
}

// src/services/organizations/types/index.ts
function toPublic(org) {
  return {
    id: org.id,
    legalName: org.legal_name,
    taxIdentifier: org.tax_identifier,
    taxAuthorityUsername: org.tax_authority_username,
    hasCredentials: !!(org.tax_authority_username && org.tax_authority_password_enc),
    lastSiiSyncAt: org.last_sii_sync_at,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
    deletedAt: org.deleted_at
  };
}

// src/services/organizations/actions/create-organization.ts
async function createOrganization(data) {
  try {
    const validated = validateCreateOrganization(data);
    logger.info("Creating organization", {
      taxIdentifier: validated.taxIdentifier
    });
    const existing = await findByTaxIdentifier(validated.taxIdentifier);
    if (existing) {
      throw new Error(
        "An organization with this tax identifier already exists"
      );
    }
    const passwordEnc = validated.taxAuthorityPassword ? encrypt(validated.taxAuthorityPassword) : null;
    const org = await create2({
      legal_name: validated.legalName,
      tax_identifier: validated.taxIdentifier,
      tax_authority_username: validated.taxAuthorityUsername ?? null,
      tax_authority_password_enc: passwordEnc
    });
    logger.info("Organization created", { organizationId: org.id });
    return toPublic(org);
  } catch (error) {
    logger.error("Error creating organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/create-organization.ts
async function createOrganization2(data) {
  return createOrganization(data);
}

// src/services/organizations/actions/get-organization.ts
async function getOrganization(params) {
  try {
    logger.info("Getting organization", { params });
    let org = null;
    if (params.id) {
      org = await findById2(params.id);
    } else if (params.taxIdentifier) {
      org = await findByTaxIdentifier(params.taxIdentifier);
    } else {
      throw new Error(
        "No valid search criteria provided: id or taxIdentifier is required"
      );
    }
    if (!org) {
      throw new Error("Organization not found");
    }
    return toPublic(org);
  } catch (error) {
    logger.error("Error getting organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/get-organization.ts
async function getOrganization2(params) {
  return getOrganization(params);
}

// src/services/organizations/actions/update-organization.ts
async function updateOrganization(id, data) {
  try {
    const validated = validateUpdateOrganization(data);
    logger.info("Updating organization", { organizationId: id });
    const existing = await findById2(id);
    if (!existing) {
      throw new Error("Organization not found");
    }
    if (validated.taxIdentifier && validated.taxIdentifier !== existing.tax_identifier) {
      const conflict = await findByTaxIdentifier(validated.taxIdentifier);
      if (conflict) {
        throw new Error(
          "An organization with this tax identifier already exists"
        );
      }
    }
    const updates = {};
    if (validated.legalName !== void 0) updates.legal_name = validated.legalName;
    if (validated.taxIdentifier !== void 0) updates.tax_identifier = validated.taxIdentifier;
    if (validated.taxAuthorityUsername !== void 0) {
      updates.tax_authority_username = validated.taxAuthorityUsername;
    }
    if (validated.taxAuthorityPassword !== void 0) {
      updates.tax_authority_password_enc = validated.taxAuthorityPassword ? encrypt(validated.taxAuthorityPassword) : null;
    }
    const org = await update2(id, updates);
    logger.info("Organization updated", { organizationId: id });
    return toPublic(org);
  } catch (error) {
    logger.error("Error updating organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/update-organization.ts
async function updateOrganization2(id, data) {
  return updateOrganization(id, data);
}

// src/services/organizations/actions/delete-organization.ts
async function deleteOrganization(id) {
  try {
    logger.info("Deleting organization", { organizationId: id });
    const existing = await findById2(id);
    if (!existing) {
      throw new Error("Organization not found");
    }
    await softDeleteById2(id);
    logger.info("Organization soft-deleted", { organizationId: id });
  } catch (error) {
    logger.error("Error deleting organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/delete-organization.ts
async function deleteOrganization2(id) {
  return deleteOrganization(id);
}

// src/services/organizations/actions/list-organizations.ts
async function listOrganizations(filters) {
  try {
    const validated = validateOrganizationListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;
    logger.info("Listing organizations", {
      page: validated.page,
      limit: validated.limit
    });
    const { organizations, total } = await findAll(
      validated.limit,
      offset,
      validated.search
    );
    const totalPages = Math.ceil(total / validated.limit);
    return {
      success: true,
      data: organizations.map(toPublic),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    logger.error("Error listing organizations", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/list-organizations.ts
async function listOrganizations2(filters) {
  return listOrganizations(filters);
}

// src/services/organizations/actions/register-organization.ts
import { z as z5 } from "zod";

// src/auth/service.ts
async function signUp(input) {
  try {
    if (!isValidEmail(input.email)) {
      throw new Error("Invalid email format");
    }
    if (!isValidPassword(input.password)) {
      throw new Error(
        "Password must be at least 8 characters with uppercase, lowercase, and number"
      );
    }
    logger.info("Signing up new user", { email: input.email });
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: input.metadata ?? {}
      }
    });
    if (error) {
      logger.error("Sign up error", {
        email: input.email,
        error: getErrorMessage(error)
      });
      throw new Error(getErrorMessage(error));
    }
    if (!data.user || !data.session) {
      throw new Error("Sign up failed");
    }
    logger.info("User signed up successfully", { userId: data.user.id });
    return {
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600
      }
    };
  } catch (error) {
    logger.error("Sign up failed", {
      email: input.email,
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/actions/register-organization.ts
var RegisterOrganizationSchema = z5.object({
  organization: z5.object({
    legalName: z5.string().min(2, "Legal name must be at least 2 characters").max(200, "Legal name must not exceed 200 characters").trim(),
    taxIdentifier: z5.string().min(1, "Tax identifier is required").max(50, "Tax identifier must not exceed 50 characters").trim(),
    taxAuthorityPassword: z5.string().min(1, "Tax authority password is required")
  }),
  adminUser: z5.object({
    firstName: z5.string().min(1, "First name is required").trim(),
    lastName: z5.string().min(1, "Last name is required").trim(),
    email: z5.string().email("Invalid email format").toLowerCase().trim(),
    password: z5.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number")
  }).optional()
});
async function registerOrganization(data) {
  try {
    const validated = RegisterOrganizationSchema.parse(data);
    logger.info("Registering organization", {
      taxIdentifier: validated.organization.taxIdentifier
    });
    const existing = await findByTaxIdentifier(
      validated.organization.taxIdentifier
    );
    if (existing) {
      throw Object.assign(
        new Error("An organization with this tax identifier already exists"),
        { code: "CONFLICT" }
      );
    }
    try {
      const { dni, dv } = parseChileanRut(validated.organization.taxIdentifier);
      const siiResult = await get_session_tokens_default({
        taxPayerDni: dni,
        taxPayerDv: dv,
        password: validated.organization.taxAuthorityPassword
      });
      if (!siiResult.siiToken) {
        throw Object.assign(
          new Error(
            "Credenciales SII inv\xE1lidas. Verifica tu RUT y contrase\xF1a."
          ),
          { code: "VALIDATION_ERROR" }
        );
      }
    } catch (siiError) {
      if (siiError.code === "VALIDATION_ERROR") throw siiError;
      throw Object.assign(
        new Error(
          `Credenciales SII inv\xE1lidas. Verifica tu RUT y contrase\xF1a. (${getErrorMessage(siiError)})`
        ),
        { code: "VALIDATION_ERROR" }
      );
    }
    let authResult;
    if (validated.adminUser) {
      authResult = await signUp({
        email: validated.adminUser.email,
        password: validated.adminUser.password
      });
    }
    const passwordEnc = encrypt(validated.organization.taxAuthorityPassword);
    const org = await create2({
      legal_name: validated.organization.legalName,
      tax_identifier: validated.organization.taxIdentifier,
      tax_authority_username: null,
      tax_authority_password_enc: passwordEnc
    });
    logger.info("Organization created", { organizationId: org.id });
    if (validated.adminUser && authResult) {
      await create({
        organization_id: org.id,
        email: validated.adminUser.email,
        role: "admin",
        status: "active",
        first_name: validated.adminUser.firstName,
        last_name: validated.adminUser.lastName,
        name: `${validated.adminUser.firstName} ${validated.adminUser.lastName}`,
        avatar_url: null,
        phone: null,
        metadata: null
      });
      logger.info("Admin user record created", {
        organizationId: org.id,
        email: validated.adminUser.email
      });
    }
    return {
      organization: toPublic(org),
      ...authResult && {
        user: authResult.user,
        session: authResult.session
      }
    };
  } catch (error) {
    logger.error("Error registering organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/organizations/handlers/register-organization.ts
async function registerOrganization2(data) {
  return registerOrganization(data);
}

// src/services/organizations/http/create-organization.ts
async function createOrganizationHandler(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return validationError("Invalid request body");
    }
    const org = await createOrganization2(body);
    return successResponse(
      org,
      "Organization created successfully",
      201 /* CREATED */
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("already exists")) return errorResponse(msg, 409 /* CONFLICT */);
    if (msg.includes("validation") || msg.toLowerCase().includes("invalid")) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}

// src/services/organizations/http/get-organization.ts
async function getOrganizationHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id) return validationError("Organization ID is required");
    if (!isValidUUID(id)) return validationError("Invalid organization ID format");
    const org = await getOrganization2({ id });
    return successResponse(org);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Organization");
    return serverError(msg);
  }
}

// src/services/organizations/http/update-organization.ts
async function updateOrganizationHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id || !isValidUUID(id)) return validationError("Invalid organization ID format");
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const org = await updateOrganization2(id, body);
    return successResponse(org, "Organization updated successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Organization");
    if (msg.includes("already exists")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/organizations/http/delete-organization.ts
async function deleteOrganizationHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id || !isValidUUID(id)) return validationError("Invalid organization ID format");
    await deleteOrganization2(id);
    return new Response(null, { status: 204 /* NO_CONTENT */ });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Organization");
    return serverError(msg);
  }
}

// src/services/organizations/http/list-organizations.ts
async function listOrganizationsHandler(req) {
  try {
    const url = new URL(req.url);
    const filters = {
      search: url.searchParams.get("search") ?? void 0,
      page: url.searchParams.has("page") ? Number(url.searchParams.get("page")) : void 0,
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : void 0
    };
    const result = await listOrganizations2(filters);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/organizations/http/register-organization.ts
async function registerOrganizationHandler(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return validationError("Invalid request body");
    }
    const result = await registerOrganization2(body);
    return successResponse(result, "Organization created successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (error.code === "VALIDATION_ERROR") {
      return validationError(msg);
    }
    if (error.code === "CONFLICT" || msg.includes("already exists")) {
      return errorResponse(msg, 409 /* CONFLICT */);
    }
    if (msg.toLowerCase().includes("validation") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("required") || msg.toLowerCase().includes("must be") || msg.toLowerCase().includes("must contain")) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}

// src/services/organizations/routes.ts
function registerOrganizationRoutes(router2) {
  router2.post("/api/organizations/register", registerOrganizationHandler);
  router2.get("/api/organizations", listOrganizationsHandler);
  router2.get("/api/organizations/:id", getOrganizationHandler);
  router2.post(
    "/api/organizations",
    requireAuth(async (req) => createOrganizationHandler(req))
  );
  router2.put(
    "/api/organizations/:id",
    requireAuth(async (req) => updateOrganizationHandler(req))
  );
  router2.delete(
    "/api/organizations/:id",
    requireAuth(async (req) => deleteOrganizationHandler(req))
  );
}

// src/services/users/actions/get-user.ts
async function getUser(params) {
  try {
    logger.info("Getting user", { params });
    let user = null;
    if (params.id && params.organizationId) {
      user = await findByIdInOrganization(
        params.id,
        params.organizationId
      );
    } else if (params.id) {
      user = await findById(params.id);
    } else if (params.email) {
      user = await findByEmail(params.email);
    } else {
      throw new Error(
        "No valid search criteria provided: id or email is required"
      );
    }
    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    logger.error("Error getting user", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/users/handlers/get-user.ts
function getUser2(params) {
  return getUser(params);
}

// src/services/users/handlers/get-me.ts
async function getMe({
  email
}) {
  return findByEmail(email);
}

// src/services/users/actions/create-user.ts
async function createUser(organizationId, userData) {
  try {
    logger.info("Creating new user", { organizationId });
    const validated = validateCreateUser(userData);
    const existingUser = await findByEmail(validated.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const user = await create({
      organization_id: organizationId,
      email: validated.email,
      first_name: validated.firstName ?? null,
      last_name: validated.lastName ?? null,
      name: validated.name ?? null,
      avatar_url: validated.avatar_url ?? null,
      phone: validated.phone ?? null,
      role: validated.role,
      status: validated.status,
      metadata: validated.metadata
    });
    logger.info("User created successfully", {
      userId: user.id,
      organizationId
    });
    return user;
  } catch (error) {
    logger.error("Error creating user", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/users/handlers/create-user.ts
function createUser2(organizationId, userData) {
  return createUser(organizationId, userData);
}

// src/services/users/actions/update-user.ts
async function updateUser(userId, updates) {
  try {
    logger.info("Updating user", { userId });
    const validated = validateUpdateUser(updates);
    const existing = await findById(userId);
    if (!existing) throw new Error("User not found");
    if (validated.email && validated.email !== existing.email) {
      const conflict = await findByEmail(validated.email);
      if (conflict) throw new Error("Email already in use by another user");
    }
    const dbUpdates = {};
    if (validated.email !== void 0) dbUpdates.email = validated.email;
    if (validated.firstName !== void 0) dbUpdates.first_name = validated.firstName;
    if (validated.lastName !== void 0) dbUpdates.last_name = validated.lastName;
    if (validated.name !== void 0) dbUpdates.name = validated.name;
    if (validated.avatar_url !== void 0) dbUpdates.avatar_url = validated.avatar_url;
    if (validated.phone !== void 0) dbUpdates.phone = validated.phone;
    if (validated.role !== void 0) dbUpdates.role = validated.role;
    if (validated.status !== void 0) dbUpdates.status = validated.status;
    if (validated.metadata !== void 0) dbUpdates.metadata = validated.metadata;
    const user = await update(userId, dbUpdates);
    logger.info("User updated successfully", { userId });
    return user;
  } catch (error) {
    logger.error("Error updating user", {
      userId,
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/users/handlers/update-user.ts
function updateUser2(userId, updates) {
  return updateUser(userId, updates);
}

// src/services/users/actions/delete-user.ts
async function deleteUser(userId) {
  try {
    logger.info("Soft-deleting user", { userId });
    const existing = await findById(userId);
    if (!existing) throw new Error("User not found");
    await softDeleteById(userId);
    logger.info("User soft-deleted", { userId });
  } catch (error) {
    logger.error("Error deleting user", {
      userId,
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/users/handlers/delete-user.ts
function deleteUser2(userId) {
  return deleteUser(userId);
}

// src/services/users/actions/list-users.ts
async function listUsers(organizationId, page = 1, limit = 10) {
  try {
    logger.info("Listing users", { organizationId, page, limit });
    if (page < 1) throw new Error("Page must be greater than 0");
    if (limit < 1 || limit > 100) throw new Error("Limit must be between 1 and 100");
    const offset = (page - 1) * limit;
    const { users, total } = await findAllByOrganization(
      organizationId,
      limit,
      offset
    );
    logger.info("Users fetched successfully", { count: users.length, total });
    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Error listing users", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/users/handlers/list-users.ts
function listUsers2(organizationId, page, limit) {
  return listUsers(organizationId, page, limit);
}

// src/services/users/http/list-users.ts
async function listUsersHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    if (page < 1 || limit < 1 || limit > 100) {
      return validationError("Invalid pagination parameters");
    }
    const result = await listUsers2(orgId, page, limit);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/users/http/get-user.ts
async function getUserHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid user ID");
    const user = await getUser2({ id, organizationId: orgId });
    return successResponse(user);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("User");
    return serverError(msg);
  }
}

// src/services/users/http/get-me.ts
async function getMeHandler(_req, context) {
  try {
    if (!context.email) {
      return serverError("User email not available in token");
    }
    const user = await getMe({ email: context.email });
    if (!user) return notFoundResponse("User");
    return successResponse(user);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/users/http/create-user.ts
async function createUserHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const bodyObj = body;
    if (typeof bodyObj.email !== "string" || !isValidEmail(bodyObj.email)) {
      return validationError("Invalid or missing email");
    }
    const user = await createUser2(orgId, body);
    return successResponse(
      user,
      "User created successfully",
      201 /* CREATED */
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("already exists")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/users/http/update-user.ts
async function updateUserHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const userId = segments[segments.length - 1];
    if (!userId || !isValidUUID(userId)) return validationError("Invalid user ID");
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const user = await updateUser2(userId, body);
    return successResponse(user, "User updated successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("User");
    return serverError(msg);
  }
}

// src/services/users/http/delete-user.ts
async function deleteUserHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const userId = segments[segments.length - 1];
    if (!userId || !isValidUUID(userId)) return validationError("Invalid user ID");
    await deleteUser2(userId);
    return new Response(null, { status: 204 /* NO_CONTENT */ });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("User");
    return serverError(msg);
  }
}

// src/services/users/routes.ts
function registerUserRoutes(router2) {
  router2.get(
    "/api/users/me",
    requireAuth(async (req, ctx) => getMeHandler(req, ctx))
  );
  router2.get(
    "/api/organizations/:orgId/users",
    requireAuth(async (req) => listUsersHandler(req))
  );
  router2.get(
    "/api/organizations/:orgId/users/:id",
    requireAuth(async (req) => getUserHandler(req))
  );
  router2.post(
    "/api/organizations/:orgId/users",
    requireAuth(async (req) => createUserHandler(req))
  );
  router2.put(
    "/api/organizations/:orgId/users/:id",
    requireAuth(async (req) => updateUserHandler(req))
  );
  router2.delete(
    "/api/organizations/:orgId/users/:id",
    requireAuth(async (req) => deleteUserHandler(req))
  );
}

// src/db/supplier.db.ts
async function findById3(id) {
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findByTaxIdentifier2(taxIdentifier) {
  const { data, error } = await supabase.from("suppliers").select("*").eq("tax_identifier", taxIdentifier).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function create3(data) {
  const { data: supplier, error } = await supabase.from("suppliers").insert(data).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return supplier;
}
async function update3(id, data) {
  const { data: supplier, error } = await supabase.from("suppliers").update(data).eq("id", id).is("deleted_at", null).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return supplier;
}
async function softDeleteById3(id) {
  const { error } = await supabase.from("suppliers").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(`Database error: ${error.message}`);
}
async function findByOrganization(organizationId, limit, offset, search) {
  const { data: junctionRows, error: junctionError } = await supabase.from("organization_suppliers").select("supplier_id").eq("organization_id", organizationId);
  if (junctionError) throw new Error(`Database error: ${junctionError.message}`);
  const supplierIds = (junctionRows ?? []).map(
    (row) => row.supplier_id
  );
  if (supplierIds.length === 0) return { suppliers: [], total: 0 };
  let countQuery = supabase.from("suppliers").select("*", { count: "exact", head: true }).in("id", supplierIds).is("deleted_at", null);
  let dataQuery = supabase.from("suppliers").select("*").in("id", supplierIds).is("deleted_at", null);
  if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
  }
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);
  const { data, error } = await dataQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new Error(`Database error: ${error.message}`);
  const pageSupplierIds = (data ?? []).map((s) => s.id);
  let totals = {};
  if (pageSupplierIds.length > 0) {
    const { data: amountRows, error: amountError } = await supabase.from("invoices").select("supplier_id, gross_amount, status").eq("organization_id", organizationId).in("supplier_id", pageSupplierIds).in("status", ["pending", "approved", "paid"]).is("deleted_at", null);
    if (amountError) throw new Error(`Database error: ${amountError.message}`);
    totals = (amountRows ?? []).reduce(
      (acc, row) => {
        if (!acc[row.supplier_id]) acc[row.supplier_id] = { total: 0, approved: 0 };
        acc[row.supplier_id].total += row.gross_amount ?? 0;
        if (row.status === "approved" || row.status === "paid") {
          acc[row.supplier_id].approved += row.gross_amount ?? 0;
        }
        return acc;
      },
      {}
    );
  }
  const suppliers = (data ?? []).map((s) => ({
    ...s,
    totalInvoiceAmount: totals[s.id]?.total ?? 0,
    totalApprovedAmount: totals[s.id]?.approved ?? 0
  }));
  return { suppliers, total: count ?? 0 };
}
async function findAll2(limit, offset, search) {
  let countQuery = supabase.from("suppliers").select("*", { count: "exact", head: true }).is("deleted_at", null);
  let dataQuery = supabase.from("suppliers").select("*").is("deleted_at", null);
  if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`
    );
  }
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);
  const { data, error } = await dataQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new Error(`Database error: ${error.message}`);
  return {
    suppliers: data ?? [],
    total: count ?? 0
  };
}

// src/services/suppliers/types/index.ts
function toPublic2(supplier) {
  return {
    id: supplier.id,
    legalName: supplier.legal_name,
    taxIdentifier: supplier.tax_identifier,
    totalInvoiceAmount: supplier.totalInvoiceAmount ?? 0,
    totalApprovedAmount: supplier.totalApprovedAmount ?? 0,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
    deletedAt: supplier.deleted_at
  };
}

// src/services/suppliers/actions/upsert-supplier.ts
async function upsertSupplier(data) {
  try {
    const validated = validateUpsertSupplier(data);
    logger.info("Upserting supplier", {
      taxIdentifier: validated.taxIdentifier
    });
    const existing = await findByTaxIdentifier2(
      validated.taxIdentifier
    );
    if (existing) {
      const updated = await update3(existing.id, {
        legal_name: validated.legalName
      });
      logger.info("Supplier updated (upsert)", { supplierId: existing.id });
      return toPublic2(updated);
    }
    const supplier = await create3({
      legal_name: validated.legalName,
      tax_identifier: validated.taxIdentifier
    });
    logger.info("Supplier created (upsert)", { supplierId: supplier.id });
    return toPublic2(supplier);
  } catch (error) {
    logger.error("Error upserting supplier", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/suppliers/handlers/upsert-supplier.ts
async function upsertSupplier2(data) {
  return upsertSupplier(data);
}

// src/services/suppliers/actions/get-supplier.ts
async function getSupplier(params) {
  try {
    logger.info("Getting supplier", { params });
    let supplier = null;
    if (params.id) {
      supplier = await findById3(params.id);
    } else if (params.taxIdentifier) {
      supplier = await findByTaxIdentifier2(params.taxIdentifier);
    } else {
      throw new Error(
        "No valid search criteria provided: id or taxIdentifier is required"
      );
    }
    if (!supplier) throw new Error("Supplier not found");
    return toPublic2(supplier);
  } catch (error) {
    logger.error("Error getting supplier", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/suppliers/handlers/get-supplier.ts
async function getSupplier2(params) {
  return getSupplier(params);
}

// src/services/suppliers/actions/update-supplier.ts
async function updateSupplier(id, data) {
  try {
    const validated = validateUpdateSupplier(data);
    logger.info("Updating supplier", { supplierId: id });
    const existing = await findById3(id);
    if (!existing) throw new Error("Supplier not found");
    if (validated.taxIdentifier && validated.taxIdentifier !== existing.tax_identifier) {
      const conflict = await findByTaxIdentifier2(
        validated.taxIdentifier
      );
      if (conflict) throw new Error("A supplier with this tax identifier already exists");
    }
    const updates = {};
    if (validated.legalName !== void 0) updates.legal_name = validated.legalName;
    if (validated.taxIdentifier !== void 0) updates.tax_identifier = validated.taxIdentifier;
    const supplier = await update3(id, updates);
    logger.info("Supplier updated", { supplierId: id });
    return toPublic2(supplier);
  } catch (error) {
    logger.error("Error updating supplier", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/suppliers/handlers/update-supplier.ts
async function updateSupplier2(id, data) {
  return updateSupplier(id, data);
}

// src/services/suppliers/actions/delete-supplier.ts
async function deleteSupplier(id) {
  try {
    logger.info("Deleting supplier", { supplierId: id });
    const existing = await findById3(id);
    if (!existing) throw new Error("Supplier not found");
    await softDeleteById3(id);
    logger.info("Supplier soft-deleted", { supplierId: id });
  } catch (error) {
    logger.error("Error deleting supplier", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/suppliers/handlers/delete-supplier.ts
async function deleteSupplier2(id) {
  return deleteSupplier(id);
}

// src/services/suppliers/actions/list-suppliers.ts
async function listSuppliers(filters) {
  try {
    const validated = validateSupplierListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;
    const { suppliers, total } = await findAll2(
      validated.limit,
      offset,
      validated.search
    );
    return {
      success: true,
      data: suppliers.map(toPublic2),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit)
      }
    };
  } catch (error) {
    logger.error("Error listing suppliers", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/suppliers/handlers/list-suppliers.ts
async function listSuppliers2(filters) {
  return listSuppliers(filters);
}

// src/services/suppliers/actions/list-suppliers-by-org.ts
async function listSuppliersByOrg(organizationId, filters) {
  try {
    const validated = validateSupplierListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;
    const { suppliers, total } = await findByOrganization(
      organizationId,
      validated.limit,
      offset,
      validated.search
    );
    return {
      success: true,
      data: suppliers.map(toPublic2),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit)
      }
    };
  } catch (error) {
    logger.error("Error listing suppliers by organization", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/suppliers/handlers/list-suppliers-by-org.ts
async function listSuppliersByOrg2(organizationId, filters) {
  return listSuppliersByOrg(organizationId, filters);
}

// src/services/suppliers/http/upsert-supplier.ts
async function upsertSupplierHandler(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const supplier = await upsertSupplier2(body);
    return successResponse(
      supplier,
      "Supplier upserted successfully",
      200 /* OK */
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("required")) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}

// src/services/suppliers/http/get-supplier.ts
async function getSupplierHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id || !isValidUUID(id)) return validationError("Invalid supplier ID format");
    const supplier = await getSupplier2({ id });
    return successResponse(supplier);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Supplier");
    return serverError(msg);
  }
}

// src/services/suppliers/http/update-supplier.ts
async function updateSupplierHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id || !isValidUUID(id)) return validationError("Invalid supplier ID format");
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const supplier = await updateSupplier2(id, body);
    return successResponse(supplier, "Supplier updated successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Supplier");
    if (msg.includes("already exists")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/suppliers/http/delete-supplier.ts
async function deleteSupplierHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    if (!id || !isValidUUID(id)) return validationError("Invalid supplier ID format");
    await deleteSupplier2(id);
    return new Response(null, { status: 204 /* NO_CONTENT */ });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Supplier");
    return serverError(msg);
  }
}

// src/services/suppliers/http/list-suppliers.ts
async function listSuppliersHandler(req) {
  try {
    const url = new URL(req.url);
    const filters = {
      search: url.searchParams.get("search") ?? void 0,
      page: url.searchParams.has("page") ? Number(url.searchParams.get("page")) : void 0,
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : void 0
    };
    const result = await listSuppliers2(filters);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/suppliers/http/list-suppliers-by-org.ts
async function listSuppliersByOrgHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    const filters = {
      search: url.searchParams.get("search") ?? void 0,
      page: url.searchParams.has("page") ? Number(url.searchParams.get("page")) : void 0,
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : void 0
    };
    const result = await listSuppliersByOrg2(orgId, filters);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/suppliers/routes.ts
function registerSupplierRoutes(router2) {
  router2.get(
    "/api/organizations/:orgId/suppliers",
    requireAuth(async (req) => listSuppliersByOrgHandler(req))
  );
  router2.get("/api/suppliers", listSuppliersHandler);
  router2.get("/api/suppliers/:id", getSupplierHandler);
  router2.post(
    "/api/suppliers/upsert",
    requireAuth(async (req) => upsertSupplierHandler(req))
  );
  router2.put(
    "/api/suppliers/:id",
    requireAuth(async (req) => updateSupplierHandler(req))
  );
  router2.delete(
    "/api/suppliers/:id",
    requireAuth(async (req) => deleteSupplierHandler(req))
  );
}

// src/db/invoice.db.ts
async function findById4(id, organizationId) {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).eq("organization_id", organizationId).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findByExternalKey(externalUniqueKey, organizationId) {
  const { data, error } = await supabase.from("invoices").select("*").eq("external_unique_key", externalUniqueKey).eq("organization_id", organizationId).is("deleted_at", null).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function create4(data) {
  const { data: invoice, error } = await supabase.from("invoices").insert(data).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return invoice;
}
async function update4(id, organizationId, data) {
  const { data: invoice, error } = await supabase.from("invoices").update(data).eq("id", id).eq("organization_id", organizationId).is("deleted_at", null).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return invoice;
}
async function softDeleteById4(id, organizationId) {
  const { error } = await supabase.from("invoices").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).eq("organization_id", organizationId).is("deleted_at", null);
  if (error) throw new Error(`Database error: ${error.message}`);
}
async function findLatestByOrganization(organizationId) {
  const { data, error } = await supabase.from("invoices").select("*").eq("organization_id", organizationId).is("deleted_at", null).order("issue_date", { ascending: false }).limit(1).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function findAllByOrganization2(organizationId, limit, offset, filters = {}) {
  let countQuery = supabase.from("invoices").select("*", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null);
  let dataQuery = supabase.from("invoices").select("*").eq("organization_id", organizationId).is("deleted_at", null);
  if (filters.status) {
    countQuery = countQuery.eq("status", filters.status);
    dataQuery = dataQuery.eq("status", filters.status);
  }
  if (filters.supplierId) {
    countQuery = countQuery.eq("supplier_id", filters.supplierId);
    dataQuery = dataQuery.eq("supplier_id", filters.supplierId);
  }
  if (filters.issuedAfter) {
    countQuery = countQuery.gte(
      "issue_date",
      filters.issuedAfter.toISOString().split("T")[0]
    );
    dataQuery = dataQuery.gte(
      "issue_date",
      filters.issuedAfter.toISOString().split("T")[0]
    );
  }
  if (filters.issuedBefore) {
    countQuery = countQuery.lte(
      "issue_date",
      filters.issuedBefore.toISOString().split("T")[0]
    );
    dataQuery = dataQuery.lte(
      "issue_date",
      filters.issuedBefore.toISOString().split("T")[0]
    );
  }
  if (filters.grossAmountGte !== void 0) {
    countQuery = countQuery.gte("gross_amount", filters.grossAmountGte);
    dataQuery = dataQuery.gte("gross_amount", filters.grossAmountGte);
  }
  if (filters.grossAmountLte !== void 0) {
    countQuery = countQuery.lte("gross_amount", filters.grossAmountLte);
    dataQuery = dataQuery.lte("gross_amount", filters.grossAmountLte);
  }
  if (filters.grossAmountEq !== void 0) {
    countQuery = countQuery.eq("gross_amount", filters.grossAmountEq);
    dataQuery = dataQuery.eq("gross_amount", filters.grossAmountEq);
  }
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);
  const { data, error } = await dataQuery.range(offset, offset + limit - 1).order("issue_date", { ascending: false });
  if (error) throw new Error(`Database error: ${error.message}`);
  return {
    invoices: data ?? [],
    total: count ?? 0
  };
}

// src/services/invoices/helpers/external-key.ts
import crypto2 from "node:crypto";
function computeExternalUniqueKey(params) {
  const composite = [
    params.receiverTaxIdentifier.trim().toLowerCase(),
    params.issuerTaxIdentifier.trim().toLowerCase(),
    params.documentType.trim().toLowerCase(),
    params.documentNumber.trim().toLowerCase()
  ].join(":");
  return crypto2.createHash("sha256").update(composite, "utf8").digest("hex");
}

// src/services/invoices/types/index.ts
function toPublic3(invoice) {
  return {
    id: invoice.id,
    organizationId: invoice.organization_id,
    supplierId: invoice.supplier_id,
    externalUniqueKey: invoice.external_unique_key,
    issuerTaxIdentifier: invoice.issuer_tax_identifier,
    receiverTaxIdentifier: invoice.receiver_tax_identifier,
    documentType: invoice.document_type,
    documentNumber: invoice.document_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    executiveTitleDate: invoice.executive_title_date,
    status: invoice.status,
    approvedByUserId: invoice.approved_by_user_id,
    approvedAt: invoice.approved_at,
    netAmount: invoice.net_amount,
    taxAmount: invoice.tax_amount,
    grossAmount: invoice.gross_amount,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    deletedAt: invoice.deleted_at
  };
}

// src/services/invoices/actions/upsert-invoice.ts
async function upsertInvoice(data) {
  try {
    const validated = validateUpsertInvoice(data);
    const externalUniqueKey = computeExternalUniqueKey({
      receiverTaxIdentifier: validated.receiverTaxIdentifier,
      issuerTaxIdentifier: validated.issuerTaxIdentifier,
      documentType: validated.documentType,
      documentNumber: validated.documentNumber
    });
    logger.info("Upserting invoice", {
      organizationId: validated.organizationId,
      externalUniqueKey
    });
    const existing = await findByExternalKey(
      externalUniqueKey,
      validated.organizationId
    );
    if (existing) {
      const statusToSet = existing.status === "pending" ? validated.status : existing.status;
      const updated = await update4(
        existing.id,
        validated.organizationId,
        {
          due_date: validated.dueDate ? validated.dueDate.toISOString().split("T")[0] : null,
          status: statusToSet,
          net_amount: validated.netAmount ?? null,
          tax_amount: validated.taxAmount ?? null,
          gross_amount: validated.grossAmount ?? null
        }
      );
      logger.info("Invoice updated (upsert)", { invoiceId: existing.id });
      return toPublic3(updated);
    }
    const invoice = await create4({
      organization_id: validated.organizationId,
      supplier_id: validated.supplierId,
      external_unique_key: externalUniqueKey,
      issuer_tax_identifier: validated.issuerTaxIdentifier,
      receiver_tax_identifier: validated.receiverTaxIdentifier,
      document_type: validated.documentType,
      document_number: validated.documentNumber,
      issue_date: validated.issueDate.toISOString().split("T")[0],
      due_date: validated.dueDate ? validated.dueDate.toISOString().split("T")[0] : null,
      status: validated.status,
      net_amount: validated.netAmount ?? null,
      tax_amount: validated.taxAmount ?? null,
      gross_amount: validated.grossAmount ?? null
    });
    logger.info("Invoice created (upsert)", { invoiceId: invoice.id });
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error upserting invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/upsert-invoice.ts
async function upsertInvoice2(data) {
  return upsertInvoice(data);
}

// src/services/invoices/actions/get-invoice.ts
async function getInvoice(id, organizationId) {
  try {
    logger.info("Getting invoice", { invoiceId: id, organizationId });
    const invoice = await findById4(id, organizationId);
    if (!invoice) throw new Error("Invoice not found");
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error getting invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/get-invoice.ts
async function getInvoice2(id, organizationId) {
  return getInvoice(id, organizationId);
}

// src/services/invoices/actions/list-invoices.ts
async function listInvoices(organizationId, rawFilters) {
  try {
    const filters = validateInvoiceListFilters(rawFilters);
    const offset = (filters.page - 1) * filters.limit;
    const { invoices, total } = await findAllByOrganization2(
      organizationId,
      filters.limit,
      offset,
      {
        status: filters.status,
        supplierId: filters.supplierId,
        issuedAfter: filters.issuedAfter,
        issuedBefore: filters.issuedBefore,
        grossAmountGte: filters.grossAmountGte,
        grossAmountLte: filters.grossAmountLte,
        grossAmountEq: filters.grossAmountEq
      }
    );
    return {
      success: true,
      data: invoices.map(toPublic3),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    };
  } catch (error) {
    logger.error("Error listing invoices", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/list-invoices.ts
async function listInvoices2(organizationId, filters) {
  return listInvoices(organizationId, filters);
}

// src/services/invoices/actions/update-invoice.ts
async function updateInvoice(id, organizationId, data) {
  try {
    const validated = validateUpdateInvoice(data);
    logger.info("Updating invoice", { invoiceId: id, organizationId });
    const existing = await findById4(id, organizationId);
    if (!existing) throw new Error("Invoice not found");
    const updates = {};
    if (validated.status !== void 0) updates.status = validated.status;
    if (validated.dueDate !== void 0) {
      updates.due_date = validated.dueDate ? validated.dueDate.toISOString().split("T")[0] : null;
    }
    if (validated.approvedByUserId !== void 0) {
      updates.approved_by_user_id = validated.approvedByUserId;
    }
    if (validated.approvedAt !== void 0) {
      updates.approved_at = validated.approvedAt?.toISOString() ?? null;
    }
    const invoice = await update4(
      id,
      organizationId,
      updates
    );
    logger.info("Invoice updated", { invoiceId: id });
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error updating invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/update-invoice.ts
async function updateInvoice2(id, organizationId, data) {
  return updateInvoice(id, organizationId, data);
}

// src/services/invoices/actions/notify-sii-dte-event.ts
var DOCUMENT_TYPE_TO_SII_CODE = {
  invoice: 33,
  receipt: 39,
  debit_note: 56,
  credit_note: 61
};
async function notifySiiDteEvent(organizationId, invoice, accionDoc) {
  const org = await findById2(organizationId);
  if (!org?.tax_authority_password_enc) {
    logger.info("Skipping SII DTE notification: no credentials configured", {
      organizationId,
      accionDoc
    });
    return;
  }
  const password = decrypt(org.tax_authority_password_enc);
  const { dni: taxPayerDni, dv: taxPayerDv } = parseChileanRut(
    org.tax_identifier
  );
  const { siiToken, client } = await get_session_tokens_default({
    taxPayerDni,
    taxPayerDv,
    password
  });
  const { dni: rutEmisorStr, dv: dvEmisor } = parseChileanRut(
    invoice.issuer_tax_identifier
  );
  const rutEmisor = parseInt(rutEmisorStr, 10);
  const tipoDoc = DOCUMENT_TYPE_TO_SII_CODE[invoice.document_type] ?? 33;
  const folio = Number(invoice.document_number);
  await register_dte_event_default({
    client,
    siiToken,
    rutEmisor,
    dvEmisor,
    tipoDoc,
    folio,
    accionDoc
  });
  logger.info("SII DTE event registered", {
    organizationId,
    invoiceId: invoice.id,
    accionDoc,
    tipoDoc,
    folio
  });
}

// src/services/invoices/actions/approve-invoice.ts
async function approveInvoice(id, organizationId, approvedByUserId) {
  try {
    logger.info("Approving invoice", {
      invoiceId: id,
      organizationId,
      approvedByUserId
    });
    const existing = await findById4(id, organizationId);
    if (!existing) throw new Error("Invoice not found");
    if (existing.status !== "pending") {
      throw new Error(
        `Invoice cannot be approved: current status is '${existing.status}'`
      );
    }
    const invoice = await update4(id, organizationId, {
      status: "approved",
      approved_by_user_id: approvedByUserId,
      approved_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info("Invoice approved", { invoiceId: id, approvedByUserId });
    notifySiiDteEvent(organizationId, invoice, "ACD").catch((err) => {
      logger.warn("Failed to register ACD with SII", {
        invoiceId: id,
        error: err?.message
      });
    });
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error approving invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/approve-invoice.ts
async function approveInvoice2(id, organizationId, approvedByUserId) {
  return approveInvoice(id, organizationId, approvedByUserId);
}

// src/services/invoices/actions/reject-invoice.ts
async function rejectInvoice(id, organizationId, rejectedByUserId) {
  try {
    logger.info("Rejecting invoice", {
      invoiceId: id,
      organizationId,
      rejectedByUserId
    });
    const existing = await findById4(id, organizationId);
    if (!existing) throw new Error("Invoice not found");
    if (existing.status !== "pending") {
      throw new Error(
        `Invoice cannot be rejected: current status is '${existing.status}'`
      );
    }
    const invoice = await update4(id, organizationId, {
      status: "rejected",
      approved_by_user_id: rejectedByUserId,
      approved_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info("Invoice rejected", { invoiceId: id, rejectedByUserId });
    notifySiiDteEvent(organizationId, invoice, "RCD").catch((err) => {
      logger.warn("Failed to register RCD with SII", {
        invoiceId: id,
        error: err?.message
      });
    });
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error rejecting invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/reject-invoice.ts
async function rejectInvoice2(id, organizationId, rejectedByUserId) {
  return rejectInvoice(id, organizationId, rejectedByUserId);
}

// src/services/invoices/actions/pay-invoice.ts
async function payInvoice(id, organizationId) {
  try {
    logger.info("Marking invoice as paid", { invoiceId: id, organizationId });
    const existing = await findById4(id, organizationId);
    if (!existing) throw new Error("Invoice not found");
    if (existing.status !== "approved") {
      throw new Error(
        `Invoice cannot be marked as paid: current status is '${existing.status}'`
      );
    }
    const invoice = await update4(id, organizationId, {
      status: "paid"
    });
    logger.info("Invoice marked as paid", { invoiceId: id });
    return toPublic3(invoice);
  } catch (error) {
    logger.error("Error marking invoice as paid", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/actions/delete-invoice.ts
async function deleteInvoice(id, organizationId) {
  try {
    logger.info("Deleting invoice", { invoiceId: id, organizationId });
    const existing = await findById4(id, organizationId);
    if (!existing) throw new Error("Invoice not found");
    await softDeleteById4(id, organizationId);
    logger.info("Invoice soft-deleted", { invoiceId: id });
  } catch (error) {
    logger.error("Error deleting invoice", { error: getErrorMessage(error) });
    throw error;
  }
}

// src/services/invoices/handlers/delete-invoice.ts
async function deleteInvoice2(id, organizationId) {
  return deleteInvoice(id, organizationId);
}

// src/db/organization-supplier.db.ts
async function findByOrgAndSupplier(organizationId, supplierId) {
  const { data, error } = await supabase.from("organization_suppliers").select("*").eq("organization_id", organizationId).eq("supplier_id", supplierId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}
async function create5(organizationId, supplierId) {
  const { data, error } = await supabase.from("organization_suppliers").insert({ organization_id: organizationId, supplier_id: supplierId }).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}

// src/services/invoices/actions/upsert-org-supplier.ts
async function upsertOrgSupplier(organizationId, supplierId) {
  try {
    const existing = await findByOrgAndSupplier(
      organizationId,
      supplierId
    );
    if (existing) {
      return;
    }
    await create5(organizationId, supplierId);
    logger.info("Org-supplier link created", { organizationId, supplierId });
  } catch (error) {
    logger.error("Error upserting org-supplier link", {
      error: getErrorMessage(error)
    });
    throw error;
  }
}

// src/services/invoices/helpers/map-document-type.ts
function mapSiiDocumentType(tipoDoc) {
  if ([33, 34, 46, 52].includes(tipoDoc)) return "invoice";
  if ([39, 41].includes(tipoDoc)) return "receipt";
  if (tipoDoc === 56) return "debit_note";
  if (tipoDoc === 61) return "credit_note";
  return "invoice";
}

// src/services/invoices/actions/sync-org-invoices.ts
function currentPeriod() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function determinePeriods(latestIssueDate) {
  const to = currentPeriod();
  if (!latestIssueDate) {
    const now = /* @__PURE__ */ new Date();
    const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const from = `${fourMonthsAgo.getFullYear()}-${String(fourMonthsAgo.getMonth() + 1).padStart(2, "0")}`;
    return { from, to };
  }
  const latestPeriod = latestIssueDate.substring(0, 7);
  return { from: latestPeriod, to };
}
async function syncOrgInvoices(orgId) {
  try {
    const org = await findById2(orgId);
    if (!org || !org.tax_authority_password_enc) {
      logger.info("Skipping SII sync: no credentials configured", { orgId });
      return;
    }
    const latestInvoice = await findLatestByOrganization(orgId);
    const latestIssueDate = latestInvoice?.issue_date ?? null;
    const { from, to } = determinePeriods(latestIssueDate);
    logger.info("Starting SII sync", { orgId, from, to });
    const password = decrypt(org.tax_authority_password_enc);
    const { dni, dv } = parseChileanRut(org.tax_identifier);
    const { invoices } = await get_sii_invoices_default({
      taxPayerDni: dni,
      taxPayerDv: dv,
      password,
      from,
      to
    });
    logger.info("SII invoices fetched", { orgId, count: invoices.length });
    for (const invoice of invoices) {
      const supplierTaxIdentifier = invoice.receiverTaxIdentifier;
      const supplierName = invoice.receiverName;
      const supplier = await upsertSupplier({
        legalName: supplierName,
        taxIdentifier: supplierTaxIdentifier
      });
      await upsertOrgSupplier(orgId, supplier.id);
      await upsertInvoice({
        organizationId: orgId,
        supplierId: supplier.id,
        issuerTaxIdentifier: supplierTaxIdentifier,
        receiverTaxIdentifier: org.tax_identifier,
        documentType: mapSiiDocumentType(invoice.documentTypeCode),
        documentNumber: invoice.documentNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: "pending",
        netAmount: invoice.netAmount,
        taxAmount: invoice.taxAmount,
        grossAmount: invoice.grossAmount
      });
    }
    await supabase.from("organizations").update({ last_sii_sync_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", orgId);
    logger.info("SII sync complete", { orgId, synced: invoices.length });
  } catch (error) {
    logger.error("SII sync failed \u2014 returning existing DB data", {
      orgId,
      error: getErrorMessage(error)
    });
  }
}

// src/services/invoices/handlers/sync-invoices.ts
async function syncInvoices(organizationId) {
  return syncOrgInvoices(organizationId);
}

// src/services/invoices/actions/import-org-invoices.ts
async function importOrgInvoices(params) {
  const { orgId, from, defaultStatus } = params;
  const org = await findById2(orgId);
  if (!org) {
    throw Object.assign(new Error("Organization not found"), {
      code: "NOT_FOUND"
    });
  }
  if (!org.tax_authority_password_enc) {
    throw Object.assign(
      new Error("Organization has no SII credentials configured"),
      { code: "VALIDATION_ERROR" }
    );
  }
  const password = decrypt(org.tax_authority_password_enc);
  const { dni, dv } = parseChileanRut(org.tax_identifier);
  const now = /* @__PURE__ */ new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { invoices } = await get_sii_invoices_default({
    taxPayerDni: dni,
    taxPayerDv: dv,
    password,
    from,
    to
  });
  for (const invoice of invoices) {
    const supplierTaxIdentifier = invoice.receiverTaxIdentifier;
    const supplierName = invoice.receiverName;
    const supplier = await upsertSupplier({
      legalName: supplierName,
      taxIdentifier: supplierTaxIdentifier
    });
    await upsertOrgSupplier(orgId, supplier.id);
    await upsertInvoice({
      organizationId: orgId,
      supplierId: supplier.id,
      issuerTaxIdentifier: supplierTaxIdentifier,
      receiverTaxIdentifier: org.tax_identifier,
      documentType: mapSiiDocumentType(invoice.documentTypeCode),
      documentNumber: invoice.documentNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: defaultStatus,
      netAmount: invoice.netAmount,
      taxAmount: invoice.taxAmount,
      grossAmount: invoice.grossAmount
    });
  }
  return invoices.length;
}

// src/services/invoices/handlers/import-invoices.ts
async function importInvoices(orgId, from, defaultStatus) {
  return importOrgInvoices({ orgId, from, defaultStatus });
}

// src/services/invoices/http/upsert-invoice.ts
async function upsertInvoiceHandler(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const invoice = await upsertInvoice2(body);
    return successResponse(invoice, "Invoice upserted successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("required")) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}

// src/services/invoices/http/get-invoice.ts
async function getInvoiceHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    const invoice = await getInvoice2(id, orgId);
    return successResponse(invoice);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    return serverError(msg);
  }
}

// src/services/invoices/http/list-invoices.ts
async function listInvoicesHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    const filters = {
      status: url.searchParams.get("status") ?? void 0,
      supplierId: url.searchParams.get("supplierId") ?? void 0,
      issuedAfter: url.searchParams.get("issuedAfter") ?? void 0,
      issuedBefore: url.searchParams.get("issuedBefore") ?? void 0,
      page: url.searchParams.has("page") ? Number(url.searchParams.get("page")) : void 0,
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : void 0
    };
    const result = await listInvoices2(orgId, filters);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/invoices/http/update-invoice.ts
async function updateInvoiceHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    const body = await req.json();
    if (!body || typeof body !== "object") return validationError("Invalid request body");
    const invoice = await updateInvoice2(id, orgId, body);
    return successResponse(invoice, "Invoice updated successfully");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    return serverError(msg);
  }
}

// src/services/invoices/http/approve-invoice.ts
async function approveInvoiceHandler(req, context) {
  try {
    if (!context.userId) return unauthorizedResponse();
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    const invoice = await approveInvoice2(id, orgId, context.userId);
    return successResponse(invoice, "Invoice approved");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    if (msg.includes("cannot be approved")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/invoices/http/reject-invoice.ts
async function rejectInvoiceHandler(req, context) {
  try {
    if (!context.userId) return unauthorizedResponse();
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    const invoice = await rejectInvoice2(id, orgId, context.userId);
    return successResponse(invoice, "Invoice rejected");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    if (msg.includes("cannot be rejected")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/invoices/http/pay-invoice.ts
async function payInvoiceHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    const invoice = await payInvoice(id, orgId);
    return successResponse(invoice, "Invoice marked as paid");
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    if (msg.includes("cannot be marked as paid")) return errorResponse(msg, 409 /* CONFLICT */);
    return serverError(msg);
  }
}

// src/services/invoices/http/delete-invoice.ts
async function deleteInvoiceHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    if (!id || !isValidUUID(id)) return validationError("Invalid invoice ID");
    await deleteInvoice2(id, orgId);
    return new Response(null, { status: 204 /* NO_CONTENT */ });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found")) return notFoundResponse("Invoice");
    return serverError(msg);
  }
}

// src/services/invoices/http/sync-invoices.ts
async function syncInvoicesHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    await syncInvoices(orgId);
    return successResponse({ message: "Sync complete" });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/invoices/http/import-invoices.ts
var VALID_STATUSES = ["pending", "approved", "rejected"];
function isValidStatus(value) {
  return typeof value === "string" && VALID_STATUSES.includes(value);
}
function isValidPeriod3(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}
async function importInvoicesHandler(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const orgId = segments[segments.length - 3];
    if (!orgId || !isValidUUID(orgId)) return validationError("Invalid organization ID");
    const body = await req.json();
    const { from, defaultStatus } = body;
    if (!isValidPeriod3(from)) {
      return validationError("from is required and must be in YYYY-MM format");
    }
    if (!isValidStatus(defaultStatus)) {
      return validationError("defaultStatus must be one of: pending, approved, rejected");
    }
    const count = await importInvoices(orgId, from, defaultStatus);
    return successResponse({
      count,
      message: `Successfully imported ${count} invoice${count === 1 ? "" : "s"}`
    });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}

// src/services/invoices/routes.ts
function registerInvoiceRoutes(router2) {
  router2.post(
    "/api/organizations/:orgId/invoices/sync",
    requireAuth(async (req) => syncInvoicesHandler(req))
  );
  router2.post(
    "/api/organizations/:orgId/invoices/import",
    requireAuth(async (req) => importInvoicesHandler(req))
  );
  router2.get(
    "/api/organizations/:orgId/invoices",
    requireAuth(async (req) => listInvoicesHandler(req))
  );
  router2.get(
    "/api/organizations/:orgId/invoices/:id",
    requireAuth(async (req) => getInvoiceHandler(req))
  );
  router2.post(
    "/api/organizations/:orgId/invoices/upsert",
    requireAuth(async (req) => upsertInvoiceHandler(req))
  );
  router2.put(
    "/api/organizations/:orgId/invoices/:id",
    requireAuth(async (req) => updateInvoiceHandler(req))
  );
  router2.patch(
    "/api/organizations/:orgId/invoices/:id/approve",
    requireAuth(async (req, context) => approveInvoiceHandler(req, context))
  );
  router2.patch(
    "/api/organizations/:orgId/invoices/:id/reject",
    requireAuth(async (req, context) => rejectInvoiceHandler(req, context))
  );
  router2.patch(
    "/api/organizations/:orgId/invoices/:id/pay",
    requireAuth(async (req) => payInvoiceHandler(req))
  );
  router2.delete(
    "/api/organizations/:orgId/invoices/:id",
    requireAuth(async (req) => deleteInvoiceHandler(req))
  );
}

// supabase/functions/api/index.ts
var router = new Router();
registerTestRoutes(router);
registerSiiRoutes(router);
registerOrganizationRoutes(router);
registerUserRoutes(router);
registerSupplierRoutes(router);
registerInvoiceRoutes(router);
Deno.serve((req) => router.handle(req));
