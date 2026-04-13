export interface SupplierService {
  id: string;
  supplierId: string;
  organizationId: string;
  serviceCategory: string;
  serviceDescription: string | null;
  costCenterId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
