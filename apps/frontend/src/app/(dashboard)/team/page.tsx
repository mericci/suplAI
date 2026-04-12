'use client';

import type { Organization } from '@supl/shared';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  BuildingIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateUserForm } from '@/features/users/CreateUserForm';
import {
  getMe,
  listUsers,
  updateUser,
  deleteUser,
} from '@/integrations/backend/users';
import type { User } from '@/integrations/backend/users';
import { getOrganization } from '@/integrations/backend/organizations';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  aprobador: 'Aprobador',
  standard: 'Estándar',
  rendidor: 'Rendidor',
  super_admin: 'Super Admin',
};

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  super_admin: 'default',
  aprobador: 'secondary',
  standard: 'outline',
  rendidor: 'outline',
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'standard', label: 'Estándar' },
  { value: 'aprobador', label: 'Aprobador' },
  { value: 'admin', label: 'Administrador' },
  { value: 'rendidor', label: 'Rendidor' },
];

function getInitials(user: User): string {
  if (user.first_name || user.last_name) {
    return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
  }
  return user.email[0].toUpperCase();
}

function getDisplayName(user: User): string {
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }
  return user.email;
}

function formatTaxId(taxId: string): string {
  // Format Chilean RUT: 12345678-9
  const clean = taxId.replace(/\./g, '').replace(/-/g, '');
  if (clean.length < 2) return taxId;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

const ADMIN_ROLES = ['admin', 'super_admin'];

interface PageData {
  users: User[];
  org: Organization | null;
  currentUserId: string | null;
  isAdmin: boolean;
}

export default function TeamPage(): React.JSX.Element {
  const [data, setData] = useState<PageData>({
    users: [], org: null, currentUserId: null, isAdmin: false,
  });
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const orgIdRef = useRef<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoadStatus('loading');
    setPageError(null);
    try {
      const meRes = await getMe();
      if (!meRes.success || !meRes.data?.organization_id) {
        setPageError('No se pudo obtener el contexto de la organización.');
        setLoadStatus('error');
        return;
      }
      const orgId = meRes.data.organization_id;
      orgIdRef.current = orgId;

      const [usersRes, orgRes] = await Promise.all([
        listUsers(orgId),
        getOrganization(orgId),
      ]);

      setData({
        users: usersRes.success && usersRes.data ? usersRes.data.data : [],
        org: orgRes.success && orgRes.data ? orgRes.data : null,
        currentUserId: meRes.data.id,
        isAdmin: ADMIN_ROLES.includes(meRes.data.role ?? ''),
      });
      setLoadStatus('loaded');
    } catch {
      setPageError('Error inesperado al cargar el equipo.');
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRoleChange(user: User, newRole: string): Promise<void> {
    const orgId = orgIdRef.current;
    if (!orgId || roleLoading) return;
    setRoleLoading(user.id);
    try {
      const res = await updateUser(orgId, user.id, { role: newRole });
      if (!res.success) {
        setPageError(res.error ?? 'Error al actualizar el rol.');
      } else {
        setData((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        }));
      }
    } catch {
      setPageError('Error inesperado al actualizar el rol.');
    } finally {
      setRoleLoading(null);
    }
  }

  async function handleDelete(): Promise<void> {
    const orgId = orgIdRef.current;
    if (!orgId || !deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(orgId, deleteTarget.id);
      setData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch {
      setPageError('Error inesperado al eliminar el usuario.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleAddSuccess(): void {
    setAddDialogOpen(false);
    loadData();
  }

  const { users, org, currentUserId, isAdmin } = data;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="flex-1 text-lg font-semibold">Equipo</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Agregar usuario
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {pageError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {pageError}
            </div>
          )}

          {/* Organization card */}
          {loadStatus === 'loading' ? (
            <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : org && (
            <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <BuildingIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{org.legalName}</p>
                <p className="text-sm text-muted-foreground">
                  RUT: {formatTaxId(org.taxIdentifier)}
                </p>
              </div>
            </div>
          )}

          {/* Team table */}
          {loadStatus === 'loading' && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {loadStatus === 'loaded' && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          No hay otros miembros en el equipo.
                          {isAdmin && (
                            <>
                              {' '}
                              <button
                                type="button"
                                className="text-foreground underline underline-offset-2"
                                onClick={() => setAddDialogOpen(true)}
                              >
                                Agregar uno
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                              <AvatarFallback className="text-xs">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getDisplayName(user)}</span>
                              {user.id === currentUserId && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_VARIANTS[user.role] ?? 'outline'}>
                            {ROLE_LABELS[user.role] ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                          >
                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isAdmin && user.id !== currentUserId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={roleLoading === user.id}
                                >
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Cambiar rol</DropdownMenuLabel>
                                {ROLE_OPTIONS.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => { handleRoleChange(user, opt.value); }}
                                    disabled={user.role === opt.value}
                                  >
                                    {opt.label}
                                    {user.role === opt.value && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        actual
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(user)}
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {loadStatus === 'error' && !pageError && (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              No se pudieron cargar los datos del equipo.
            </div>
          )}
        </div>
      </div>

      {/* Add user dialog */}
      <DialogPrimitive.Root open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
              'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            ].join(' ')}
          >
            <DialogPrimitive.Title className="sr-only">Agregar usuario</DialogPrimitive.Title>
            <CreateUserForm
              orgId={orgIdRef.current ?? undefined}
              onSuccess={handleAddSuccess}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Delete confirmation dialog */}
      <DialogPrimitive.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
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
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
              'rounded-lg border bg-background p-6 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            ].join(' ')}
          >
            <DialogPrimitive.Title className="text-base font-semibold">
              Eliminar usuario
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
              {'¿Estás seguro de que deseas eliminar a '}
              <span className="font-medium text-foreground">
                {deleteTarget ? getDisplayName(deleteTarget) : ''}
              </span>
              {'? Esta acción no se puede deshacer.'}
            </DialogPrimitive.Description>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => { handleDelete(); }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
