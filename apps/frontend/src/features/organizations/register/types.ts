export interface OrgFields {
  legalName: string;
  taxIdentifier: string;
  taxAuthorityPassword: string;
}

export interface AdminFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface FormState {
  org: OrgFields;
  adminUser: AdminFields;
  includeAdmin: boolean;
}

export interface FormErrors {
  org: Partial<Record<keyof OrgFields, string>>;
  adminUser: Partial<Record<keyof AdminFields, string>>;
}

export type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';
