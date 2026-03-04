export interface SupplierDocumentAmount {
  amount: number;
  currency: string;
  concept: string;
  frequency: string;
}

export interface SupplierDocument {
  id: string;
  supplierId: string;
  fileName: string;
  storagePath: string;
  storageBucket: string;
  documentType: string | null;
  serviceCategory: string | null;
  serviceDescription: string | null;
  tariffType: string | null;
  tariffDetail: string | null;
  amounts: SupplierDocumentAmount[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExtractedDocumentData {
  supplierName: string | null;
  supplierRut: string | null;
  documentType: string | null;
  serviceDescription: string | null;
  serviceCategory: string | null;
  tariffType: string | null;
  tariffDetail: string | null;
  amounts: SupplierDocumentAmount[];
}
