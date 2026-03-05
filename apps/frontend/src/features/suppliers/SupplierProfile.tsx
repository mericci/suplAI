'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingIcon,
  FileTextIcon,
  PlusIcon,
  ReceiptIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  getSupplier,
  listSupplierDocuments,
} from '@/integrations/backend/suppliers';
import type { Supplier, SupplierDocument } from '@/integrations/backend/suppliers';
import { getMe } from '@/integrations/backend/users';
import { getOrgInvoices } from '@/integrations/backend/sii/get-org-invoices';
import type { Invoice } from '@supl/shared';
import { CreateSupplierSheet } from './CreateSupplierSheet';
import { DocumentPreviewSheet } from './DocumentPreviewSheet';

interface SupplierProfileProps {
  supplierId: string;
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<Invoice['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  paid: 'Pagada',
  rejected: 'Rechazada',
};

const STATUS_BADGE_CLASS: Record<Invoice['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_CARD_CLASS: Record<Invoice['status'], string> = {
  pending: 'border-amber-200 bg-amber-50',
  approved: 'border-green-200 bg-green-50',
  paid: 'border-blue-200 bg-blue-50',
  rejected: 'border-red-200 bg-red-50',
};

const STATUS_COUNT_CLASS: Record<Invoice['status'], string> = {
  pending: 'text-amber-700',
  approved: 'text-green-700',
  paid: 'text-blue-700',
  rejected: 'text-red-700',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Factura',
  credit_note: 'Nota de crédito',
  debit_note: 'Nota de débito',
  receipt: 'Boleta',
};

function docTypeLabel(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function InvoicesSection({
  invoices,
  invoiceTotal,
  loading,
}: {
  invoices: Invoice[];
  invoiceTotal: number;
  loading: boolean;
}): React.JSX.Element {
  const statusOrder: Invoice['status'][] = ['pending', 'approved', 'paid', 'rejected'];

  const statusCounts = invoices.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Facturas
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
          <div className="h-32 animate-pulse rounded-lg border bg-muted" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <ReceiptIcon className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No hay facturas registradas</p>
        </div>
      ) : (
        <>
          {/* Status summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statusOrder.map((s) => {
              const count = statusCounts[s] ?? 0;
              if (s === 'rejected' && count === 0) return null;
              return (
                <div
                  key={s}
                  className={`rounded-lg border px-3 py-2.5 ${STATUS_CARD_CLASS[s]}`}
                >
                  <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p>
                  <p className={`text-2xl font-bold tabular-nums ${STATUS_COUNT_CLASS[s]}`}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          {invoiceTotal > 100 && (
            <p className="text-xs text-muted-foreground">
              Mostrando 100 de {invoiceTotal} facturas más recientes
            </p>
          )}

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Documento
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Fecha emisión
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Monto bruto
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {docTypeLabel(inv.documentType)} #{inv.documentNumber}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {inv.grossAmount != null ? formatCLP(inv.grossAmount) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {docTypeLabel(inv.documentType)} #{inv.documentNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</p>
                  </div>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
                {inv.grossAmount != null && (
                  <p className="mt-1.5 text-sm font-semibold tabular-nums">
                    {formatCLP(inv.grossAmount)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ServiceCard({
  doc,
  index,
  supplierId,
}: {
  doc: SupplierDocument;
  index: number;
  supplierId: string;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Servicio {index + 1}</span>
        {doc.serviceCategory && (
          <Badge variant="secondary">{doc.serviceCategory}</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {doc.serviceDescription && (
          <p className="text-sm text-muted-foreground">{doc.serviceDescription}</p>
        )}

        {/* Tariff + Amounts */}
        {(doc.tariffType || doc.amounts.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {doc.tariffType && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Estructura tarifaria
                </p>
                <Badge variant="outline" className="text-xs">{doc.tariffType}</Badge>
                {doc.tariffDetail && (
                  <p className="mt-2 text-xs text-muted-foreground">{doc.tariffDetail}</p>
                )}
              </div>
            )}

            {doc.amounts.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Montos
                </p>
                <div className="space-y-1">
                  {doc.amounts.map((a, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{a.concept}</span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatCLP(a.amount)}
                        {a.currency !== 'CLP' && ` ${a.currency}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document */}
        <div className="border-t pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Documento de respaldo
          </p>
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{doc.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {doc.documentType ? `${doc.documentType} · ` : ''}
                {formatDate(doc.createdAt)}
              </p>
            </div>
            <DocumentPreviewSheet
              supplierId={supplierId}
              docId={doc.id}
              fileName={doc.fileName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplierProfile({ supplierId }: SupplierProfileProps): React.JSX.Element {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setInvoicesLoading(true);

        const [supplierRes, docsRes, invoicesRes] = await Promise.all([
          getSupplier(supplierId),
          listSupplierDocuments(supplierId),
          (async () => {
            const meRes = await getMe();
            if (!meRes.success || !meRes.data) return null;
            return getOrgInvoices(meRes.data.organization_id, {
              supplierId,
              limit: 100,
            });
          })(),
        ]);

        if (!supplierRes.success || !supplierRes.data) {
          setError('No se encontró el proveedor.');
          return;
        }

        setSupplier(supplierRes.data);
        setDocuments(docsRes.success ? (docsRes.data ?? []) : []);

        if (invoicesRes?.success && invoicesRes.data) {
          setInvoices(invoicesRes.data.data);
          setInvoiceTotal(invoicesRes.data.pagination.total);
        }
      } catch {
        setError('Error al cargar el proveedor.');
      } finally {
        setLoading(false);
        setInvoicesLoading(false);
      }
    };

    fetchData();
  }, [supplierId, refreshKey]);

  function handleDocumentAdded(): void {
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Link href="/providers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Cargando proveedor...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Link href="/providers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive">{error ?? 'Proveedor no encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Link
          href="/providers"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al listado
        </Link>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          {/* Supplier info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <BuildingIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{supplier.legalName}</h1>
                <p className="text-sm text-muted-foreground">RUT: {supplier.taxIdentifier}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {documents.length === 0
                    ? 'Sin servicios asociados'
                    : `${documents.length} ${documents.length === 1 ? 'servicio asociado' : 'servicios asociados'}`}
                </p>
              </div>
            </div>

            <CreateSupplierSheet
              supplierId={supplierId}
              onSuccess={handleDocumentAdded}
              trigger={
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Agregar documento
                </Button>
              }
            />
          </div>

          <Separator />

          {/* Invoices */}
          <InvoicesSection
            invoices={invoices}
            invoiceTotal={invoiceTotal}
            loading={invoicesLoading}
          />

          <Separator />

          {/* Documents / Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Servicios
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FileTextIcon className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No hay documentos registrados para este proveedor
                </p>
                <p className="text-xs text-muted-foreground">
                  Haz clic en &quot;Agregar documento&quot; para subir
                  {' '}contratos, boletas o cotizaciones.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc, idx) => (
                  <ServiceCard
                    key={doc.id}
                    doc={doc}
                    index={idx}
                    supplierId={supplierId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
