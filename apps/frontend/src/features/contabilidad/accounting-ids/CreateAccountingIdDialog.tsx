'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAccountingId } from '@/integrations/backend/contabilidad';
import type { AccountingIdWithAggregates } from '@/integrations/backend/contabilidad';

interface CreateAccountingIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onSuccess: (item: AccountingIdWithAggregates) => void;
}

const EMPTY_FORM = { externalId: '', description: '' };

export function CreateAccountingIdDialog({
  open,
  onOpenChange,
  orgId,
  onSuccess,
}: CreateAccountingIdDialogProps): React.JSX.Element {
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
    if (!form.externalId.trim()) { setError('El ID es requerido.'); return; }
    if (!form.description.trim()) { setError('La descripción es requerida.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await createAccountingId(orgId, {
        externalId: form.externalId.trim(),
        description: form.description.trim(),
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Error al crear el ID contable.');
        return;
      }
      reset();
      onSuccess(res.data);
    } catch {
      setError('Error inesperado al crear el ID contable.');
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
              Nuevo ID Contable
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
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="aid-external-id">
                ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="aid-external-id"
                placeholder="Ej: 4110"
                value={form.externalId}
                onChange={(e) => setForm((p) => ({ ...p, externalId: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="aid-description">
                Descripción <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="aid-description"
                placeholder="Ej: Gastos de operación"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear ID contable'}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
