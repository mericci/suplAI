'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingIcon,
  FileTextIcon,
  PlusIcon,
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

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const [supplierRes, docsRes] = await Promise.all([
          getSupplier(supplierId),
          listSupplierDocuments(supplierId),
        ]);

        if (!supplierRes.success || !supplierRes.data) {
          setError('No se encontró el proveedor.');
          return;
        }

        setSupplier(supplierRes.data);
        setDocuments(docsRes.success ? (docsRes.data ?? []) : []);
      } catch {
        setError('Error al cargar el proveedor.');
      } finally {
        setLoading(false);
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

          {/* Documents / Services */}
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
  );
}
