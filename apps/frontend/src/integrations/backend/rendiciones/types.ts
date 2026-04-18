export type {
  Rendicion,
  RendicionDocument,
  RendicionStatus,
  BackingType,
  RendicionDocumentValidationStatus,
  UserPaymentInfo,
  AccountType,
} from '@supl/shared';

export interface RendicionListResponse {
  rendiciones: import('@supl/shared').Rendicion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadDocumentResult {
  document: import('@supl/shared').RendicionDocument;
  totalAmount: number;
}
