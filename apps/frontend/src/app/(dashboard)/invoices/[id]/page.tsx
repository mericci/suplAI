'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, AlertCircle, CheckCircle, Clock, XCircle,
  FileText, Upload, Send, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { Invoice, NominaWithInvoiceIds, SupplierPaymentInfo } from '@supl/shared';
import { getMe } from '@/integrations/backend/users/get-me';
import { getInvoice } from '@/integrations/backend/invoices/get-invoice';
import { getOrgInvoices } from '@/integrations/backend/sii/get-org-invoices';
import { getInvoiceEvents } from '@/integrations/backend/invoices/get-invoice-events';
import { getInvoiceComments, createInvoiceComment } from '@/integrations/backend/invoices/get-invoice-comments';
import { getInvoiceDocuments, uploadInvoiceDocument } from '@/integrations/backend/invoices/get-invoice-documents';
import { getInvoiceDistributions } from '@/integrations/backend/invoices/get-invoice-distributions';
import { getInvoiceNomina } from '@/integrations/backend/invoices/get-invoice-nomina';
import { getSupplier } from '@/integrations/backend/suppliers/get-supplier';
import { getSupplierPaymentInfo } from '@/integrations/backend/suppliers/get-supplier-payment-info';
import { listBudgetItems } from '@/integrations/backend/budget/list-budget-items';
import { listCostCenters } from '@/integrations/backend/contabilidad/cost-centers/list-cost-centers';
import { listAccountingIds } from '@/integrations/backend/contabilidad/accounting-ids/list-accounting-ids';
import { getUser } from '@/integrations/backend/users/get-user';
import type { InvoiceComment } from '@/integrations/backend/invoices/get-invoice-comments';
import type { TimelineEvent } from '@/integrations/backend/invoices/get-invoice-events';
import type { InvoiceDocument } from '@/integrations/backend/invoices/get-invoice-documents';
import type { InvoiceDistributions } from '@/integrations/backend/invoices/get-invoice-distributions';
import type { BudgetItemWithSpend } from '@/integrations/backend/budget/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCLP(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', paid: 'Pagada',
};

// Aligned with the status color system used in the invoice list pages
const STATUS_CLASSES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  paid:     'bg-blue-100 text-blue-800 border-blue-200',
};

const EVENT_LABEL: Record<string, string> = {
  created: 'Factura recibida (SII)',
  ai_validated: 'Validada con IA',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  nomina_associated: 'Asociada a nómina',
  paid: 'Pagada',
};

async function resolveUserName(
  userId: string | null,
  orgId: string,
  cache: Map<string, string>,
): Promise<string> {
  if (!userId) return 'Sistema';
  if (cache.has(userId)) return cache.get(userId)!;
  try {
    const res = await getUser(orgId, userId);
    if (res.success && res.data) {
      const name = [res.data.first_name, res.data.last_name].filter(Boolean).join(' ') || res.data.email;
      cache.set(userId, name);
      return name;
    }
  } catch { /* ignore */ }
  return 'Usuario';
}

/* ------------------------------------------------------------------ */
/*  Shared styled primitives                                           */
/* ------------------------------------------------------------------ */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoAlert({ variant, children }: { variant?: 'warning' | 'error'; children: React.ReactNode }) {
  const cls = variant === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-yellow-200 bg-yellow-50 text-yellow-900';
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${cls}`}>
      <AlertTriangle aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="px-4 py-3 border-b"><Skeleton className="h-4 w-32" /></div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Detalles                                                      */
/* ------------------------------------------------------------------ */

function DetailesTab({ invoice, supplierName, orgId }: { invoice: Invoice; supplierName: string; orgId: string }) {
  const [history, setHistory] = useState<Invoice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    getOrgInvoices(orgId, { supplierId: invoice.supplierId, limit: 10, sortBy: 'issue_date', sortDir: 'desc' })
      .then((res) => { if (res.success && res.data) setHistory(res.data.data.filter((i) => i.id !== invoice.id)); })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [invoice.supplierId, invoice.id, orgId]);

  const fields: [string, string][] = [
    ['Proveedor', supplierName],
    ['RUT Emisor', invoice.issuerTaxIdentifier],
    ['RUT Receptor', invoice.receiverTaxIdentifier],
    ['Tipo de Documento', invoice.documentType],
    ['Folio', invoice.documentNumber],
    ['Fecha de Emisión', formatDate(invoice.issueDate)],
    ['Fecha de Vencimiento', formatDate(invoice.dueDate)],
    ['Título Ejecutivo', formatDate(invoice.executiveTitleDate)],
    ['Monto Neto', formatCLP(invoice.netAmount)],
    ['IVA', formatCLP(invoice.taxAmount)],
    ['Monto Bruto', formatCLP(invoice.grossAmount)],
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="Información de la Factura">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Validación IA">
        {invoice.aiValidationStatus === null && (
          <p className="text-sm text-muted-foreground">Aún no validada con IA.</p>
        )}
        {invoice.aiValidationStatus === 'ok' && (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle aria-hidden="true" className="h-4 w-4" /> Aprobada por IA
          </div>
        )}
        {invoice.aiValidationStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <XCircle aria-hidden="true" className="h-4 w-4" /> Observación IA
          </div>
        )}
        {invoice.aiValidationNotes && (
          <p className="mt-2 text-sm text-muted-foreground rounded bg-muted/50 p-2">{invoice.aiValidationNotes}</p>
        )}
        {invoice.status === 'rejected' && (
          <div className="mt-3 flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">
            <XCircle aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0" />
            Esta factura fue rechazada. Ver pestaña Comentarios para el motivo.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Historial del Proveedor">
        {loadingHistory ? <TabSkeleton /> : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay otras facturas de este proveedor.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.documentNumber}</TableCell>
                    <TableCell className="text-xs">{inv.documentType}</TableCell>
                    <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{formatCLP(inv.grossAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${STATUS_CLASSES[inv.status] ?? ''}`}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Timeline                                                      */
/* ------------------------------------------------------------------ */

function TimelineTab({ orgId, invoiceId }: { orgId: string; invoiceId: string }) {
  const [events, setEvents] = useState<(TimelineEvent & { actorName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-component cache so it doesn't persist across org/user sessions
  const userNameCache = useRef(new Map<string, string>());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInvoiceEvents(orgId, invoiceId);
        if (res.success && res.data) {
          const enriched = await Promise.all(
            res.data.map(async (e) => ({
              ...e,
              actorName: await resolveUserName(e.actorUserId, orgId, userNameCache.current),
            })),
          );
          setEvents(enriched);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [orgId, invoiceId]);

  const iconFor = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      created: <FileText aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
      ai_validated: <CheckCircle aria-hidden="true" className="h-4 w-4 text-blue-500" />,
      approved: <CheckCircle aria-hidden="true" className="h-4 w-4 text-green-600" />,
      rejected: <XCircle aria-hidden="true" className="h-4 w-4 text-red-600" />,
      nomina_associated: <Clock aria-hidden="true" className="h-4 w-4 text-orange-500" />,
      paid: <CheckCircle aria-hidden="true" className="h-4 w-4 text-purple-600" />,
    };
    return icons[type] ?? <Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) return <TabSkeleton />;
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No hay eventos registrados.</p>;

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-3 pb-6">
          <div className="absolute -left-4 mt-0.5 h-6 w-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
            {iconFor(event.eventType)}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium">{EVENT_LABEL[event.eventType] ?? event.eventType}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(event.occurredAt)} · {event.actorName ?? 'Sistema'}
              {event.synthetic && <span className="ml-1 opacity-60">(derivado)</span>}
            </p>
            {(event.metadata?.notes as string | undefined) && (
              <p className="mt-1 text-xs text-muted-foreground rounded bg-muted/50 px-2 py-1">{String(event.metadata!.notes)}</p>
            )}
            {(event.metadata?.nomina_id as string | undefined) && (
              <p className="mt-1 text-xs text-muted-foreground">Nómina: <span className="font-mono">{String(event.metadata!.nomina_id).slice(0, 8)}…</span></p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Documentos                                                    */
/* ------------------------------------------------------------------ */

function DocumentosTab({ orgId, invoiceId }: { orgId: string; invoiceId: string }) {
  const [docs, setDocs] = useState<InvoiceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getInvoiceDocuments(orgId, invoiceId)
      .then((res) => { if (res.success && res.data) setDocs(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, invoiceId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadInvoiceDocument(orgId, invoiceId, fd);
      if (res.success && res.data) setDocs((prev) => [res.data!, ...prev]);
      else setUploadError('Error al subir el documento.');
    } catch { setUploadError('Error al subir el documento.'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* XML placeholder — minimal, non-blocking */}
      <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-muted-foreground text-xs">
        <FileText aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>Documento XML del SII — descarga directa próximamente disponible.</span>
      </div>

      <SectionCard title="Documentos Complementarios">
        <div className="flex justify-end mb-3">
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload aria-hidden="true" className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo…' : 'Adjuntar documento'}
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
        {uploadError && (
          <p role="alert" className="text-sm text-red-600 mb-3">{uploadError}</p>
        )}
        {loading ? <TabSkeleton /> : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay documentos adjuntos.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 rounded border px-3 py-2 text-sm">
                <FileText aria-hidden="true" className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  {doc.description && <p className="text-xs text-muted-foreground">{doc.description}</p>}
                  <p className="text-xs text-muted-foreground">{formatDateTime(doc.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Contabilidad                                                  */
/* ------------------------------------------------------------------ */

function ContabilidadTab({ orgId, invoiceId }: { orgId: string; invoiceId: string }) {
  const [distributions, setDistributions] = useState<InvoiceDistributions | null>(null);
  const [ccNames, setCcNames] = useState<Map<string, string>>(new Map());
  const [aidNames, setAidNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [distRes, ccRes, aidRes] = await Promise.all([
          getInvoiceDistributions(orgId, invoiceId),
          listCostCenters(orgId),
          listAccountingIds(orgId),
        ]);
        if (distRes.success && distRes.data) setDistributions(distRes.data);
        if (ccRes.success && ccRes.data) {
          const m = new Map<string, string>();
          ccRes.data.forEach((cc) => m.set(cc.id, `${cc.name} (${cc.externalId})`));
          setCcNames(m);
        }
        if (aidRes.success && aidRes.data) {
          const m = new Map<string, string>();
          aidRes.data.forEach((a) => m.set(a.id, `${a.description} (${a.externalId})`));
          setAidNames(m);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [orgId, invoiceId]);

  if (loading) return <TabSkeleton />;

  const hasCC = (distributions?.costCenters.length ?? 0) > 0;
  const hasAID = (distributions?.accountingIds.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {!hasCC && !hasAID && (
        <InfoAlert>
          Esta factura no tiene distribución contable asignada. El proveedor puede no tener centros de costos o IDs contables configurados, o puede requerir asignación manual.
        </InfoAlert>
      )}

      {hasCC && (
        <SectionCard title="Centros de Costos">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centro de Costo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions!.costCenters.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">{ccNames.get(row.cost_center_id) ?? row.cost_center_id}</TableCell>
                    <TableCell className="text-right text-sm">{formatCLP(row.amount)}</TableCell>
                    <TableCell className="text-right text-sm">{row.percentage != null ? `${row.percentage}%` : '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCLP(distributions!.costCenters.reduce((s, r) => s + r.amount, 0))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {hasAID && (
        <SectionCard title="IDs Contables">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Contable</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions!.accountingIds.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">{aidNames.get(row.accounting_id) ?? row.accounting_id}</TableCell>
                    <TableCell className="text-right text-sm">{formatCLP(row.amount)}</TableCell>
                    <TableCell className="text-right text-sm">{row.percentage != null ? `${row.percentage}%` : '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCLP(distributions!.accountingIds.reduce((s, r) => s + r.amount, 0))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Presupuesto                                                   */
/* ------------------------------------------------------------------ */

function PresupuestoTab({ orgId, supplierId, grossAmount }: { orgId: string; supplierId: string; grossAmount: number | null }) {
  const [budget, setBudget] = useState<BudgetItemWithSpend | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBudgetItems(orgId, 'current_month')
      .then((res) => {
        if (res.success && res.data) setBudget(res.data.find((b) => b.supplierId === supplierId) ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, supplierId]);

  if (loading) return <TabSkeleton />;
  if (budget === null) return <InfoAlert>Este proveedor no tiene una partida presupuestaria asignada.</InfoAlert>;
  if (budget === undefined) return null;

  const amount = grossAmount ?? 0;
  const usedWithout = budget.spentAmount;
  const usedWith = usedWithout + amount;
  const total = budget.scaledBudget;
  const pctWithout = total > 0 ? Math.min(100, (usedWithout / total) * 100) : 0;
  const pctWith = total > 0 ? Math.min(100, (usedWith / total) * 100) : 0;
  const overBudget = usedWith > total;

  return (
    <div className="space-y-4">
      {overBudget && <InfoAlert variant="error">Esta factura supera el presupuesto del mes actual para este proveedor.</InfoAlert>}
      <SectionCard title={budget.name}>
        {budget.description && <p className="text-sm text-muted-foreground mb-3">{budget.description}</p>}
        <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><dt className="text-muted-foreground">Presupuesto Mensual</dt><dd className="font-semibold">{formatCLP(total)}</dd></div>
          <div><dt className="text-muted-foreground">Periodicidad</dt><dd className="font-medium capitalize">{budget.periodicity}</dd></div>
          <div><dt className="text-muted-foreground">Gastado (sin esta factura)</dt><dd className="font-medium">{formatCLP(usedWithout)}</dd></div>
          <div>
            <dt className="text-muted-foreground">Gastado (con esta factura)</dt>
            <dd className={`font-semibold ${overBudget ? 'text-red-600' : 'text-emerald-700'}`}>{formatCLP(usedWith)}</dd>
          </div>
        </dl>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Sin esta factura</span><span>{pctWithout.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pctWithout}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Con esta factura</span><span>{pctWith.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${overBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pctWith}%` }} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Pago                                                          */
/* ------------------------------------------------------------------ */

function PagoTab({ orgId, supplierId, invoiceId, invoice }: { orgId: string; supplierId: string; invoiceId: string; invoice: Invoice }) {
  const [paymentInfo, setPaymentInfo] = useState<SupplierPaymentInfo | null | undefined>(undefined);
  const [nomina, setNomina] = useState<NominaWithInvoiceIds | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSupplierPaymentInfo(orgId, supplierId),
      getInvoiceNomina(orgId, invoiceId),
    ]).then(([piRes, nomRes]) => {
      setPaymentInfo(piRes.success ? (piRes.data ?? null) : null);
      setNomina(nomRes.success ? (nomRes.data ?? null) : null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgId, supplierId, invoiceId]);

  if (loading) return <TabSkeleton />;

  const ACCOUNT_LABELS: Record<string, string> = {
    cuenta_corriente: 'Cuenta Corriente', cuenta_vista: 'Cuenta Vista',
    cuenta_ahorro: 'Cuenta Ahorro', cuenta_rut: 'Cuenta RUT',
  };

  return (
    <div className="space-y-4">
      {!paymentInfo && <InfoAlert>Este proveedor no tiene información de cuenta bancaria registrada.</InfoAlert>}

      {paymentInfo && (
        <SectionCard title="Datos Bancarios del Proveedor">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-muted-foreground">Titular</dt><dd className="font-medium">{paymentInfo.accountHolderName}</dd></div>
            <div><dt className="text-muted-foreground">RUT</dt><dd className="font-medium">{paymentInfo.taxIdentifier}</dd></div>
            <div><dt className="text-muted-foreground">Banco</dt><dd className="font-medium">{paymentInfo.bank}</dd></div>
            <div><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium">{ACCOUNT_LABELS[paymentInfo.accountType] ?? paymentInfo.accountType}</dd></div>
            <div><dt className="text-muted-foreground">Número</dt><dd className="font-medium font-mono">{paymentInfo.accountNumber}</dd></div>
            <div><dt className="text-muted-foreground">Moneda</dt><dd className="font-medium">{paymentInfo.currency}</dd></div>
            {paymentInfo.email && <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{paymentInfo.email}</dd></div>}
          </dl>
        </SectionCard>
      )}

      <SectionCard title="Estado de Pago">
        <div className="flex items-center gap-2 mb-3">
          {invoice.status === 'paid'
            ? <CheckCircle aria-hidden="true" className="h-5 w-5 text-green-600" />
            : <Clock aria-hidden="true" className="h-5 w-5 text-muted-foreground" />}
          <span className="font-medium">{invoice.status === 'paid' ? 'Pagada' : 'Pendiente de pago'}</span>
          {invoice.paidAt && <span className="text-sm text-muted-foreground">— {formatDateTime(invoice.paidAt)}</span>}
        </div>

        {nomina ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Nómina ID</dt>
              <dd className="font-mono text-xs" title={nomina.id}>{nomina.id.slice(0, 8)}…</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estado nómina</dt>
              <dd>
                <Badge variant="outline" className={nomina.status === 'paid' ? STATUS_CLASSES.paid : STATUS_CLASSES.pending}>
                  {nomina.status === 'paid' ? 'Pagada' : 'Pendiente'}
                </Badge>
              </dd>
            </div>
            {nomina.paidAt && <div><dt className="text-muted-foreground">Fecha pago</dt><dd>{formatDateTime(nomina.paidAt)}</dd></div>}
            <div><dt className="text-muted-foreground">Facturas</dt><dd>{nomina.invoiceCount}</dd></div>
            <div><dt className="text-muted-foreground">Total nómina</dt><dd className="font-medium">{formatCLP(nomina.totalAmount)}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Esta factura no está asociada a ninguna nómina.</p>
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Comentarios                                                   */
/* ------------------------------------------------------------------ */

function ComentariosTab({ orgId, invoiceId, onCountChange }: { orgId: string; invoiceId: string; onCountChange: (n: number) => void }) {
  const [comments, setComments] = useState<InvoiceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvoiceComments(orgId, invoiceId)
      .then((res) => {
        if (res.success && res.data) { setComments(res.data); onCountChange(res.data.length); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, invoiceId, onCountChange]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createInvoiceComment(orgId, invoiceId, newComment.trim());
      if (res.success && res.data) {
        const updated = [...comments, res.data];
        setComments(updated);
        onCountChange(updated.length);
        setNewComment('');
      } else { setError('Error al agregar el comentario.'); }
    } catch { setError('Error al agregar el comentario.'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {loading ? <TabSkeleton /> : (
        <>
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No hay comentarios aún.</p>}
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className={`rounded-lg border p-3 ${c.type === 'rejection' ? 'border-red-200 bg-red-50' : 'bg-muted/30'}`}>
                {c.type === 'rejection' && (
                  <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mb-1">
                    <XCircle aria-hidden="true" className="h-3 w-3" /> Motivo de Rechazo
                  </div>
                )}
                <p className="text-sm">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(c.created_at)}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <Textarea
              id="new-comment"
              aria-label="Nuevo comentario"
              placeholder="Agregar un comentario…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              <Send aria-hidden="true" className="h-4 w-4 mr-2" />
              {submitting ? 'Enviando…' : 'Enviar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function InvoiceProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const invoiceId = params.id;

  const [orgId, setOrgId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'detalles');

  const handleCommentCount = useCallback((n: number) => setCommentCount(n), []);

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/pending-invoices');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await getMe();
        if (!meRes.success || !meRes.data) { setError('No se pudo obtener la organización.'); setLoading(false); return; }
        const oid = meRes.data.organization_id;
        setOrgId(oid);

        const invRes = await getInvoice(oid, invoiceId);
        if (!invRes.success || !invRes.data) { setError('No se encontró la factura.'); setLoading(false); return; }
        setInvoice(invRes.data);

        try {
          const supRes = await getSupplier(invRes.data.supplierId);
          if (supRes.success && supRes.data) setSupplierName(supRes.data.legalName);
        } catch { setSupplierName(invRes.data.issuerTaxIdentifier); }

        try {
          const cRes = await getInvoiceComments(oid, invoiceId);
          if (cRes.success && cRes.data) setCommentCount(cRes.data.length);
        } catch { /* ignore */ }
      } catch { setError('Error al cargar la factura.'); }
      setLoading(false);
    };
    load();
  }, [invoiceId]);

  // Update browser tab title when invoice data loads
  useEffect(() => {
    if (invoice && supplierName) {
      document.title = `Factura #${invoice.documentNumber} — ${supplierName} | suplAI`;
    }
    return () => { document.title = 'suplAI'; };
  }, [invoice, supplierName]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 space-y-4">
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {error ?? 'Factura no encontrada.'}
        </div>
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4 mr-2" />Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-muted-foreground mb-2" onClick={handleBack}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4 mr-1" /> Volver
        </Button>
        {/* Two explicit rows prevent ml-auto from breaking on tablet */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-base font-semibold leading-tight truncate">
            {supplierName || invoice.issuerTaxIdentifier}
          </h1>
          <p className="text-base font-bold shrink-0">{formatCLP(invoice.grossAmount)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
          <p className="text-xs text-muted-foreground">{invoice.issuerTaxIdentifier}</p>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-sm text-muted-foreground font-mono">{invoice.documentType} #{invoice.documentNumber}</span>
          <Badge variant="outline" className={STATUS_CLASSES[invoice.status] ?? ''}>
            {STATUS_LABEL[invoice.status] ?? invoice.status}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">Emisión: {formatDate(invoice.issueDate)}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        {/* Mobile: native select */}
        <div className="border-b px-4 py-2 bg-background shrink-0 md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Seleccionar pestaña"
          >
            <option value="detalles">Detalles</option>
            <option value="timeline">Línea de Tiempo</option>
            <option value="documentos">Documentos</option>
            <option value="contabilidad">Contabilidad</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="pago">Pago</option>
            <option value="comentarios">{`Comentarios${commentCount > 0 ? ` (${commentCount})` : ''}`}</option>
          </select>
        </div>

        {/* Desktop: full tab bar */}
        <div className="border-b px-4 bg-background shrink-0 hidden md:block">
          <TabsList variant="line" className="h-10 gap-0 p-0 rounded-none">
            {['detalles', 'timeline', 'documentos', 'contabilidad', 'presupuesto', 'pago'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none h-10 px-4 text-sm"
              >
                {tab === 'timeline' ? 'Línea de Tiempo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="comentarios"
              className="rounded-none h-10 px-4 text-sm"
              aria-label={`Comentarios${commentCount > 0 ? `, ${commentCount} comentarios` : ''}`}
            >
              Comentarios
              {commentCount > 0 && (
                <span aria-hidden="true" className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {commentCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="detalles" className="mt-0">
            {orgId && <DetailesTab invoice={invoice} supplierName={supplierName} orgId={orgId} />}
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            {orgId && <TimelineTab orgId={orgId} invoiceId={invoiceId} />}
          </TabsContent>
          <TabsContent value="documentos" className="mt-0">
            {orgId && <DocumentosTab orgId={orgId} invoiceId={invoiceId} />}
          </TabsContent>
          <TabsContent value="contabilidad" className="mt-0">
            {orgId && <ContabilidadTab orgId={orgId} invoiceId={invoiceId} />}
          </TabsContent>
          <TabsContent value="presupuesto" className="mt-0">
            {orgId && <PresupuestoTab orgId={orgId} supplierId={invoice.supplierId} grossAmount={invoice.grossAmount} />}
          </TabsContent>
          <TabsContent value="pago" className="mt-0">
            {orgId && <PagoTab orgId={orgId} supplierId={invoice.supplierId} invoiceId={invoiceId} invoice={invoice} />}
          </TabsContent>
          <TabsContent value="comentarios" className="mt-0">
            {orgId && <ComentariosTab orgId={orgId} invoiceId={invoiceId} onCountChange={handleCommentCount} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
