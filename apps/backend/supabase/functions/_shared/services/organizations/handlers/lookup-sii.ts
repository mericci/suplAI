import { lookupSii as lookupSiiAction } from '../actions/lookup-sii.ts';
import type { LookupSiiResult } from '../actions/lookup-sii.ts';

export async function lookupSii(data: unknown): Promise<LookupSiiResult> {
  return lookupSiiAction(data);
}
