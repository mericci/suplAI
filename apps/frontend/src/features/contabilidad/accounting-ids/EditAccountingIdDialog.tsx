'use client';

import { useEffect, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateAccountingId } from '@/integrations/backend/contabilidad';
import type { AccountingIdWithAggregates } from '@/integrations/backend/contabilidad';

interface EditAccountingIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  item: AccountingIdWithAggregates;
  onSuccess: (updated: AccountingIdWithAggregates) => void;
}

export function EditAccountingIdDialog({
  open,
  onOpenChange,
  orgId,
  item,
  onSuccess,
}: EditAccountingIdDialogProps): React.JSX.Element {
  const [externalId, setExternalId] = useState(item.externalId);
  const [description, setDescription] = useState(item.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setExternalId(item.externalId);
    setDescription(item.description);
    setError(null);
  }, [item]);

  function handleOpenChange(val: boolean): void {
    if (!val) setError(null);
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!externalId.trim()) { setError('El ID es requerido.'); return; }
    if (!description.trim()) { setError('La descripción es requerida.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await updateAccountingId(orgId, item.id, {
        externalId: externalId.trim(),
        description: description.trim(),
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Error al actualizar el ID contable.');
        return;
      }
      onSuccess(res.data);
      onOpenChange(false);
    } catch {
      setError('Error inesperado al actualizar.');
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
              Editar ID Contable
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
              <label className="mb-1.5 block text-sm font-medium" htmlFor="edit-aid-external-id">
                ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-aid-external-id"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="edit-aid-description">
                Descripción <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="edit-aid-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
