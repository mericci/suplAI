import { registerOrganization as registerOrganizationAction } from '../actions/register-organization.js';
import type { RegisterOrganizationResult } from '../actions/register-organization.js';

export async function registerOrganization(
  data: unknown,
): Promise<RegisterOrganizationResult> {
  return registerOrganizationAction(data);
}
