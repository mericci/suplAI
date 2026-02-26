export interface Organization {
  id: string;
  legalName: string;
  taxIdentifier: string;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterOrganizationPayload {
  organization: {
    legalName: string;
    taxIdentifier: string;
    taxAuthorityPassword: string;
  };
  adminUser?: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

export interface RegisterOrganizationData {
  organization: Organization;
  user?: { id: string; email: string };
  session?: { access_token: string; refresh_token: string; expires_in: number };
}
