'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCostCenter } from '@/integrations/backend/contabilidad';
import type { CostCenterDetail } from '@/integrations/backend/contabilidad';
import type { User } from '@/integrations/backend/users';

interface CreateCostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgUsers: User[];
  onSuccess: (item: CostCenterDetail) => void;
}

const EMPTY_FORM = { externalId: '', name: '' };

export function CreateCostCenterDialog({
  open,
  onOpenChange,
  orgId,
  orgUsers,
  onSuccess,
}: CreateCostCenterDialogProps): React.JSX.Element {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setForm(EMPTY_FORM);
    setSelectedUserIds([]);
    setError(null);
  }

  function handleOpenChange(val: boolean): void {
    if (!val) reset();
    onOpenChange(val);
  }

  function toggleUser(userId: string): void {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      return [...prev, userId];
    });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.externalId.trim()) { setError('El ID es requerido.'); return; }
    if (!form.name.trim()) { setError('El nombre es requerido.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await createCostCenter(orgId, {
        externalId: form.externalId.trim(),
        name: form.name.trim(),
        userIds: selectedUserIds,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Error al crear el centro de costos.');
        return;
      }
      reset();
      onSuccess(res.data);
    } catch {
      setError('Error inesperado al crear el centro de costos.');
    } finally {
      setLoading(false);
    }
  }

  function getUserDisplayName(user: User): string {
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email;
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
              Nuevo Centro de Costos
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
              <label className="mb-1.5 block text-sm font-medium" htmlFor="cc-external-id">
                ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="cc-external-id"
                placeholder="Ej: CC-001"
                value={form.externalId}
                onChange={(e) => setForm((p) => ({ ...p, externalId: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="cc-name">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                id="cc-name"
                placeholder="Ej: Operaciones"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {orgUsers.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Usuarios asignados <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div className="max-h-40 overflow-y-auto rounded-md border divide-y">
                  {orgUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{getUserDisplayName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear centro de costos'}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
