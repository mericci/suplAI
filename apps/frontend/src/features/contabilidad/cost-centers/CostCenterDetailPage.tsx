'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { getCostCenter, deleteCostCenter } from '@/integrations/backend/contabilidad';
import type { CostCenterDetail } from '@/integrations/backend/contabilidad';
import { getMe, listUsers } from '@/integrations/backend/users';
import type { User } from '@/integrations/backend/users';
import { EditCostCenterSheet } from './EditCostCenterSheet';
import { ADMIN_ROLES } from '../constants';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getUserInitials(firstName: string | null, lastName: string | null, email: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  if (f || l) return `${f}${l}`.toUpperCase();
  return email[0]?.toUpperCase() ?? '?';
}

export function CostCenterDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orgIdRef = useRef<string | null>(null);
  const isAdminRef = useRef(false);

  const [costCenter, setCostCenter] = useState<CostCenterDetail | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadDetail = useCallback(async (orgId: string, id: string): Promise<void> => {
    const res = await getCostCenter(orgId, id);
    if (res.success && res.data) {
      setCostCenter(res.data);
    } else {
      setError(res.error ?? 'Centro de costos no encontrado.');
    }
  }, []);

  useEffect(() => {
    const { id } = params;
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const meRes = await getMe();
        if (!meRes.success || !meRes.data?.organization_id) {
          setError('No se pudo obtener el contexto de la organización.');
          return;
        }
        const orgId = meRes.data.organization_id;
        const admin = ADMIN_ROLES.includes(meRes.data.role);
        orgIdRef.current = orgId;
        isAdminRef.current = admin;
        setIsAdmin(admin);

        await loadDetail(orgId, id);

        if (admin) {
          const usersRes = await listUsers(orgId, 1, 100);
          if (usersRes.success && usersRes.data) {
            setOrgUsers(usersRes.data.data ?? []);
          }
        }
      } catch {
        setError('Error inesperado al cargar.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params, loadDetail]);

  async function handleDelete(): Promise<void> {
    const orgId = orgIdRef.current;
    if (!orgId || !costCenter || deleting) return;

    setDeleting(true);
    try {
      const res = await deleteCostCenter(orgId, costCenter.id);
      if (res.success) {
        router.push('/accounting');
      } else {
        setError(res.error ?? 'Error al eliminar.');
      }
    } catch {
      setError('Error inesperado al eliminar.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Skeleton className="h-5 w-48" />
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !costCenter) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-lg font-semibold">Centro de Costos</h1>
        </header>
        <div className="flex-1 p-6">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error ?? 'Centro de costos no encontrado.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <button
          type="button"
          onClick={() => router.push('/accounting')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Contabilidad
        </button>
        <Separator orientation="vertical" className="mx-1 h-4" />
        <h1 className="flex-1 text-lg font-semibold">{costCenter.name}</h1>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="mr-1.5 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon className="mr-1.5 h-4 w-4" />
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Info card */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold">Información</h2>
              <Badge variant="outline" className="font-mono text-xs">{costCenter.externalId}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Nombre: <span className="text-foreground font-medium">{costCenter.name}</span></p>
          </div>

          {/* Amounts card */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-base font-semibold">Montos (histórico)</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total', value: costCenter.totalAmount },
                { label: 'Pagado', value: costCenter.paidAmount },
                { label: 'Aprobado', value: costCenter.approvedAmount },
                { label: 'Pendiente', value: costCenter.pendingAmount },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatCLP(value)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Proveedores vinculados: <span className="font-medium text-foreground">{costCenter.supplierCount}</span>
            </p>
          </div>

          {/* Users */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-base font-semibold">Usuarios asignados</h2>
            {costCenter.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin usuarios asignados.</p>
            ) : (
              <div className="space-y-2">
                {costCenter.users.map((u) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(u.firstName, u.lastName, u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && costCenter && (
        <EditCostCenterSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          orgId={orgIdRef.current ?? ''}
          costCenter={costCenter}
          orgUsers={orgUsers}
          onSuccess={(updated) => {
            setCostCenter(updated);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este centro de costos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { handleDelete(); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
