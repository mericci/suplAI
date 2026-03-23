/**
 * Main Application Entry Point
 *
 * Creates the router, registers routes from each service, and starts the HTTP server.
 */

import http from 'node:http';
import { Router } from './lib/router.js';
import { logger } from './utils/logger.js';
import 'dotenv/config';
import { registerTestRoutes } from './services/test/routes.js';
import { registerSiiRoutes } from './services/sii/routes.js';
import { registerOrganizationRoutes } from './services/organizations/routes.js';
import { registerUserRoutes } from './services/users/routes.js';
import { registerSupplierRoutes } from './services/suppliers/routes.js';
import { registerInvoiceRoutes } from './services/invoices/routes.js';
import { registerBudgetRoutes } from './services/budget/routes.js';
import { registerNominaRoutes } from './services/nominas/routes.js';
import { registerSettingsRoutes } from './services/settings/routes.js';

const router = new Router();

// Health check (app-level, not tied to a service)
router.get('/health', () => Promise.resolve(
  new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  ),
));

// Route registration lives in each service
registerTestRoutes(router);
registerSiiRoutes(router);
registerOrganizationRoutes(router);
registerUserRoutes(router);
registerSupplierRoutes(router);
registerInvoiceRoutes(router);
registerBudgetRoutes(router);
registerNominaRoutes(router);
registerSettingsRoutes(router);

const port = parseInt(process.env.API_PORT ?? '8000', 10);
const host = process.env.API_HOST ?? 'localhost';

logger.info('Starting server', { host, port });

const server = http.createServer((req, res): void => {
  (async (): Promise<void> => {
    try {
      const url = `http://${req.headers.host ?? host}${req.url ?? '/'}`;
      const body = await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
      });

      const headers = new Headers();
      const nodeHeaders = req.headers;
      Object.entries(nodeHeaders).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      });

      const request = new Request(url, {
        method: req.method ?? 'GET',
        headers,
        body: body.length > 0 ? body : undefined,
      });

      const response = await router.handle(request);

      res.writeHead(
        response.status,
        Object.fromEntries(response.headers.entries()),
      );
      res.end(await response.text());
    } catch (error) {
      logger.error('Server error', { error });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  })().catch((err) => {
    logger.error('Unhandled server error', { error: err });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      `Port ${port} is already in use. Kill the process or set API_PORT to another port.`,
      {
        port,
        hint: `Run: lsof -i :${port} then kill <PID>`,
      },
    );
  } else {
    logger.error('Server error', { error: err });
  }
  process.exit(1);
});

server.listen(port, host, () => {
  logger.info('Server listening', { url: `http://${host}:${port}` });
});
