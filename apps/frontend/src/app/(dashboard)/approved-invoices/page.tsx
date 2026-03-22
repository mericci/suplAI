'use client';

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
  XIcon,
  CheckCircle2Icon,
  XCircleIcon,
  DownloadIcon,
  LoaderIcon,
  PaperclipIcon,
} from 'lucide-react';
import type { NominaWithInvoiceIds } from '@supl/shared';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { getOrgInvoices } from '@/integrations/backend/sii';
import type { Invoice } from '@/integrations/backend/sii';
import { getMe, getUser } from '@/integrations/backend/users';
import type { User } from '@/integrations/backend/users';
import {
  getSupplier, listSuppliersByOrg, getSupplierPaymentInfo,
} from '@/integrations/backend/suppliers';
import type { Supplier } from '@/integrations/backend/suppliers';
import {
  listNominas,
  createNomina,
  deleteNomina,
  payNomina,
  getLockedInvoiceIds,
} from '@/integrations/backend/nominas';
import type { PayNominaAmountMismatch } from '@/integrations/backend/nominas';
import { cn } from '@/lib/utils';
import { NOMINA_STATUS, NOMINA_STATUS_LABELS, NOMINA_TAB } from '@/features/nominas/constants';

const PAGE_SIZE = 10;

type AmountOp = 'gte' | 'lte' | 'eq';

interface Filters {
  supplierId: string;
  amountOp: AmountOp;
  amountValue: string;
}

const DEFAULT_FILTERS: Filters = {
  supplierId: 'all',
  amountOp: 'gte',
  amountValue: '',
};

type SortDirection = 'desc' | 'asc' | null;
interface SortConfig { column: string | null; direction: SortDirection; }
const DEFAULT_SORT: SortConfig = { column: null, direction: null };

const COLUMN_TO_DB: Record<string, string> = {
  tipo: 'document_type',
  monto: 'gross_amount',
  emision: 'issue_date',
  aprobado_el: 'approved_at',
  plazo: 'executive_title_date',
};

let cachedOrgId: string | null = null;
let cachedUserRole: string | null = null;
const supplierNameCache = new Map<string, string>();
const userCache = new Map<string, User>();

interface EnrichedInvoice extends Invoice {
  supplierName: string;
  approver: User | null;
  aiValidated: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PayDialogState {
  open: boolean;
  nomina: NominaWithInvoiceIds | null;
  file: File | null;
  uploading: boolean;
  mismatch: PayNominaAmountMismatch | null;
  error: string | null;
}

interface DeleteDialogState {
  open: boolean;
  nomina: NominaWithInvoiceIds | null;
  deleting: boolean;
}

function formatCLP(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getUserInitials(user: User): string {
  const first = user.first_name?.[0] ?? '';
  const last = user.last_name?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return user.email[0]?.toUpperCase() ?? '?';
}

function getUserDisplayName(user: User): string {
  const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return full || user.email;
}

/** Seeded deterministic pseudo-random — same logic as pending-invoices */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0;
  }
  return Math.abs(hash);
}

function computeAiValidated(invoiceId: string): boolean {
  const aiOptions = [
    'Validado',
    'Nuevo proveedor',
    'Monto erróneo',
    'Supera presupuesto',
    'Error de revisión',
  ] as const;
  return aiOptions[seededRandom(invoiceId) % aiOptions.length] === 'Validado';
}

function deadlineClass(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) return 'text-red-600 font-medium';
  if (daysLeft <= 3) return 'text-amber-600 font-medium';
  return 'text-foreground';
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cuenta_corriente: 'Cuenta Corriente',
  cuenta_vista: 'Cuenta Vista',
  cuenta_ahorro: 'Cuenta Ahorro',
  cuenta_rut: 'Cuenta RUT',
};

export default function ApprovedInvoicesPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>(NOMINA_TAB.FACTURAS);
  const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [creatingNomina, setCreatingNomina] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [lockedInvoiceIds, setLockedInvoiceIds] = useState<Set<string>>(new Set());
  const [nominas, setNominas] = useState<NominaWithInvoiceIds[]>([]);
  const [nominasLoading, setNominasLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payDialog, setPayDialog] = useState<PayDialogState>({
    open: false,
    nomina: null,
    file: null,
    uploading: false,
    mismatch: null,
    error: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    nomina: null,
    deleting: false,
  });
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSortChangeRef = useRef(false);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(value);
    }, 350);
  };

  const handleSort = (column: string): void => {
    isSortChangeRef.current = true;
    setCurrentPage(1);
    setSortConfig((prev) => {
      if (prev.column !== column) return { column, direction: 'desc' };
      if (prev.direction === 'desc') return { column, direction: 'asc' };
      return DEFAULT_SORT;
    });
  };

  const getOrgId = useCallback(async (): Promise<string | null> => {
    if (cachedOrgId) return cachedOrgId;
    const meResponse = await getMe();
    if (!meResponse.success || !meResponse.data) return null;
    cachedOrgId = meResponse.data.organization_id;
    cachedUserRole = meResponse.data.role;
    return cachedOrgId;
  }, []);

  const refreshLockedIds = useCallback(async (orgId: string): Promise<void> => {
    const res = await getLockedInvoiceIds(orgId);
    if (res.success && res.data) {
      setLockedInvoiceIds(new Set(res.data));
    }
  }, []);

  const refreshNominas = useCallback(async (orgId: string): Promise<void> => {
    setNominasLoading(true);
    try {
      const res = await listNominas(orgId);
      if (res.success && res.data) setNominas(res.data);
    } finally {
      setNominasLoading(false);
    }
  }, []);

  // Load user, suppliers, locked IDs and nominas on mount
  useEffect(() => {
    const init = async (): Promise<void> => {
      const orgId = await getOrgId();
      if (!orgId) return;

      if (cachedUserRole) setIsAdmin(cachedUserRole === 'admin');

      const suppliersRes = await listSuppliersByOrg(orgId, { limit: 100 });
      if (suppliersRes.success) setSuppliers(suppliersRes.data);

      await Promise.all([
        refreshLockedIds(orgId),
        refreshNominas(orgId),
      ]);
    };
    init();
  }, [getOrgId, refreshLockedIds, refreshNominas]);

  useEffect(() => {
    const fetchInvoices = async (): Promise<void> => {
      try {
        const isSortChange = isSortChangeRef.current;
        isSortChangeRef.current = false;
        if (!isSortChange) setLoading(true);
        setError(null);

        const orgId = await getOrgId();
        if (!orgId) {
          setError('Error al obtener usuario');
          return;
        }

        const isProveedorSort = sortConfig.column === 'proveedor';
        const params: Parameters<typeof getOrgInvoices>[1] = {
          page: isProveedorSort ? 1 : currentPage,
          limit: isProveedorSort ? 500 : PAGE_SIZE,
          status: 'approved',
        };

        if (appliedFilters.supplierId !== 'all') {
          params.supplierId = appliedFilters.supplierId;
        }
        const amtVal = parseFloat(appliedFilters.amountValue);
        if (!Number.isNaN(amtVal) && appliedFilters.amountValue !== '') {
          if (appliedFilters.amountOp === 'gte') params.grossAmountGte = amtVal;
          else if (appliedFilters.amountOp === 'lte') params.grossAmountLte = amtVal;
          else params.grossAmountEq = amtVal;
        }
        if (!isProveedorSort && sortConfig.column && sortConfig.direction) {
          params.sortBy = COLUMN_TO_DB[sortConfig.column];
          params.sortDir = sortConfig.direction;
        }

        const res = await getOrgInvoices(orgId, params);
        if (!res.success || !res.data) {
          setError('Error al cargar facturas');
          return;
        }

        const items = res.data.data;

        // Resolve supplier names
        const uniqueSupplierIds = [...new Set(items.map((inv) => inv.supplierId))];
        const uncachedSuppliers = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
        const supplierResults = await Promise.all(
          uncachedSuppliers.map((id) => getSupplier(id)),
        );
        supplierResults.forEach((r, i) => {
          if (r.success && r.data) supplierNameCache.set(uncachedSuppliers[i], r.data.legalName);
        });

        // Resolve approver user data
        const approverIds = [
          ...new Set(
            items
              .map((inv) => inv.approvedByUserId)
              .filter((id): id is string => id !== null),
          ),
        ];
        const uncachedApprovers = approverIds.filter((id) => !userCache.has(id));
        const userResults = await Promise.all(
          uncachedApprovers.map((id) => getUser(id)),
        );
        userResults.forEach((r, i) => {
          if (r.success && r.data) userCache.set(uncachedApprovers[i], r.data);
        });

        let enriched: EnrichedInvoice[] = items.map((inv) => ({
          ...inv,
          supplierName: supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
          approver: inv.approvedByUserId ? (userCache.get(inv.approvedByUserId) ?? null) : null,
          aiValidated: computeAiValidated(inv.id),
        }));

        if (isProveedorSort && sortConfig.direction) {
          enriched = enriched.sort((a, b) => {
            const cmp = a.supplierName.localeCompare(b.supplierName, 'es');
            return sortConfig.direction === 'asc' ? cmp : -cmp;
          });
          const start = (currentPage - 1) * PAGE_SIZE;
          setInvoices(enriched.slice(start, start + PAGE_SIZE));
          setPagination({
            page: currentPage,
            limit: PAGE_SIZE,
            total: enriched.length,
            totalPages: Math.ceil(enriched.length / PAGE_SIZE),
          });
        } else {
          setInvoices(enriched);
          setPagination({
            page: currentPage,
            limit: PAGE_SIZE,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage, appliedFilters, debouncedSearch, getOrgId, sortConfig]);

  const handleApplyFilters = (): void => {
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
    setShowFilters(false);
  };

  const handleClearFilters = (): void => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const activeFilterCount = [
    appliedFilters.supplierId !== 'all',
    appliedFilters.amountValue !== '',
  ].filter(Boolean).length;

  const filtered = invoices.filter(
    (inv) => !debouncedSearch
      || inv.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.documentNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inv.issuerTaxIdentifier.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const totalApproved = filtered.reduce((sum, inv) => sum + (inv.grossAmount ?? 0), 0);

  // Unlocked invoices on current page
  const unlockedOnPage = filtered.filter((inv) => !lockedInvoiceIds.has(inv.id));
  const allUnlockedSelected = unlockedOnPage.length > 0
    && unlockedOnPage.every((inv) => selectedInvoiceIds.has(inv.id));

  const handleHeaderCheckboxChange = (checked: boolean): void => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      unlockedOnPage.forEach((inv) => {
        if (checked) next.add(inv.id);
        else next.delete(inv.id);
      });
      return next;
    });
  };

  const handleRowCheckboxChange = (id: string, checked: boolean): void => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const generateCsv = (
    allInvs: Invoice[],
    paymentInfoMap: Map<string, Awaited<ReturnType<typeof getSupplierPaymentInfo>>['data']>,
  ): void => {
    const headers = [
      'Nombre proveedor', 'Rut', 'Monto', 'Banco',
      'Tipo de cuenta bancaria', 'Número cuenta bancaria', 'Correo proveedor',
    ];
    const rows = allInvs.map((inv) => {
      const pi = paymentInfoMap.get(inv.supplierId);
      return [
        supplierNameCache.get(inv.supplierId) ?? inv.issuerTaxIdentifier,
        inv.issuerTaxIdentifier,
        inv.grossAmount?.toString() ?? '',
        pi?.bank ?? '',
        pi?.accountType ? (ACCOUNT_TYPE_LABELS[pi.accountType] ?? pi.accountType) : '',
        pi?.accountNumber ?? '',
        pi?.email ?? '',
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina-aprobadas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateAndDownloadNomina = async (): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId) return;
    setCreatingNomina(true);
    try {
      const ids = selectedInvoiceIds.size > 0 ? [...selectedInvoiceIds] : [];
      const res = await createNomina(orgId, { invoiceIds: ids });
      if (!res.success || !res.data) {
        setError('Error al crear nómina');
        return;
      }

      const nomina = res.data;

      // Fetch the invoices that belong to this nomina for CSV
      const invoiceIdsForCsv = nomina.invoiceIds;
      const allInvoicesForCsv: Invoice[] = [];
      let page = 1;
      const limit = 500;
      let totalPages = 1;
      do {
        // eslint-disable-next-line no-await-in-loop
        const r = await getOrgInvoices(orgId, { page, limit, status: 'approved' });
        if (!r.success || !r.data) break;
        allInvoicesForCsv.push(...r.data.data.filter((inv) => invoiceIdsForCsv.includes(inv.id)));
        totalPages = r.data.pagination.totalPages;
        page += 1;
      } while (page <= totalPages && allInvoicesForCsv.length < invoiceIdsForCsv.length);

      // Resolve supplier names for any not yet cached
      const uniqueSupplierIds = [...new Set(allInvoicesForCsv.map((inv) => inv.supplierId))];
      const uncachedSuppliers = uniqueSupplierIds.filter((id) => !supplierNameCache.has(id));
      const supplierResults = await Promise.all(uncachedSuppliers.map((id) => getSupplier(id)));
      supplierResults.forEach((r, i) => {
        if (r.success && r.data) supplierNameCache.set(uncachedSuppliers[i], r.data.legalName);
      });

      // Fetch payment info
      const paymentInfoMap = new Map<string, Awaited<ReturnType<typeof getSupplierPaymentInfo>>['data']>();
      await Promise.all(
        uniqueSupplierIds.map(async (id) => {
          const r = await getSupplierPaymentInfo(orgId, id);
          paymentInfoMap.set(id, r.success ? r.data : null);
        }),
      );

      generateCsv(allInvoicesForCsv, paymentInfoMap);

      // Refresh state
      await Promise.all([refreshLockedIds(orgId), refreshNominas(orgId)]);
      setSelectedInvoiceIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear nómina');
    } finally {
      setCreatingNomina(false);
    }
  };

  // Pay nomina
  const handlePayConfirm = async (): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId || !payDialog.nomina || !payDialog.file) return;
    setPayDialog((s) => ({
      ...s, uploading: true, mismatch: null, error: null,
    }));
    try {
      const result = await payNomina(orgId, payDialog.nomina.id, payDialog.file);
      if (!result.success) {
        if (result.error === 'amount_mismatch' && result.mismatch) {
          setPayDialog((s) => ({ ...s, uploading: false, mismatch: result.mismatch! }));
          return;
        }
        setPayDialog((s) => ({
          ...s,
          uploading: false,
          error: result.error ?? 'Error al procesar el pago',
        }));
        return;
      }
      setPayDialog({
        open: false,
        nomina: null,
        file: null,
        uploading: false,
        mismatch: null,
        error: null,
      });
      await Promise.all([refreshLockedIds(orgId), refreshNominas(orgId)]);
    } catch (err) {
      setPayDialog((s) => ({
        ...s,
        uploading: false,
        error: err instanceof Error ? err.message : 'Error al procesar el pago',
      }));
    }
  };

  // Delete nomina
  const handleDeleteConfirm = async (): Promise<void> => {
    const orgId = await getOrgId();
    if (!orgId || !deleteDialog.nomina) return;
    setDeleteDialog((s) => ({ ...s, deleting: true }));
    try {
      await deleteNomina(orgId, deleteDialog.nomina.id);
      setDeleteDialog({ open: false, nomina: null, deleting: false });
      await Promise.all([refreshLockedIds(orgId), refreshNominas(orgId)]);
    } catch {
      setDeleteDialog((s) => ({ ...s, deleting: false }));
    }
  };

  function SortIcon({ column }: { column: string }): React.JSX.Element {
    if (sortConfig.column !== column) {
      return <ChevronsUpDownIcon className="inline h-3.5 w-3.5 ml-1 text-muted-foreground/40" aria-hidden="true" />;
    }
    return sortConfig.direction === 'desc'
      ? <ChevronDownIcon className="inline h-4 w-4 ml-1 text-primary" aria-hidden="true" />
      : <ChevronUpIcon className="inline h-4 w-4 ml-1 text-primary" aria-hidden="true" />;
  }

  function getSortAriaValue(col: string): 'ascending' | 'descending' | 'none' {
    if (sortConfig.column !== col) return 'none';
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  }

  function NominaStatusBadge({ status }: { status: string }): React.JSX.Element {
    const isPaid = status === NOMINA_STATUS.PAID;
    return (
      <Badge variant={isPaid ? 'default' : 'secondary'}>
        {NOMINA_STATUS_LABELS[status] ?? status}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-lg font-semibold">Aprobadas</h1>
        </header>

        {/* Summary card */}
        <div className="flex gap-4 border-b px-4 py-3">
          <div className="rounded-lg border bg-emerald-50 px-4 py-2">
            <p className="text-xs text-emerald-700">Por pagar (aprobadas)</p>
            <p className="text-lg font-semibold text-emerald-800">{formatCLP(totalApproved)}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="border-b px-4 pt-2">
            <TabsList variant="line">
              <TabsTrigger value={NOMINA_TAB.FACTURAS}>Facturas Aprobadas</TabsTrigger>
              <TabsTrigger value={NOMINA_TAB.NOMINAS}>Nóminas</TabsTrigger>
            </TabsList>
          </div>

          {/* Facturas tab */}
          <TabsContent value={NOMINA_TAB.FACTURAS} className="flex flex-col flex-1 min-h-0">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedor o folio..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setShowFilters((v) => !v)}
              >
                <FilterIcon className="h-4 w-4" />
                Filtrar
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={handleCreateAndDownloadNomina}
                  disabled={creatingNomina}
                >
                  {creatingNomina
                    ? <LoaderIcon className="h-4 w-4 animate-spin" />
                    : <DownloadIcon className="h-4 w-4" />}
                  {creatingNomina ? 'Creando...' : 'Crear y descargar nómina'}
                </Button>
              )}
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Proveedor</span>
                    <Select
                      value={filters.supplierId}
                      onValueChange={(v) => setFilters((f) => ({ ...f, supplierId: v }))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Todos los proveedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los proveedores</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.legalName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Monto bruto</span>
                    <div className="flex gap-2">
                      <Select
                        value={filters.amountOp}
                        onValueChange={(v) => setFilters((f) => ({
                          ...f, amountOp: v as AmountOp,
                        }))}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gte">&gt;=</SelectItem>
                          <SelectItem value="lte">&lt;=</SelectItem>
                          <SelectItem value="eq">=</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.amountValue}
                        onChange={(e) => setFilters((f) => ({ ...f, amountValue: e.target.value }))}
                        className="w-[120px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApplyFilters}>Aplicar</Button>
                    <Button size="sm" variant="ghost" onClick={handleClearFilters} className="gap-1">
                      <XIcon className="h-3 w-3" />
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <p className="text-muted-foreground">Cargando facturas...</p>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-20">
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {isAdmin && (
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={allUnlockedSelected}
                                onCheckedChange={(v) => handleHeaderCheckboxChange(Boolean(v))}
                                disabled={unlockedOnPage.length === 0}
                                aria-label="Seleccionar todas"
                              />
                            </TableHead>
                          )}
                          <TableHead
                            aria-sort={getSortAriaValue('proveedor')}
                            className="min-w-[180px] cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('proveedor')}
                          >
                            Proveedor<SortIcon column="proveedor" />
                          </TableHead>
                          <TableHead
                            aria-sort={getSortAriaValue('tipo')}
                            className="cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('tipo')}
                          >
                            Tipo<SortIcon column="tipo" />
                          </TableHead>
                          <TableHead
                            aria-sort={getSortAriaValue('monto')}
                            className="text-right cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('monto')}
                          >
                            Monto<SortIcon column="monto" />
                          </TableHead>
                          <TableHead
                            aria-sort={getSortAriaValue('emision')}
                            className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('emision')}
                          >
                            Emisión<SortIcon column="emision" />
                          </TableHead>
                          <TableHead
                            aria-sort={getSortAriaValue('aprobado_el')}
                            className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('aprobado_el')}
                          >
                            Aprobado el<SortIcon column="aprobado_el" />
                          </TableHead>
                          <TableHead className="text-center">Aprobado por</TableHead>
                          <TableHead className="text-center">IA</TableHead>
                          <TableHead
                            aria-sort={getSortAriaValue('plazo')}
                            className="hidden lg:table-cell text-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSort('plazo')}
                          >
                            Plazo<SortIcon column="plazo" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((inv) => {
                          const isLocked = lockedInvoiceIds.has(inv.id);
                          const onCheckChange = (v: boolean | 'indeterminate'): void => {
                            handleRowCheckboxChange(inv.id, !!v);
                          };
                          return (
                            <TableRow key={inv.id} className={isLocked ? 'opacity-60' : ''}>
                              {isAdmin && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedInvoiceIds.has(inv.id)}
                                    onCheckedChange={onCheckChange}
                                    disabled={isLocked}
                                    aria-label={`Seleccionar factura ${inv.documentNumber}`}
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate max-w-[180px]">
                                      {inv.supplierName}
                                    </span>
                                    {isLocked && (
                                      <Badge variant="secondary" className="text-xs shrink-0">
                                        En nómina
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {inv.issuerTaxIdentifier}
                                    {' · N° '}
                                    {inv.documentNumber}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="whitespace-nowrap">
                                  {inv.documentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-center">
                                <span className="text-sm">{formatDate(inv.issueDate)}</span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-center">
                                <span className="text-sm">{formatDate(inv.approvedAt)}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {inv.approver ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-7 w-7 cursor-default">
                                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                            {getUserInitials(inv.approver)}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-left">
                                        <p className="font-medium">{getUserDisplayName(inv.approver)}</p>
                                        <p className="text-muted-foreground">{inv.approver.email}</p>
                                        <p className="capitalize text-muted-foreground">
                                          {inv.approver.role}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {inv.aiValidated ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <CheckCircle2Icon className="h-4 w-4 text-emerald-600 mx-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>Validado por IA</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <XCircleIcon className="h-4 w-4 text-red-500 mx-auto" />
                                    </TooltipTrigger>
                                    <TooltipContent>No validado por IA</TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-center">
                                <span className={cn('text-sm', deadlineClass(inv.executiveTitleDate))}>
                                  {formatDate(inv.executiveTitleDate)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-10 text-muted-foreground">
                              No hay facturas aprobadas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="flex flex-col gap-3 p-4 md:hidden">
                    {filtered.map((inv) => {
                      const isLocked = lockedInvoiceIds.has(inv.id);
                      return (
                        <div key={inv.id} className={cn('rounded-lg border bg-card p-4 shadow-sm', isLocked && 'opacity-60')}>
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{inv.supplierName}</span>
                                {isLocked && (
                                  <Badge variant="secondary" className="text-xs">En nómina</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {inv.issuerTaxIdentifier}
                                {' · N° '}
                                {inv.documentNumber}
                              </span>
                            </div>
                            {isAdmin && !isLocked && (
                              <Checkbox
                                checked={selectedInvoiceIds.has(inv.id)}
                                onCheckedChange={(v) => handleRowCheckboxChange(inv.id, Boolean(v))}
                                aria-label={`Seleccionar factura ${inv.documentNumber}`}
                              />
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{inv.documentType}</Badge>
                            <span className="text-sm font-medium">{formatCLP(inv.grossAmount)}</span>
                          </div>
                          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>
                                {'Emisión: '}
                                <strong>{formatDate(inv.issueDate)}</strong>
                              </span>
                              <span className={cn(deadlineClass(inv.executiveTitleDate))}>
                                {'Plazo: '}
                                <strong>{formatDate(inv.executiveTitleDate)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>
                                {'Aprobado: '}
                                <strong>{formatDate(inv.approvedAt)}</strong>
                              </span>
                              <div className="flex items-center gap-1">
                                {inv.approver && (
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                      {getUserInitials(inv.approver)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                {inv.aiValidated
                                  ? <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                                  : <XCircleIcon className="h-3.5 w-3.5 text-red-500" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filtered.length === 0 && (
                      <p className="py-10 text-center text-muted-foreground">
                        No hay facturas aprobadas
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Pagination footer */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {`Página ${pagination.page} de ${pagination.totalPages}`
                    + ` — ${pagination.total} facturas`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pagination.totalPages || loading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Nóminas tab */}
          <TabsContent value={NOMINA_TAB.NOMINAS} className="flex flex-col flex-1 min-h-0 overflow-auto">
            <div className="p-4">
              {nominasLoading && (
                <div className="flex items-center justify-center py-20">
                  <p className="text-muted-foreground">Cargando nóminas...</p>
                </div>
              )}
              {!nominasLoading && (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">N° Facturas</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        {isAdmin && <TableHead className="w-[60px]">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nominas.map((nom) => (
                        <TableRow key={nom.id}>
                          <TableCell>
                            <span className="text-sm">{formatDate(nom.createdAt)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-medium">{formatCLP(nom.totalAmount)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">{nom.invoiceCount}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <NominaStatusBadge status={nom.status} />
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {nom.status === NOMINA_STATUS.PENDING && (
                                    <DropdownMenuItem
                                      onClick={() => setPayDialog({
                                        open: true,
                                        nomina: nom,
                                        file: null,
                                        uploading: false,
                                        mismatch: null,
                                        error: null,
                                      })}
                                    >
                                      Marcar como pagada
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteDialog({
                                      open: true, nomina: nom, deleting: false,
                                    })}
                                  >
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {nominas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-muted-foreground">
                            No hay nóminas creadas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Mobile nóminas */}
              {!nominasLoading && (
                <div className="flex flex-col gap-3 md:hidden">
                  {nominas.map((nom) => (
                    <div key={nom.id} className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{formatDate(nom.createdAt)}</span>
                          <span className="text-xs text-muted-foreground">
                            {nom.invoiceCount}
                            {' facturas'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <NominaStatusBadge status={nom.status} />
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {nom.status === NOMINA_STATUS.PENDING && (
                                  <DropdownMenuItem
                                    onClick={() => setPayDialog({
                                      open: true,
                                      nomina: nom,
                                      file: null,
                                      uploading: false,
                                      mismatch: null,
                                      error: null,
                                    })}
                                  >
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteDialog({
                                    open: true, nomina: nom, deleting: false,
                                  })}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-lg font-semibold">{formatCLP(nom.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                  {nominas.length === 0 && (
                    <p className="py-10 text-center text-muted-foreground">No hay nóminas creadas</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Pay Nómina Dialog */}
        <Dialog
          open={payDialog.open}
          onOpenChange={(open) => {
            if (!open && !payDialog.uploading) {
              setPayDialog({
                open: false,
                nomina: null,
                file: null,
                uploading: false,
                mismatch: null,
                error: null,
              });
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Marcar nómina como pagada</DialogTitle>
            </DialogHeader>
            {payDialog.nomina && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {'Total nómina: '}
                  <strong className="text-foreground">
                    {formatCLP(payDialog.nomina.totalAmount)}
                  </strong>
                  {` (${payDialog.nomina.invoiceCount} facturas)`}
                </p>

                {/* File input */}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="voucher-file">
                    Comprobante de pago
                  </label>
                  <label
                    htmlFor="voucher-file"
                    className={cn(
                      'flex items-center gap-2 cursor-pointer rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors',
                      payDialog.file && 'border-solid border-primary/50 bg-primary/5 text-foreground',
                    )}
                  >
                    <PaperclipIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {payDialog.file ? payDialog.file.name : 'Seleccionar archivo (PDF o imagen)'}
                    </span>
                    <input
                      id="voucher-file"
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPayDialog((s) => ({
                          ...s,
                          file: f,
                          mismatch: null,
                          error: null,
                        }));
                      }}
                    />
                  </label>
                </div>

                {/* Amount mismatch error */}
                {payDialog.mismatch && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <p className="font-medium">El monto del comprobante no coincide</p>
                    <p>
                      {'Monto extraído: '}
                      <strong>{formatCLP(payDialog.mismatch.extracted)}</strong>
                    </p>
                    <p>
                      {'Monto esperado: '}
                      <strong>{formatCLP(payDialog.mismatch.expected)}</strong>
                    </p>
                  </div>
                )}

                {/* General error */}
                {payDialog.error && !payDialog.mismatch && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {payDialog.error}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPayDialog({
                  open: false,
                  nomina: null,
                  file: null,
                  uploading: false,
                  mismatch: null,
                  error: null,
                })}
                disabled={payDialog.uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePayConfirm}
                disabled={!payDialog.file || payDialog.uploading}
              >
                {payDialog.uploading && <LoaderIcon className="h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Nómina AlertDialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => {
            if (!open && !deleteDialog.deleting) {
              setDeleteDialog({ open: false, nomina: null, deleting: false });
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar nómina?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la nómina. Las facturas asociadas quedarán disponibles
                para ser incluidas en una nueva nómina.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteDialog.deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={handleDeleteConfirm}
                disabled={deleteDialog.deleting}
              >
                {deleteDialog.deleting && <LoaderIcon className="h-4 w-4 animate-spin" />}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
