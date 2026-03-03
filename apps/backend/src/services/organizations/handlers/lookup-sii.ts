import { lookupSii as lookupSiiAction } from '../actions/lookup-sii.js';
import type { LookupSiiResult } from '../actions/lookup-sii.js';

export async function lookupSii(data: unknown): Promise<LookupSiiResult> {
  return lookupSiiAction(data);
}
