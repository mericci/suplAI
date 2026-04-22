'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import type { Rendicion, RendicionDocument } from '@supl/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { getRendicion, approveRendicion, rejectRendicion } from '@/integrations/backend/rendiciones';
import { useUserProfile } from '@/context/UserProfileContext';
import { RendicionStatusBadge } from './RendicionStatusBadge';
import { DocumentValidationRow } from './DocumentValidationRow';
import { DistributionSummaryTable } from './DistributionSummaryTable';

interface RendicionDetailProps {
  orgId: string;
  rendicionId: string;
}

export function RendicionDetail({ orgId, rendicionId }: RendicionDetailProps): React.JSX.Element {
  const router = useRouter();
  const { canApprove } = useUserProfile();

  const [rendicion, setRendicion] = useState<Rendicion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const documents: RendicionDocument[] = rendicion?.documents ?? [];

  useEffect(() => {
    setLoading(true);
    getRendicion(orgId, rendicionId)
      .then((res) => {
        if (res.success && res.data) {
          setRendicion(res.data);
        } else {
          setError(res.error ?? 'No se pudo cargar la rendición.');
        }
      })
      .catch(() => setError('Error al cargar la rendición.'))
      .finally(() => setLoading(false));
  }, [orgId, rendicionId]);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleApprove(): Promise<void> {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await approveRendicion(orgId, rendicionId, false);
      if (!res.success) { setActionError(res.error ?? 'Error al aprobar.'); return; }
      setRendicion((prev) => (prev ? { ...prev, status: 'approved' } : prev));
    } catch {
      setActionError('Error al aprobar la rendición.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(): Promise<void> {
    if (!rejectionNotes.trim()) { setActionError('Ingresa las notas de rechazo.'); return; }
    setSubmitting(true);
    setActionError(null);
    try {
      const notes = rejectionNotes.trim();
      const res = await rejectRendicion(orgId, rendicionId, { rejectionNotes: notes });
      if (!res.success) { setActionError(res.error ?? 'Error al rechazar.'); return; }
      setRendicion((prev) => (prev ? { ...prev, status: 'rejected', rejection_notes: notes } : prev));
      setShowRejectForm(false);
    } catch {
      setActionError('Error al rechazar la rendición.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !rendicion) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-base font-semibold">Rendición</span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">{error ?? 'No encontrada'}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/refunds')}>
            Volver a rendiciones
          </Button>
        </div>
      </div>
    );
  }

  const validDocs = documents.filter((d) => d.ai_validation_status === 'valid' && !d.is_duplicate);
  const totalAmount = validDocs.reduce((sum, d) => sum + (d.corrected_amount ?? d.amount ?? 0), 0);
  const isPending = rendicion.status === 'pending';

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/refunds')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Rendiciones
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <RendicionStatusBadge status={rendicion.status} />
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Creada</p>
            <p className="text-sm">{formatDate(rendicion.created_at)}</p>
          </div>
          {rendicion.approved_at && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {rendicion.status === 'approved' ? 'Aprobada' : 'Procesada'}
              </p>
              <p className="text-sm">{formatDate(rendicion.approved_at)}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-3xl font-bold">
            ${(rendicion.total_amount ?? totalAmount).toLocaleString('es-CL')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {rendicion.ai_validated ? (
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {rendicion.ai_validated ? 'Validado con IA' : 'Sin validación IA'}
            </span>
          </div>
        </div>

        {rendicion.submission_notes && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-400">
            <p className="font-medium">Justificación del rendidor</p>
            <p className="mt-1">{rendicion.submission_notes}</p>
          </div>
        )}

        {rendicion.rejection_notes && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
            <p className="font-medium">Notas de rechazo</p>
            <p className="mt-1">{rendicion.rejection_notes}</p>
          </div>
        )}

        {documents.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documentos ({documents.length})
            </p>
            {documents.map((doc) => (
              <DocumentValidationRow key={doc.id} doc={doc} readOnly />
            ))}
          </div>
        )}

        {documents.length > 0 && <DistributionSummaryTable documents={documents} />}

        {canApprove && isPending && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold">Acciones del aprobador</p>

            {!showRejectForm && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2Icon className="mr-2 h-4 w-4" />}
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={submitting}
                  className="flex-1"
                >
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reject-notes">Motivo del rechazo</Label>
                  <Textarea
                    id="reject-notes"
                    placeholder="Describe por qué se rechaza esta rendición..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => { setShowRejectForm(false); setRejectionNotes(''); setActionError(null); }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar rechazo
                  </Button>
                </div>
              </div>
            )}

            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
