'use client';

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  LoaderIcon,
  PaperclipIcon,
  PencilIcon,
  ReceiptIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import type { NominaWithInvoiceIds } from '@supl/shared';
import type { Invoice } from '@/integrations/backend/sii';
import type { User } from '@/integrations/backend/users';
import { getOrgInvoices } from '@/integrations/backend/sii';
import { getUser } from '@/integrations/backend/users';
import { getSupplier } from '@/integrations/backend/suppliers';
import { updateNomina, payNomina, deleteNomina } from '@/integrations/backend/nominas';
import type { PayNominaAmountMismatch } from '@/integrations/backend/nominas';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { NOMINA_STATUS, NOMINA_STATUS_LABELS } from '../constants';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatCLP(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getUserDisplayName(user: User | null): string {
  if (!user) return '—';
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return full || user.email;
}

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface EnrichedInvoice extends Invoice {
  supplierName: string;
}

interface SupplierBreakdownEntry {
  supplierId: string;
  supplierName: string;
  count: number;
  subtotal: number;
}

interface NominaProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomina: NominaWithInvoiceIds | null;
  orgId: string;
  isAdmin: boolean;
  lockedInvoiceIds: Set<string>;
  onNominaUpdated: (updated: NominaWithInvoiceIds) => void;
  onNominaPaid: (paid: NominaWithInvoiceIds) => void;
  onNominaDeleted: (id: string) => void;
  onViewVoucher?: (nomina: NominaWithInvoiceIds) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function NominaProfileSheet({
  open,
  onOpenChange,
  nomina,
  orgId,
  isAdmin,
  lockedInvoiceIds,
  onNominaUpdated,
  onNominaPaid,
  onNominaDeleted,
  onViewVoucher,
}: NominaProfileSheetProps): React.JSX.Element | null {
  const supplierNameCache = useRef(new Map<string, string>());

  // View state
  const [invoiceDetails, setInvoiceDetails] = useState<EnrichedInvoice[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [creatorUser, setCreatorUser] = useState<User | null>(null);
  const [paidByUser, setPaidByUser] = useState<User | null>(null);
  const [supplierBreakdown, setSupplierBreakdown] = useState<SupplierBreakdownEntry[]>([]);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedInvoiceIds, setEditedInvoiceIds] = useState<Set<string>>(new Set());
  const [availableInvoices, setAvailableInvoices] = useState<EnrichedInvoice[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [editSearch, setEditSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedEditSearch, setDebouncedEditSearch] = useState('');

  // Pay dialog state (inline)
  const [showPaySection, setShowPaySection] = useState(false);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMismatch, setPayMismatch] = useState<PayNominaAmountMismatch | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Delete confirm dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ---- Helpers ----------------------------------------------------- */

  const resolveSupplierNames = useCallback(
    async (invoices: Invoice[]): Promise<Map<string, string>> => {
      const ids = [...new Set(invoices.map((inv) => inv.supplierId))];
      const uncached = ids.filter((id) => !supplierNameCache.current.has(id));
      const results = await Promise.all(uncached.map((id) => getSupplier(id)));
      results.forEach((r, i) => {
        if (r.success && r.data) supplierNameCache.current.set(uncached[i], r.data.legalName);
      });
      return supplierNameCache.current;
    },
    [],
  );

  const buildBreakdown = useCallback((enriched: EnrichedInvoice[]): SupplierBreakdownEntry[] => {
    const map = new Map<string, SupplierBreakdownEntry>();
    enriched.forEach((inv) => {
      const entry = map.get(inv.supplierId) ?? {
        supplierId: inv.supplierId,
        supplierName: inv.supplierName,
        count: 0,
        subtotal: 0,
      };
      entry.count += 1;
      entry.subtotal += inv.grossAmount ?? 0;
      map.set(inv.supplierId, entry);
    });
    return [...map.values()].sort((a, b) => b.subtotal - a.subtotal);
  }, []);

  /* ---- Load details on open --------------------------------------- */

  useEffect(() => {
    if (!open || !nomina) return;

    setIsEditMode(false);
    setEditedInvoiceIds(new Set(nomina.invoiceIds));
    setBreakdownOpen(false);
    setShowPaySection(false);
    setPayFile(null);
    setPayMismatch(null);
    setPayError(null);
    setEditSearch('');
    setEditError(null);

    const load = async (): Promise<void> => {
      setLoadingDetails(true);
      try {
        const { invoiceIds } = nomina;

        // Fetch invoices
        const allInvoices: Invoice[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          // eslint-disable-next-line no-await-in-loop
          const res = await getOrgInvoices(orgId, { page, limit: 200 });
          if (!res.success || !res.data) break;
          allInvoices.push(...res.data.data.filter((inv) => invoiceIds.includes(inv.id)));
          totalPages = res.data.pagination.totalPages;
          page += 1;
        } while (page <= totalPages && allInvoices.length < invoiceIds.length);

        const nameMap = await resolveSupplierNames(allInvoices);
        const enriched = allInvoices.map((inv) => ({
          ...inv,
          supplierName: nameMap.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
        }));
        setInvoiceDetails(enriched);
        setSupplierBreakdown(buildBreakdown(enriched));

        // Fetch creator user
        const creatorRes = await getUser(orgId, nomina.createdByUserId);
        setCreatorUser(creatorRes.success && creatorRes.data ? creatorRes.data : null);

        // Fetch paid-by user if applicable
        if (nomina.paidByUserId) {
          const paidRes = await getUser(orgId, nomina.paidByUserId);
          setPaidByUser(paidRes.success && paidRes.data ? paidRes.data : null);
        } else {
          setPaidByUser(null);
        }
      } finally {
        setLoadingDetails(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nomina?.id]);

  /* ---- Load available invoices when entering edit mode ------------ */

  const loadAvailableInvoices = useCallback(async (): Promise<void> => {
    if (!nomina) return;
    setLoadingAvailable(true);
    try {
      const allInvoices: Invoice[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        // eslint-disable-next-line no-await-in-loop
        const res = await getOrgInvoices(orgId, { page, limit: 200, status: 'approved' });
        if (!res.success || !res.data) break;
        allInvoices.push(...res.data.data);
        totalPages = res.data.pagination.totalPages;
        page += 1;
      } while (page <= totalPages);

      // Include invoices that are in THIS nomina (not locked by others) or not locked at all
      const currentNominaIds = new Set(nomina.invoiceIds);
      const available = allInvoices.filter(
        (inv) => currentNominaIds.has(inv.id) || !lockedInvoiceIds.has(inv.id),
      );

      const nameMap = await resolveSupplierNames(available);
      setAvailableInvoices(available.map((inv) => ({
        ...inv,
        supplierName: nameMap.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
      })));
    } finally {
      setLoadingAvailable(false);
    }
  }, [nomina, orgId, lockedInvoiceIds, resolveSupplierNames]);

  const handleEnterEditMode = async (): Promise<void> => {
    setIsEditMode(true);
    setEditedInvoiceIds(new Set(nomina?.invoiceIds ?? []));
    setEditError(null);
    await loadAvailableInvoices();
  };

  /* ---- Edit search debounce --------------------------------------- */

  const handleEditSearchChange = (value: string): void => {
    setEditSearch(value);
    if (editSearchDebounce.current) clearTimeout(editSearchDebounce.current);
    editSearchDebounce.current = setTimeout(() => setDebouncedEditSearch(value), 250);
  };

  /* ---- Save edit -------------------------------------------------- */

  const handleSaveEdit = async (): Promise<void> => {
    if (!nomina) return;
    if (editedInvoiceIds.size === 0) {
      setEditError('Debes incluir al menos una factura');
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await updateNomina(orgId, nomina.id, [...editedInvoiceIds]);
      if (!res.success || !res.data) {
        setEditError(res.error ?? 'Error al guardar cambios');
        return;
      }
      onNominaUpdated(res.data);
      setIsEditMode(false);
      // Update local invoice details to match new list
      const newIds = new Set(res.data.invoiceIds);
      setInvoiceDetails((prev) => prev.filter((inv) => newIds.has(inv.id)));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Pay -------------------------------------------------------- */

  const handlePayConfirm = async (): Promise<void> => {
    if (!nomina || !payFile) return;
    setPaying(true);
    setPayMismatch(null);
    setPayError(null);
    try {
      const result = await payNomina(orgId, nomina.id, payFile);
      if (!result.success) {
        if (result.error === 'amount_mismatch' && result.mismatch) {
          setPayMismatch(result.mismatch);
          return;
        }
        setPayError(result.error ?? 'Error al procesar el pago');
        return;
      }
      if (result.data) {
        onNominaPaid(result.data);
        onOpenChange(false);
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setPaying(false);
    }
  };

  /* ---- Delete ----------------------------------------------------- */

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!nomina) return;
    setDeleting(true);
    try {
      await deleteNomina(orgId, nomina.id);
      onNominaDeleted(nomina.id);
      onOpenChange(false);
    } catch {
      // no-op
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  /* ---- Copy ID ---------------------------------------------------- */

  const handleCopyId = (): void => {
    if (!nomina) return;
    navigator.clipboard.writeText(nomina.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ---- Computed --------------------------------------------------- */

  const overdueInvoices = invoiceDetails.filter(
    (inv) => inv.dueDate && isOverdue(inv.dueDate),
  );

  const editTotal = [...editedInvoiceIds].reduce((sum, id) => {
    const inv = availableInvoices.find((i) => i.id === id);
    return sum + (inv?.grossAmount ?? 0);
  }, 0);

  const filteredAvailable = debouncedEditSearch
    ? availableInvoices.filter(
      (inv) => inv.supplierName.toLowerCase().includes(debouncedEditSearch.toLowerCase())
        || inv.documentNumber.toLowerCase().includes(debouncedEditSearch.toLowerCase()),
    )
    : availableInvoices;

  const isPending = nomina?.status === NOMINA_STATUS.PENDING;
  const isPaid = nomina?.status === NOMINA_STATUS.PAID;

  if (!nomina) return null;

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="flex flex-col gap-1.5">
                <SheetTitle className="text-base">
                  Nómina
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-muted-foreground font-mono">
                    {nomina.id.slice(0, 8)}…
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar ID completo"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                  </button>
                  {copied && (
                    <span className="text-xs text-emerald-600">Copiado</span>
                  )}
                </div>
              </div>
              <Badge variant={isPaid ? 'default' : 'secondary'}>
                {NOMINA_STATUS_LABELS[nomina.status] ?? nomina.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mt-1">
              <span>
                {'Creada el '}
                <strong className="text-foreground">{formatDate(nomina.createdAt)}</strong>
              </span>
              <span>
                {'Por '}
                <strong className="text-foreground">{getUserDisplayName(creatorUser)}</strong>
              </span>
              {isPaid && nomina.paidAt && (
                <span>
                  {'Pagada el '}
                  <strong className="text-foreground">{formatDate(nomina.paidAt)}</strong>
                </span>
              )}
              {isPaid && paidByUser && (
                <span>
                  {'Por '}
                  <strong className="text-foreground">{getUserDisplayName(paidByUser)}</strong>
                </span>
              )}
            </div>
          </SheetHeader>

          {/* Summary stats */}
          <div className="flex items-center gap-6 px-5 py-3 bg-muted/30 border-b">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
              <p className="text-lg font-semibold">
                {isEditMode ? formatCLP(editTotal) : formatCLP(nomina.totalAmount)}
              </p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Facturas</p>
              <p className="text-lg font-semibold">
                {isEditMode ? editedInvoiceIds.size : nomina.invoiceCount}
              </p>
            </div>
            {overdueInvoices.length > 0 && !isEditMode && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-1.5 text-amber-600">
                  <TriangleAlertIcon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">
                    {overdueInvoices.length}
                    {' vencida'}
                    {overdueInvoices.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Main scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {loadingDetails && (
              <div className="flex items-center justify-center py-16">
                <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingDetails && !isEditMode && (
              <div className="flex flex-col">
                {/* Overdue warning banner */}
                {overdueInvoices.length > 0 && (
                  <div className="mx-5 mt-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
                    <TriangleAlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>
                        {overdueInvoices.length}
                        {overdueInvoices.length !== 1 ? ' facturas vencidas' : ' factura vencida'}
                      </strong>
                      {' — la fecha de vencimiento de pago ya pasó.'}
                    </span>
                  </div>
                )}

                {/* Invoice list */}
                <div className="px-5 pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Facturas incluidas</p>
                  {invoiceDetails.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No hay facturas cargadas.</p>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proveedor</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-center hidden sm:table-cell">Vencimiento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceDetails.map((inv) => {
                            const overdue = inv.dueDate && isOverdue(inv.dueDate);
                            return (
                              <TableRow key={inv.id} className={overdue ? 'bg-amber-50/50' : undefined}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium leading-tight">{inv.supplierName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {`N° ${inv.documentNumber}`}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  {formatCLP(inv.grossAmount)}
                                </TableCell>
                                <TableCell className="text-center text-xs hidden sm:table-cell">
                                  <span className={cn(overdue && 'text-amber-600 font-medium')}>
                                    {formatDate(inv.dueDate)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Supplier breakdown */}
                {supplierBreakdown.length > 1 && (
                  <div className="px-5 mt-4">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setBreakdownOpen((v) => !v)}
                    >
                      {breakdownOpen
                        ? <ChevronDownIcon className="h-4 w-4" />
                        : <ChevronRightIcon className="h-4 w-4" />}
                      Desglose por proveedor
                    </button>
                    {breakdownOpen && (
                      <div className="mt-2 rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Proveedor</TableHead>
                              <TableHead className="text-center">Facturas</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierBreakdown.map((entry) => (
                              <TableRow key={entry.supplierId}>
                                <TableCell className="text-sm font-medium">{entry.supplierName}</TableCell>
                                <TableCell className="text-center text-sm">{entry.count}</TableCell>
                                <TableCell className="text-right text-sm font-medium">{formatCLP(entry.subtotal)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {/* Pay section (inline, only for pending + admin) */}
                {isAdmin && isPending && showPaySection && (
                  <div className="px-5 mt-4">
                    <Separator className="mb-4" />
                    <p className="text-sm font-medium mb-2">Subir comprobante de pago</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {'Total esperado: '}
                      <strong className="text-foreground">{formatCLP(nomina.totalAmount)}</strong>
                    </p>
                    <label
                      htmlFor="sheet-voucher-file"
                      className={cn(
                        'flex items-center gap-2 cursor-pointer rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors',
                        payFile && 'border-solid border-primary/50 bg-primary/5 text-foreground',
                      )}
                    >
                      <PaperclipIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {payFile ? payFile.name : 'Seleccionar archivo (PDF o imagen)'}
                      </span>
                      <input
                        id="sheet-voucher-file"
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setPayFile(f);
                          setPayMismatch(null);
                          setPayError(null);
                        }}
                      />
                    </label>

                    {payMismatch && (
                      <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        <p className="font-medium">El monto del comprobante no coincide</p>
                        <p>
                          {'Monto extraído: '}
                          <strong>{formatCLP(payMismatch.extracted)}</strong>
                        </p>
                        <p>
                          {'Monto esperado: '}
                          <strong>{formatCLP(payMismatch.expected)}</strong>
                        </p>
                      </div>
                    )}

                    {payError && !payMismatch && (
                      <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        {payError}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handlePayConfirm}
                        disabled={!payFile || paying}
                      >
                        {paying && <LoaderIcon className="h-4 w-4 animate-spin" />}
                        Confirmar pago
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowPaySection(false);
                          setPayFile(null);
                          setPayMismatch(null);
                          setPayError(null);
                        }}
                        disabled={paying}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="h-4" />
              </div>
            )}

            {/* Edit mode */}
            {!loadingDetails && isEditMode && (
              <div className="flex flex-col px-5 pt-4">
                {editError && (
                  <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {editError}
                  </div>
                )}

                {/* Current invoices */}
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {`Facturas en esta nómina (${editedInvoiceIds.size})`}
                </p>
                {editedInvoiceIds.size === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Sin facturas.</p>
                ) : (
                  <div className="rounded-md border overflow-hidden mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proveedor / Folio</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableInvoices
                          .filter((inv) => editedInvoiceIds.has(inv.id))
                          .map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium leading-tight">{inv.supplierName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {`N° ${inv.documentNumber}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {formatCLP(inv.grossAmount)}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => setEditedInvoiceIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(inv.id);
                                    return next;
                                  })}
                                  title="Quitar de la nómina"
                                >
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Available invoices to add */}
                <p className="text-sm font-medium text-muted-foreground mb-2">Agregar facturas disponibles</p>
                <Input
                  placeholder="Buscar proveedor o folio..."
                  value={editSearch}
                  onChange={(e) => handleEditSearchChange(e.target.value)}
                  className="mb-2"
                />

                {loadingAvailable ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Proveedor / Folio</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAvailable
                          .filter((inv) => !editedInvoiceIds.has(inv.id))
                          .slice(0, 50)
                          .map((inv) => (
                            <TableRow
                              key={inv.id}
                              className="cursor-pointer hover:bg-accent/50"
                              onClick={() => setEditedInvoiceIds(
                                (prev) => new Set([...prev, inv.id]),
                              )}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={false}
                                  onCheckedChange={() => setEditedInvoiceIds(
                                    (prev) => new Set([...prev, inv.id]),
                                  )}
                                  aria-label={`Agregar ${inv.documentNumber}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium leading-tight">{inv.supplierName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {`N° ${inv.documentNumber}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {formatCLP(inv.grossAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredAvailable.filter(
                          (inv) => !editedInvoiceIds.has(inv.id),
                        ).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                              No hay más facturas disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="h-4" />
              </div>
            )}
          </div>

          {/* Footer actions */}
          <SheetFooter className="border-t px-5 py-4">
            {!isEditMode && isPending && isAdmin && !showPaySection && (
              <div className="flex flex-wrap gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleEnterEditMode}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Editar facturas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowPaySection(true)}
                >
                  <ReceiptIcon className="h-3.5 w-3.5" />
                  Marcar como pagada
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Eliminar
                </Button>
              </div>
            )}

            {!isEditMode && isPaid && onViewVoucher && (
              <div className="flex gap-2 w-full">
                {nomina.voucherStoragePath && nomina.voucherStorageBucket && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onViewVoucher(nomina)}
                  >
                    <ReceiptIcon className="h-3.5 w-3.5" />
                    Ver comprobante
                  </Button>
                )}
              </div>
            )}

            {isEditMode && (
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={saving || editedInvoiceIds.size === 0}
                >
                  {saving && <LoaderIcon className="h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedInvoiceIds(new Set(nomina.invoiceIds));
                    setEditError(null);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nómina?</AlertDialogTitle>
            <AlertDialogDescription>
              Las facturas volverán a estar disponibles para nuevas nóminas.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <LoaderIcon className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
