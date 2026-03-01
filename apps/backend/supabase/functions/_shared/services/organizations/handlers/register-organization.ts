import { registerOrganization as registerOrganizationAction } from '../actions/register-organization.ts';
import type { RegisterOrganizationResult } from '../actions/register-organization.ts';

export async function registerOrganization(
  data: unknown,
): Promise<RegisterOrganizationResult> {
  return registerOrganizationAction(data);
}
