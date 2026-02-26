/**
 * Hello World Handler
 *
 * Exposes the hello world action
 */

import { helloWorld as helloWorldAction } from '../actions/hello-world.js';

/**
 * Handler that exposes the hello world action
 */
export function helloWorld(name?: string): ReturnType<typeof helloWorldAction> {
  return helloWorldAction(name);
}
