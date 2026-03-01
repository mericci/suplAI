import type { GetSessionTokensResponse } from './types/index.ts';

interface GetSessionTokensParams {
  taxPayerDni: string;
  taxPayerDv: string;
  password: string;
}

const LOGIN_PAGE_URL =
  'https://zeusr.sii.cl//AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi';

const AUTH_POST_URL = 'https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Merge Set-Cookie headers from a Response into an existing cookie map,
 * return the combined "name=value; name=value" cookie string.
 */
function mergeCookies(existing: Map<string, string>, response: Response): Map<string, string> {
  // Deno fetch provides getSetCookie(); fall back to splitting set-cookie header
  const setCookieValues: string[] = (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.()
    ?? (response.headers.get('set-cookie') ?? '').split(',').filter(Boolean);

  for (const raw of setCookieValues) {
    // Each value is "name=value; Path=/; ..." — take only the first pair
    const nameValue = raw.split(';')[0]?.trim() ?? '';
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx > 0) {
      existing.set(nameValue.slice(0, eqIdx).trim(), nameValue.slice(eqIdx + 1).trim());
    }
  }
  return existing;
}

function cookieMapToString(cookies: Map<string, string>): string {
  return Array.from(cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function getSessionTokens({
  taxPayerDni,
  taxPayerDv,
  password,
}: GetSessionTokensParams): Promise<GetSessionTokensResponse> {
  const cookies = new Map<string, string>();

  // ── Step 1: GET the login page ──────────────────────────────────────────
  // This sets session cookies (TS*, dtCookie) required for the POST to succeed.
  const loginPageResp = await fetch(LOGIN_PAGE_URL, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      'Host': 'zeusr.sii.cl',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    },
  });
  mergeCookies(cookies, loginPageResp);

  // Brief pause to appear more like a human browsing
  await new Promise<void>((resolve) => { setTimeout(resolve, 800); });

  // ── Step 2: POST credentials ────────────────────────────────────────────
  // rutcntr must be in dot-formatted RUT: XX.XXX.XXX-DV
  const rutcntr = `${taxPayerDni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${taxPayerDv}`;
  const payload = new URLSearchParams({
    rut: taxPayerDni,
    dv: taxPayerDv,
    referencia: 'https://misiir.sii.cl/cgi_misii/siihome.cgi',
    '411': '',
    rutcntr,
    clave: password,
  });

  const loginResp = await fetch(AUTH_POST_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      'Host': 'zeusr.sii.cl',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://zeusr.sii.cl',
      'Referer': LOGIN_PAGE_URL,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Cookie': cookieMapToString(cookies),
    },
    body: payload.toString(),
  });
  mergeCookies(cookies, loginResp);

  const loginHtml = await loginResp.text();
  if (loginHtml.includes('Transaccion Rechazada')) {
    const errorId = loginHtml.match(/ID:\s*(\d+)/)?.[1] ?? 'Desconocido';
    throw new Error(`Rechazo CT del SII (ID: ${errorId}).`);
  }

  // ── Step 3: Follow referencia → misiir.sii.cl ──────────────────────────
  const misiirResp = await fetch('https://misiir.sii.cl/cgi_misii/siihome.cgi', {
    method: 'GET',
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      'Host': 'misiir.sii.cl',
      'Referer': 'https://zeusr.sii.cl/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-site',
      'Cookie': cookieMapToString(cookies),
    },
  });
  mergeCookies(cookies, misiirResp);

  // ── Step 4: Visit consemitidos to warm up the www4 session (non-fatal) ─
  await fetch('https://www4.sii.cl/consemitidosinternetui/', {
    method: 'GET',
    redirect: 'follow',
    headers: {
      ...BROWSER_HEADERS,
      'Host': 'www4.sii.cl',
      'Referer': 'https://misiir.sii.cl/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-site',
      'Cookie': cookieMapToString(cookies),
    },
  }).then((r) => mergeCookies(cookies, r))
    .catch(() => { /* non-fatal — TOKEN already available from Step 3 */ });

  // ── Step 5: Extract TOKEN from accumulated cookies ──────────────────────
  const siiToken = cookies.get('TOKEN');
  if (!siiToken) {
    throw new Error('TOKEN no encontrado tras autenticación.');
  }

  return { siiToken, cookieString: cookieMapToString(cookies) };
}

export default getSessionTokens;
