'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, SaveIcon,
  InfoIcon, BotIcon, BellIcon, ScaleIcon, ShieldIcon, BuildingIcon,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getMe } from '@/integrations/backend/users';
import { listSuppliersByOrg } from '@/integrations/backend/suppliers';
import {
  getSettings, updateSettings,
  getSupplierSettings, updateSupplierSettings,
} from '@/integrations/backend/settings';
import type { Supplier } from '@/integrations/backend/suppliers';
import type {
  OrganizationRule, UpsertOrganizationRulePayload,
  MeritoAction, MeritoCompletedAction, AiApproveAction,
} from '@supl/shared';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MERITO_ACTION_OPTIONS: { value: MeritoAction; label: string }[] = [
  { value: 'nothing', label: 'Sin acción' },
  { value: 'reject_supl_only', label: 'Rechazar en SuplAI' },
  { value: 'reject_sii_and_supl', label: 'Rechazar en SuplAI y SII' },
];

const MERITO_COMPLETED_OPTIONS: { value: MeritoCompletedAction; label: string }[] = [
  { value: 'wait_manual', label: 'Esperar acción manual' },
  { value: 'auto_approve', label: 'Aprobar automáticamente' },
  { value: 'nothing', label: 'No hacer nada' },
];

const AI_APPROVE_OPTIONS: { value: AiApproveAction; label: string }[] = [
  { value: 'nothing', label: 'Solo notificar (sin acción automática)' },
  { value: 'mark_approved', label: 'Aprobar automáticamente' },
];

const SYSTEM_DEFAULTS: UpsertOrganizationRulePayload = {
  minAmount: 0,
  maxAmount: null,
  aiTolerancePct: 5,
  aiMaxAmount: null,
  notifySiiOnApprove: false,
  notifySiiOnReject: false,
  meritoAction: 'nothing',
  meritoDaysBefore: null,
  meritoAlertEnabled: false,
  meritoAlertDaysBefore: null,
  meritoAlertEmails: null,
  meritoCompletedAction: 'wait_manual',
  aiApproveAction: 'nothing',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Local wrapper adding a stable key for React reconciliation */
interface RuleEntry {
  localId: string;
  payload: UpsertOrganizationRulePayload;
}

function newEntry(payload: UpsertOrganizationRulePayload): RuleEntry {
  return { localId: crypto.randomUUID(), payload };
}

function ruleToPayload(r: OrganizationRule): UpsertOrganizationRulePayload {
  return {
    minAmount: r.minAmount,
    maxAmount: r.maxAmount,
    aiTolerancePct: r.aiTolerancePct,
    aiMaxAmount: r.aiMaxAmount,
    notifySiiOnApprove: r.notifySiiOnApprove,
    notifySiiOnReject: r.notifySiiOnReject,
    meritoAction: r.meritoAction,
    meritoDaysBefore: r.meritoDaysBefore,
    meritoAlertEnabled: r.meritoAlertEnabled,
    meritoAlertDaysBefore: r.meritoAlertDaysBefore,
    meritoAlertEmails: r.meritoAlertEmails,
    meritoCompletedAction: r.meritoCompletedAction,
    aiApproveAction: r.aiApproveAction,
  };
}

function toEntries(rules: OrganizationRule[]): RuleEntry[] {
  if (rules.length === 0) return [newEntry({ ...SYSTEM_DEFAULTS })];
  return rules.map((r) => newEntry(ruleToPayload(r)));
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

function SectionHeader({ icon, title, description, accent }: SectionHeaderProps): React.JSX.Element {
  return (
    <div className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 ${accent}`}>
      <div className="mt-0.5 shrink-0 opacity-70" aria-hidden="true">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

interface RuleCardProps {
  entry: RuleEntry;
  /** true = base/catch-all rule: hide amount range inputs, enforce min=0 max=null */
  isBase: boolean;
  index: number;
  totalRules: number;
  onChange: (localId: string, rule: UpsertOrganizationRulePayload) => void;
  onRemove: (localId: string) => void;
}

function RuleCard({ entry, isBase, index, totalRules, onChange, onRemove }: RuleCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const { localId, payload: rule } = entry;
  const uid = useId();
  const canDelete = !isBase || totalRules > 1;
  const contentId = `${uid}-content`;

  function set<K extends keyof UpsertOrganizationRulePayload>(
    key: K,
    value: UpsertOrganizationRulePayload[K],
  ): void {
    onChange(localId, { ...rule, [key]: value });
  }

  const emailsStr = rule.meritoAlertEmails?.join(', ') ?? '';

  const rangeLabel = isBase
    ? 'Predeterminada — todas las facturas'
    : rule.maxAmount != null
      ? `${rule.minAmount.toLocaleString('es-CL')} — ${rule.maxAmount.toLocaleString('es-CL')} CLP`
      : rule.minAmount > 0
        ? `Desde ${rule.minAmount.toLocaleString('es-CL')} CLP en adelante`
        : 'Todas las facturas';

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm ${isBase ? 'border-border' : 'border-border/60'}`}>
      {/* Header row — expand toggle + delete as sibling buttons */}
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          className="flex flex-1 items-center gap-2.5 text-left min-w-0"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          {isBase ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Base
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rango {index}
            </span>
          )}
          <span className="flex-1 truncate text-sm font-medium">{rangeLabel}</span>

          {/* Quick-glance summary badges */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              IA {rule.aiTolerancePct}%
            </span>
            {rule.notifySiiOnApprove && (
              <span className="rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 text-[11px] font-medium">ACD</span>
            )}
            {rule.notifySiiOnReject && (
              <span className="rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 text-[11px] font-medium">RCD</span>
            )}
            {rule.meritoAction !== 'nothing' && (
              <span className="rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 text-[11px] font-medium">Mérito</span>
            )}
          </div>

          {expanded
            ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            : <ChevronDownIcon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />}
        </button>

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={`Eliminar ${isBase ? 'regla base' : `rango ${index}`}`}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este rango?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará la configuración para &ldquo;{rangeLabel}&rdquo;. Los cambios no son permanentes hasta que guardes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onRemove(localId)}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {expanded && (
        <div id={contentId} className="border-t divide-y divide-border/50">

          {/* Amount range — only for non-base rules */}
          {!isBase && (
            <div className="px-4 py-4 space-y-3">
              <SectionHeader
                icon={<ScaleIcon className="h-3.5 w-3.5" />}
                title="Rango de monto"
                description="Facturas dentro de este rango usarán estas reglas en lugar de las predeterminadas."
                accent="bg-slate-50 dark:bg-slate-900/40"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor={`${uid}-min`} className="text-xs">Monto mínimo (CLP)</Label>
                  <Input
                    id={`${uid}-min`}
                    type="number"
                    min={0}
                    value={rule.minAmount}
                    onChange={(e) => set('minAmount', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${uid}-max`} className="text-xs">
                    Monto máximo
                    <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(vacío = sin límite)</span>
                  </Label>
                  <Input
                    id={`${uid}-max`}
                    type="number"
                    min={0}
                    value={rule.maxAmount ?? ''}
                    onChange={(e) => set('maxAmount', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Sin límite"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Validation */}
          <div className="px-4 py-4 space-y-3">
            <SectionHeader
              icon={<BotIcon className="h-3.5 w-3.5" />}
              title="Validación con IA"
              description="Claude compara el monto de la factura contra el contrato vigente del proveedor."
              accent="bg-violet-50 dark:bg-violet-950/20"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-tol`} className="text-xs">
                  Tolerancia (%)
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">predeterminado: 5%</span>
                </Label>
                <Input
                  id={`${uid}-tol`}
                  type="number"
                  min={0}
                  max={100}
                  value={rule.aiTolerancePct}
                  onChange={(e) => set('aiTolerancePct', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-aimax`} className="text-xs">
                  Monto máximo para validar
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(vacío = todos)</span>
                </Label>
                <Input
                  id={`${uid}-aimax`}
                  type="number"
                  min={0}
                  value={rule.aiMaxAmount ?? ''}
                  onChange={(e) => set('aiMaxAmount', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Validar todos"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-ai-approve`} className="text-xs">
                Acción cuando IA aprueba
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">predeterminado: sin acción</span>
              </Label>
              <Select value={rule.aiApproveAction} onValueChange={(v) => set('aiApproveAction', v as AiApproveAction)}>
                <SelectTrigger id={`${uid}-ai-approve`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_APPROVE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SII Notifications */}
          <div className="px-4 py-4 space-y-3">
            <SectionHeader
              icon={<BellIcon className="h-3.5 w-3.5" />}
              title="Notificaciones al SII"
              description="Informa automáticamente al SII cuando se aprueba o rechaza una factura."
              accent="bg-emerald-50 dark:bg-emerald-950/20"
            />
            <div className="space-y-2.5 pt-1">
              <label htmlFor={`${uid}-sii-approve`} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  id={`${uid}-sii-approve`}
                  checked={rule.notifySiiOnApprove}
                  onCheckedChange={(v: boolean | 'indeterminate') => set('notifySiiOnApprove', v === true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm group-hover:text-foreground transition-colors">Notificar al SII al aprobar</span>
                  <p className="text-xs text-muted-foreground">Envía evento ACD (Acuse de Recibo) al SII</p>
                </div>
              </label>
              <label htmlFor={`${uid}-sii-reject`} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  id={`${uid}-sii-reject`}
                  checked={rule.notifySiiOnReject}
                  onCheckedChange={(v: boolean | 'indeterminate') => set('notifySiiOnReject', v === true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm group-hover:text-foreground transition-colors">Notificar al SII al rechazar</span>
                  <p className="text-xs text-muted-foreground">Envía evento RCD (Rechazo Comercial DTE) al SII</p>
                </div>
              </label>
            </div>
          </div>

          {/* Mérito */}
          <div className="px-4 py-4 space-y-3">
            <SectionHeader
              icon={<ShieldIcon className="h-3.5 w-3.5" />}
              title="Título Ejecutivo (Mérito)"
              description="Acciones automáticas antes y después de que una factura adquiera fuerza ejecutiva (8 días)."
              accent="bg-amber-50 dark:bg-amber-950/20"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-merito-action`} className="text-xs">
                  Acción antes del vencimiento
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">predeterminado: sin acción</span>
                </Label>
                <Select value={rule.meritoAction} onValueChange={(v) => set('meritoAction', v as MeritoAction)}>
                  <SelectTrigger id={`${uid}-merito-action`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MERITO_ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-merito-days`} className="text-xs">Días de anticipación</Label>
                <Input
                  id={`${uid}-merito-days`}
                  type="number"
                  min={0}
                  value={rule.meritoDaysBefore ?? ''}
                  onChange={(e) => set('meritoDaysBefore', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="El día del vencimiento"
                  disabled={rule.meritoAction === 'nothing'}
                />
                {rule.meritoAction === 'nothing' && (
                  <p className="text-[11px] text-muted-foreground">Selecciona una acción para habilitar este campo.</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-merito-completed`} className="text-xs">
                Si el vencimiento ya pasó sin acción
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">predeterminado: esperar acción manual</span>
              </Label>
              <Select value={rule.meritoCompletedAction} onValueChange={(v) => set('meritoCompletedAction', v as MeritoCompletedAction)}>
                <SelectTrigger id={`${uid}-merito-completed`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MERITO_COMPLETED_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mérito alert */}
            <div className="rounded-lg border border-dashed border-border/60 p-3 space-y-3">
              <label htmlFor={`${uid}-alert-toggle`} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  id={`${uid}-alert-toggle`}
                  checked={rule.meritoAlertEnabled}
                  onCheckedChange={(v: boolean | 'indeterminate') => set('meritoAlertEnabled', v === true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium group-hover:text-foreground transition-colors">Activar alerta por email</span>
                  <p className="text-xs text-muted-foreground">Envía un aviso por correo cuando la fecha de mérito se acerca.</p>
                </div>
              </label>
              {rule.meritoAlertEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${uid}-alert-days`} className="text-xs">Días de anticipación</Label>
                    <Input
                      id={`${uid}-alert-days`}
                      type="number"
                      min={0}
                      value={rule.meritoAlertDaysBefore ?? ''}
                      onChange={(e) => set('meritoAlertDaysBefore', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="El día del vencimiento"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${uid}-alert-emails`} className="text-xs">Destinatarios (separados por coma)</Label>
                    <Input
                      id={`${uid}-alert-emails`}
                      type="text"
                      value={emailsStr}
                      onChange={(e) => {
                        const emails = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        set('meritoAlertEmails', emails.length > 0 ? emails : null);
                      }}
                      placeholder="email@empresa.cl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rules list (shared between tabs) ──────────────────────────────────────────

interface RulesListProps {
  entries: RuleEntry[];
  isOnlyDefault: boolean;
  onAdd: () => void;
  onChange: (localId: string, rule: UpsertOrganizationRulePayload) => void;
  onRemove: (localId: string) => void;
}

function RulesList({ entries, isOnlyDefault, onAdd, onChange, onRemove }: RulesListProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-semibold">Reglas por monto</h2>
          <p className="text-sm text-muted-foreground">
            La regla base aplica a todas las facturas. Agrega rangos específicos para sobrescribir el comportamiento según el monto.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={onAdd}>
          <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Agregar rango
        </Button>
      </div>

      {isOnlyDefault && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-3 text-sm" role="note">
          <InfoIcon className="h-4 w-4 shrink-0 mt-0.5 text-primary/70" aria-hidden="true" />
          <p className="text-muted-foreground">
            Esta es la{' '}
            <span className="font-medium text-foreground">configuración predeterminada del sistema</span>.
            Aplica a todas las facturas. Modifícala o agrega rangos específicos para distintos montos.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <RuleCard
            key={entry.localId}
            entry={entry}
            isBase={i === 0}
            index={i}
            totalRules={entries.length}
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}
      </div>

      {entries.length > 1 && (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Agregar rango
        </button>
      )}
    </div>
  );
}

// ─── Hook: rules state + load/save ─────────────────────────────────────────────

function useRules(load: () => Promise<OrganizationRule[]>) {
  const [entries, setEntries] = useState<RuleEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const rules = await load();
      setEntries(toEntries(rules));
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  }, [load]);

  function handleChange(localId: string, rule: UpsertOrganizationRulePayload): void {
    setEntries((prev) => prev.map((e) => (e.localId === localId ? { ...e, payload: rule } : e)));
  }

  function handleRemove(localId: string): void {
    setEntries((prev) => {
      const next = prev.filter((e) => e.localId !== localId);
      // Ensure base rule always has min=0 max=null
      return next.length === 0 ? [newEntry({ ...SYSTEM_DEFAULTS })] : next;
    });
  }

  function handleAdd(): void {
    setEntries((prev) => [...prev, newEntry({ ...SYSTEM_DEFAULTS, minAmount: 0, maxAmount: null })]);
  }

  function payloads(): UpsertOrganizationRulePayload[] {
    return entries.map((e, i) =>
      // Always enforce base rule amounts
      i === 0 ? { ...e.payload, minAmount: 0, maxAmount: null } : e.payload,
    );
  }

  const isOnlyDefault = entries.length === 1;

  return { entries, status, reload, handleChange, handleRemove, handleAdd, payloads, isOnlyDefault };
}

// ─── General tab ───────────────────────────────────────────────────────────────

interface GeneralTabProps {
  orgId: string;
  onSaveStart: () => void;
  onSaveEnd: (err: string | null) => void;
  saveTriggered: number; // bump to trigger save
}

function GeneralTab({ orgId, onSaveStart, onSaveEnd, saveTriggered }: GeneralTabProps): React.JSX.Element {
  const loadFn = useCallback(async () => {
    const res = await getSettings(orgId);
    return (res.data ?? []).filter((r) => !r.supplierId);
  }, [orgId]);

  const rules = useRules(loadFn);
  const prevTrigger = useRef(0);

  useEffect(() => {
    rules.reload();
  }, [rules.reload]);

  useEffect(() => {
    if (saveTriggered === 0 || saveTriggered === prevTrigger.current) return;
    prevTrigger.current = saveTriggered;
    onSaveStart();
    updateSettings(orgId, rules.payloads())
      .then((res) => onSaveEnd(res.success ? null : (res.error ?? 'Error al guardar.')))
      .catch(() => onSaveEnd('Error inesperado al guardar.'));
  }, [saveTriggered, orgId, onSaveStart, onSaveEnd, rules]);

  if (rules.status === 'loading' || rules.status === 'idle') {
    return <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>;
  }

  if (rules.status === 'error') {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No se pudo cargar la configuración.{' '}
        <button type="button" className="underline underline-offset-2" onClick={rules.reload}>Reintentar</button>
      </div>
    );
  }

  return (
    <RulesList
      entries={rules.entries}
      isOnlyDefault={rules.isOnlyDefault}
      onAdd={rules.handleAdd}
      onChange={rules.handleChange}
      onRemove={rules.handleRemove}
    />
  );
}

// ─── Supplier tab ───────────────────────────────────────────────────────────────

interface SupplierTabProps {
  orgId: string;
  onSaveStart: () => void;
  onSaveEnd: (err: string | null) => void;
  saveTriggered: number;
  onSupplierChange: (hasSupplier: boolean) => void;
}

function SupplierTab({ orgId, onSaveStart, onSaveEnd, saveTriggered, onSupplierChange }: SupplierTabProps): React.JSX.Element {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const prevTrigger = useRef(0);

  useEffect(() => {
    setSuppliersLoading(true);
    listSuppliersByOrg(orgId, { limit: 200 })
      .then((res) => { if (res.success) setSuppliers(res.data); })
      .finally(() => setSuppliersLoading(false));
  }, [orgId]);

  const loadFn = useCallback(async () => {
    if (!selectedSupplierId) return [];
    const res = await getSupplierSettings(orgId, selectedSupplierId);
    return res.data ?? [];
  }, [orgId, selectedSupplierId]);

  const rules = useRules(loadFn);

  useEffect(() => {
    if (selectedSupplierId) {
      rules.reload();
      onSupplierChange(true);
    } else {
      onSupplierChange(false);
    }
  }, [selectedSupplierId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (saveTriggered === 0 || saveTriggered === prevTrigger.current || !selectedSupplierId) return;
    prevTrigger.current = saveTriggered;
    onSaveStart();
    updateSupplierSettings(orgId, selectedSupplierId, rules.payloads())
      .then((res) => onSaveEnd(res.success ? null : (res.error ?? 'Error al guardar.')))
      .catch(() => onSaveEnd('Error inesperado al guardar.'));
  }, [saveTriggered, orgId, selectedSupplierId, onSaveStart, onSaveEnd, rules]);

  const filteredSuppliers = suppliers.filter((s) =>
    s.legalName.toLowerCase().includes(search.toLowerCase()) ||
    s.taxIdentifier.includes(search),
  );

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div className="space-y-5">
      {/* Supplier selector */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BuildingIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Seleccionar proveedor
        </div>
        {suppliersLoading ? (
          <Skeleton className="h-9 w-full rounded-md" />
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Buscar proveedor por nombre o RUT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
            {search && filteredSuppliers.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">No se encontraron proveedores.</p>
            )}
            {(search ? filteredSuppliers : suppliers).length > 0 && (
              <Select
                value={selectedSupplierId ?? ''}
                onValueChange={(v) => { setSelectedSupplierId(v || null); setSearch(''); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {(search ? filteredSuppliers : suppliers).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-medium">{s.legalName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.taxIdentifier}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        {selectedSupplier && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{selectedSupplier.legalName}</span>
            <span>·</span>
            <span>{selectedSupplier.taxIdentifier}</span>
            <button
              type="button"
              onClick={() => setSelectedSupplierId(null)}
              className="ml-auto text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Rules for selected supplier */}
      {!selectedSupplierId && (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Selecciona un proveedor para configurar sus reglas específicas.
          <br />
          <span className="text-xs mt-1 block">
            Las reglas de proveedor tienen prioridad sobre las reglas globales.
          </span>
        </div>
      )}

      {selectedSupplierId && (rules.status === 'loading' || rules.status === 'idle') && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {selectedSupplierId && rules.status === 'error' && (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No se pudo cargar la configuración.{' '}
          <button type="button" className="underline underline-offset-2" onClick={rules.reload}>Reintentar</button>
        </div>
      )}

      {selectedSupplierId && rules.status === 'loaded' && (
        <RulesList
          entries={rules.entries}
          isOnlyDefault={rules.isOnlyDefault}
          onAdd={rules.handleAdd}
          onChange={rules.handleChange}
          onRemove={rules.handleRemove}
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage(): React.JSX.Element {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'proveedores'>('general');
  const [supplierSelected, setSupplierSelected] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveTriggered, setSaveTriggered] = useState(0);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMe().then((res) => {
      if (res.success && res.data?.organization_id) setOrgId(res.data.organization_id);
    }).finally(() => setOrgLoading(false));
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);

  const handleSaveStart = useCallback(() => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  const handleSaveEnd = useCallback((err: string | null) => {
    setSaving(false);
    if (err) {
      setSaveError(err);
    } else {
      setSaveSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    }
  }, []);

  const canSave = activeTab === 'general' || (activeTab === 'proveedores' && supplierSelected);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="flex-1 text-lg font-semibold">Configuración</h1>
        {!orgLoading && orgId && canSave && (
          <Button size="sm" onClick={() => setSaveTriggered((n) => n + 1)} disabled={saving}>
            <SaveIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* Feedback */}
          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400" role="status">
              Configuración guardada correctamente.
            </div>
          )}

          {orgLoading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          )}

          {!orgLoading && !orgId && (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No se encontró la organización asociada a tu cuenta.
            </div>
          )}

          {!orgLoading && orgId && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'proveedores')}>
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-5">
                <GeneralTab
                  orgId={orgId}
                  onSaveStart={handleSaveStart}
                  onSaveEnd={handleSaveEnd}
                  saveTriggered={saveTriggered}
                />
              </TabsContent>

              <TabsContent value="proveedores" className="mt-5">
                <SupplierTab
                  orgId={orgId}
                  onSaveStart={handleSaveStart}
                  onSaveEnd={handleSaveEnd}
                  saveTriggered={saveTriggered}
                  onSupplierChange={setSupplierSelected}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
