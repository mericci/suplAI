'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, Loader2Icon, CheckCircle2Icon, MinusCircleIcon,
} from 'lucide-react';
import type { Rendicion } from '@supl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { listRendiciones } from '@/integrations/backend/rendiciones';
import { useUserProfile } from '@/context/UserProfileContext';
import { RendicionStatusBadge } from './RendicionStatusBadge';

interface RendicionesListProps {
  orgId: string;
}

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

export function RendicionesList({ orgId }: RendicionesListProps): React.JSX.Element {
  const router = useRouter();
  const { isAdmin, isAprobador } = useUserProfile();
  const canViewAll = isAdmin || isAprobador;

  const [rendiciones, setRendiciones] = useState<Rendicion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [viewAll, setViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchRendiciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRendiciones(orgId, {
        page,
        status: status === 'all' ? undefined : status,
        viewAll: canViewAll && viewAll ? true : undefined,
      });
      if (res.success && res.data) {
        setRendiciones(res.data.rendiciones);
        setTotal(res.data.pagination.total);
      } else {
        setError(res.error ?? 'Error al cargar las rendiciones.');
      }
    } catch {
      setError('Error al cargar las rendiciones.');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, status, viewAll, canViewAll]);

  useEffect(() => {
    fetchRendiciones();
  }, [fetchRendiciones]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-base font-semibold">Rendiciones</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => router.push('/refunds/new')}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nueva rendición
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canViewAll && (
          <Button
            variant={viewAll ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => { setViewAll((v) => !v); setPage(1); }}
          >
            {viewAll ? 'Mis rendiciones' : 'Ver todas'}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRendiciones}>Reintentar</Button>
          </div>
        )}
        {!loading && !error && rendiciones.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-sm text-muted-foreground">
              {viewAll
                ? 'No hay rendiciones en la organización.'
                : 'Aún no tienes rendiciones creadas.'}
            </p>
            <Button size="sm" onClick={() => router.push('/refunds/new')}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Crear primera rendición
            </Button>
          </div>
        )}
        {!loading && !error && rendiciones.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                {viewAll && <TableHead>Creada por</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Docs</TableHead>
                <TableHead className="text-center">IA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rendiciones.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/refunds/${r.id}`)}
                >
                  <TableCell className="text-sm font-medium">{r.name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                  {viewAll && (
                    <TableCell className="text-sm text-muted-foreground">
                      {r.creator_name || r.created_by_user_id.slice(0, 8) + '…'}
                    </TableCell>
                  )}
                  <TableCell>
                    <RendicionStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {r.total_amount != null
                      ? `$${r.total_amount.toLocaleString('es-CL')}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <Badge variant="secondary">{r.document_count ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.ai_validated ? (
                      <CheckCircle2Icon className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <MinusCircleIcon className="mx-auto h-4 w-4 text-muted-foreground/40" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {total} rendicion{total !== 1 ? 'es' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
