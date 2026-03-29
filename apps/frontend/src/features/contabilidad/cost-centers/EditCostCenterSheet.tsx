'use client';

import { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateCostCenter } from '@/integrations/backend/contabilidad';
import type { CostCenterDetail } from '@/integrations/backend/contabilidad';
import type { User } from '@/integrations/backend/users';

interface EditCostCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  costCenter: CostCenterDetail;
  orgUsers: User[];
  onSuccess: (updated: CostCenterDetail) => void;
}

export function EditCostCenterSheet({
  open,
  onOpenChange,
  orgId,
  costCenter,
  orgUsers,
  onSuccess,
}: EditCostCenterSheetProps): React.JSX.Element {
  const [externalId, setExternalId] = useState(costCenter.externalId);
  const [name, setName] = useState(costCenter.name);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    costCenter.users.map((u) => u.userId),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when costCenter changes
  useEffect(() => {
    setExternalId(costCenter.externalId);
    setName(costCenter.name);
    setSelectedUserIds(costCenter.users.map((u) => u.userId));
    setError(null);
  }, [costCenter]);

  function toggleUser(userId: string): void {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      return [...prev, userId];
    });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!externalId.trim()) { setError('El ID es requerido.'); return; }
    if (!name.trim()) { setError('El nombre es requerido.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await updateCostCenter(orgId, costCenter.id, {
        externalId: externalId.trim(),
        name: name.trim(),
        userIds: selectedUserIds,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Error al actualizar.');
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

  function getUserDisplayName(user: User): string {
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email;
  }

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          className={[
            'fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-background p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          ].join(' ')}
        >
          <div className="mb-5 flex items-start justify-between">
            <SheetPrimitive.Title className="text-xl font-bold">
              Editar Centro de Costos
            </SheetPrimitive.Title>
            <SheetPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </SheetPrimitive.Close>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { handleSubmit(e); }} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="edit-cc-external-id">
                ID <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-cc-external-id"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="edit-cc-name">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-cc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {orgUsers.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Usuarios asignados
                </label>
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
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
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
