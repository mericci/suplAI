import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import type { Store } from 'tough-cookie';
import { GetSessionTokensResponse } from './types';

interface GetSessionTokensParams {
  taxPayerDni: string;
  taxPayerDv: string;
  password: string;
}

const LOGIN_PAGE_URL =
  'https://zeusr.sii.cl//AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi';

const AUTH_POST_URL =
  'https://zeusr.sii.cl/cgi_AUT2000/CAutInicio.cgi';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
};


async function getSessionTokens({
  taxPayerDni,
  taxPayerDv,
  password,
}: GetSessionTokensParams): Promise<GetSessionTokensResponse> {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({ jar, withCredentials: true, maxRedirects: 10 }),
  );

  // ── Step 1: GET the login page ──────────────────────────────────────────
  // This sets session cookies (TS*, dtCookie) and embeds the CT token in the
  // HTML form — both are required for the POST to succeed.
  await client.get(LOGIN_PAGE_URL, {
    headers: {
      ...BROWSER_HEADERS,
      Host: 'zeusr.sii.cl',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    },
  });

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
  }).toString();

  const loginResponse = await client.post(AUTH_POST_URL, payload, {
    headers: {
      ...BROWSER_HEADERS,
      Host: 'zeusr.sii.cl',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://zeusr.sii.cl',
      Referer: LOGIN_PAGE_URL,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
    },
  });

  const loginHtml = loginResponse.data as string;
  if (loginHtml.includes('Transaccion Rechazada')) {
    const errorId = loginHtml.match(/ID:\s*(\d+)/)?.[1] ?? 'Desconocido';
    throw new Error(`Rechazo CT del SII (ID: ${errorId}).`);
  }

  // ── Step 3: Follow referencia → misiir.sii.cl ──────────────────────────
  const misiirResp = await client.get('https://misiir.sii.cl/cgi_misii/siihome.cgi', {
    headers: {
      ...BROWSER_HEADERS,
      Host: 'misiir.sii.cl',
      Referer: 'https://zeusr.sii.cl/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-site',
    },
  });
  const misiirHtml: string = typeof misiirResp.data === 'string' ? misiirResp.data : '';

  // ── Step 4: Visit consemitidos to warm up the www4 session ────────────
  // Non-fatal: TOKEN is already set by Step 3. This GET may 503 occasionally.
  await client.get('https://www4.sii.cl/consemitidosinternetui/', {
    headers: {
      ...BROWSER_HEADERS,
      Host: 'www4.sii.cl',
      Referer: 'https://misiir.sii.cl/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-site',
    },
  }).catch(() => { /* non-fatal — TOKEN already available from Step 3 */ });

  // ── Step 5: Collect TOKEN from all cookies in the jar ──────────────────
  // SII may set the TOKEN cookie on different subdomains depending on the
  // redirect chain, so we scan the entire jar instead of specific domains.
  const allCookies = await new Promise<{ key: string; value: string }[]>((resolve, reject) => {
    (jar.store as Store).getAllCookies((err, cookies) => {
      if (err) reject(err);
      else resolve((cookies ?? []) as { key: string; value: string }[]);
    });
  });

  const tokenCookie = allCookies.find((c) => c.key === 'TOKEN');
  if (!tokenCookie) {
    throw new Error('TOKEN no encontrado tras autenticación.');
  }

  return { siiToken: tokenCookie.value, client, legalName: parseLegalName(misiirHtml) };
}

/**
 * Attempt to extract the company's razón social from the Mi SII home page HTML.
 * Returns null if the pattern is not found (non-fatal — user can type it manually).
 */
function parseLegalName(html: string): string | null {
  if (!html) return null;

  // The SII home page embeds taxpayer data as a JS variable: DatosCntrNow = {...}
  // Extract razonSocial from that JSON blob — most reliable source.
  const match = html.match(/"razonSocial"\s*:\s*"([^"]+)"/);
  if (match) {
    return match[1].replace(/\s+/g, ' ').trim();
  }

  return null;
}

export default getSessionTokens;
