'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, SaveIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { getMe } from '@/integrations/backend/users';
import { getSettings, updateSettings } from '@/integrations/backend/settings';
import type { OrganizationRule, UpsertOrganizationRulePayload, MeritoAction, MeritoCompletedAction, AiApproveAction } from '@supl/shared';

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
  { value: 'nothing', label: 'Solo notificar (sin acción)' },
  { value: 'mark_approved', label: 'Aprobar automáticamente' },
];

function defaultRule(): UpsertOrganizationRulePayload {
  return {
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

interface RuleCardProps {
  rule: UpsertOrganizationRulePayload;
  index: number;
  onChange: (index: number, rule: UpsertOrganizationRulePayload) => void;
  onRemove: (index: number) => void;
}

function RuleCard({ rule, index, onChange, onRemove }: RuleCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(index === 0);

  function set<K extends keyof UpsertOrganizationRulePayload>(
    key: K,
    value: UpsertOrganizationRulePayload[K],
  ): void {
    onChange(index, { ...rule, [key]: value });
  }

  const emailsStr = rule.meritoAlertEmails?.join(', ') ?? '';

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="font-medium text-sm">
          Rango: {rule.minAmount.toLocaleString('es-CL')} CLP
          {rule.maxAmount != null
            ? ` — ${rule.maxAmount.toLocaleString('es-CL')} CLP`
            : ' en adelante'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Eliminar rango"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-5">
          {/* Amount range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`min-${index}`}>Monto mínimo (CLP)</Label>
              <Input
                id={`min-${index}`}
                type="number"
                min={0}
                value={rule.minAmount}
                onChange={(e) => set('minAmount', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`max-${index}`}>Monto máximo (CLP, vacío = sin límite)</Label>
              <Input
                id={`max-${index}`}
                type="number"
                min={0}
                value={rule.maxAmount ?? ''}
                onChange={(e) => set('maxAmount', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Sin límite"
              />
            </div>
          </div>

          {/* AI Validation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Validación IA
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`tol-${index}`}>Tolerancia IA (%)</Label>
                <Input
                  id={`tol-${index}`}
                  type="number"
                  min={0}
                  max={100}
                  value={rule.aiTolerancePct}
                  onChange={(e) => set('aiTolerancePct', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`aimax-${index}`}>Monto máximo para IA (CLP, vacío = todos)</Label>
                <Input
                  id={`aimax-${index}`}
                  type="number"
                  min={0}
                  value={rule.aiMaxAmount ?? ''}
                  onChange={(e) => set('aiMaxAmount', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Validar todos los montos"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`ai-approve-${index}`}>Acción cuando IA aprueba</Label>
              <select
                id={`ai-approve-${index}`}
                value={rule.aiApproveAction}
                onChange={(e) => set('aiApproveAction', e.target.value as AiApproveAction)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {AI_APPROVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SII Notifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notificaciones SII
            </h4>
            <div className="flex items-center gap-3">
              <Checkbox
                id={`sii-approve-${index}`}
                checked={rule.notifySiiOnApprove}
                onCheckedChange={(v: boolean | 'indeterminate') => set('notifySiiOnApprove', v === true)}
              />
              <Label htmlFor={`sii-approve-${index}`} className="cursor-pointer">
                Notificar SII al aprobar (ACD)
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id={`sii-reject-${index}`}
                checked={rule.notifySiiOnReject}
                onCheckedChange={(v: boolean | 'indeterminate') => set('notifySiiOnReject', v === true)}
              />
              <Label htmlFor={`sii-reject-${index}`} className="cursor-pointer">
                Notificar SII al rechazar (RCD)
              </Label>
            </div>
          </div>

          {/* Mérito Action */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Título Ejecutivo (Mérito)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`merito-action-${index}`}>Acción antes del vencimiento</Label>
                <select
                  id={`merito-action-${index}`}
                  value={rule.meritoAction}
                  onChange={(e) => set('meritoAction', e.target.value as MeritoAction)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {MERITO_ACTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`merito-days-${index}`}>Días antes del vencimiento</Label>
                <Input
                  id={`merito-days-${index}`}
                  type="number"
                  min={0}
                  value={rule.meritoDaysBefore ?? ''}
                  onChange={(e) => set('meritoDaysBefore', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="El día del vencimiento"
                  disabled={rule.meritoAction === 'nothing'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`merito-completed-${index}`}>Acción si vencimiento ya pasó</Label>
              <select
                id={`merito-completed-${index}`}
                value={rule.meritoCompletedAction}
                onChange={(e) => set('meritoCompletedAction', e.target.value as MeritoCompletedAction)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {MERITO_COMPLETED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mérito Alert */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id={`alert-toggle-${index}`}
                checked={rule.meritoAlertEnabled}
                onCheckedChange={(v: boolean | 'indeterminate') => set('meritoAlertEnabled', v === true)}
              />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alerta por Email (Mérito)
              </h4>
            </div>
            {rule.meritoAlertEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`alert-days-${index}`}>Días antes del vencimiento</Label>
                  <Input
                    id={`alert-days-${index}`}
                    type="number"
                    min={0}
                    value={rule.meritoAlertDaysBefore ?? ''}
                    onChange={(e) => set('meritoAlertDaysBefore', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="El día del vencimiento"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`alert-emails-${index}`}>Emails (separados por coma)</Label>
                  <Input
                    id={`alert-emails-${index}`}
                    type="text"
                    value={emailsStr}
                    onChange={(e) => {
                      const emails = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      set('meritoAlertEmails', emails.length > 0 ? emails : null);
                    }}
                    placeholder="email@empresa.cl, otro@empresa.cl"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsPage(): React.JSX.Element {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [rules, setRules] = useState<UpsertOrganizationRulePayload[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoadStatus('loading');
    try {
      const meRes = await getMe();
      if (!meRes.success || !meRes.data?.organization_id) {
        setLoadStatus('error');
        return;
      }
      const id = meRes.data.organization_id;
      setOrgId(id);

      const settingsRes = await getSettings(id);
      if (settingsRes.success && settingsRes.data) {
        const globalRules = settingsRes.data.filter((r) => !r.supplierId);
        setRules(globalRules.map(ruleToPayload));
      } else {
        setRules([]);
      }
      setLoadStatus('loaded');
    } catch {
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleRuleChange(index: number, rule: UpsertOrganizationRulePayload): void {
    setRules((prev) => prev.map((r, i) => (i === index ? rule : r)));
  }

  function handleRuleRemove(index: number): void {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddRule(): void {
    setRules((prev) => [...prev, defaultRule()]);
  }

  async function handleSave(): Promise<void> {
    if (!orgId || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await updateSettings(orgId, rules);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(res.error ?? 'Error al guardar la configuración.');
      }
    } catch {
      setSaveError('Error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="flex-1 text-lg font-semibold">Configuración</h1>
        <Button size="sm" onClick={handleSave} disabled={saving || loadStatus !== 'loaded'}>
          <SaveIcon className="mr-1.5 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {saveError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              Configuración guardada correctamente.
            </div>
          )}

          {loadStatus === 'loading' && (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          )}

          {loadStatus === 'error' && (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              No se pudo cargar la configuración.{' '}
              <button type="button" className="underline" onClick={load}>
                Reintentar
              </button>
            </div>
          )}

          {loadStatus === 'loaded' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Reglas globales por monto</h2>
                  <p className="text-sm text-muted-foreground">
                    Define tolerancias, notificaciones y acciones según el monto de la factura.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddRule}>
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  Agregar rango
                </Button>
              </div>

              {rules.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No hay reglas configuradas. Todas las facturas usarán los valores predeterminados.
                  <br />
                  <button
                    type="button"
                    className="mt-2 text-foreground underline underline-offset-2"
                    onClick={handleAddRule}
                  >
                    Agregar primera regla
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, i) => (
                    <RuleCard
                      key={i}
                      rule={rule}
                      index={i}
                      onChange={handleRuleChange}
                      onRemove={handleRuleRemove}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
