/**
 * Hello World Action
 *
 * Simple test action that returns a greeting message
 */

import { logger } from '../../../utils/logger.js';

export interface HelloWorldResponse {
  message: string;
  timestamp: string;
  environment: string;
}

/**
 * Returns a hello world message with environment info
 */
export function helloWorld(name?: string): HelloWorldResponse {
  logger.info('Hello World action called', { name });

  const greeting = name ? `Hello, ${name}!` : 'Hello, World!';

  return {
    message: greeting,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  };
}
