'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createBudgetItem } from '@/integrations/backend/budget';
import type { Supplier } from '@/integrations/backend/suppliers';
import { CURRENCY_OPTIONS, PERIODICITY_OPTIONS } from './constants';

interface CreateBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  suppliers: Supplier[];
  onSuccess: () => void;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  amount: '',
  currency: 'CLP',
  periodicity: 'monthly' as const,
  supplierId: '',
};

export function CreateBudgetItemDialog({
  open,
  onOpenChange,
  orgId,
  suppliers,
  onSuccess,
}: CreateBudgetItemDialogProps): React.JSX.Element {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleOpenChange(val: boolean): void {
    if (!val) reset();
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    const amountNum = parseFloat(form.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      setError('El monto debe ser un número válido >= 0.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createBudgetItem(orgId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: amountNum,
        currency: form.currency,
        periodicity: form.periodicity as 'monthly' | 'quarterly' | 'annual',
        supplierId: form.supplierId || null,
      });

      if (!res.success) {
        setError(res.error ?? 'Error al crear el ítem.');
        return;
      }

      reset();
      onSuccess();
    } catch {
      setError('Error inesperado al crear el ítem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={[
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          ].join(' ')}
        />
        <DialogPrimitive.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border bg-background p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          ].join(' ')}
        >
          <div className="mb-5 flex items-start justify-between">
            <DialogPrimitive.Title className="text-xl font-bold">
              Nuevo ítem de presupuesto
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { handleSubmit(e); }} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-name">
                Nombre
              </label>
              <Input
                id="bi-name"
                placeholder="Ej: Servicio de monitoreo"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-desc">
                Descripción breve
              </label>
              <Textarea
                id="bi-desc"
                placeholder="Ej: Monitoreo mensual de documentos tributarios"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-amount">
                  Monto
                </label>
                <Input
                  id="bi-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 500000"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Moneda
                </label>
                <Select
                  value={form.currency}
                  onValueChange={(val) => setForm((p) => ({ ...p, currency: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Periodicity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Periodicidad
              </label>
              <Select
                value={form.periodicity}
                onValueChange={(val) => setForm((p) => ({ ...p, periodicity: val as typeof p.periodicity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier (optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Proveedor (opcional)
              </label>
              <Select
                value={form.supplierId || '__none__'}
                onValueChange={(val) => setForm((p) => ({ ...p, supplierId: val === '__none__' ? '' : val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proveedor asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin proveedor asignado</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear ítem'}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
