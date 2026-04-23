'use client';

import { useState } from 'react';
import {
  Loader2Icon, CheckCircle2Icon, AlertTriangleIcon, XCircleIcon,
} from 'lucide-react';
import type { RendicionDocument } from '@supl/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approveRendicion, submitRendicion } from '@/integrations/backend/rendiciones';
import { DocumentValidationRow } from '../DocumentValidationRow';
import { DistributionSummaryTable } from '../DistributionSummaryTable';

interface SummaryStepProps {
  orgId: string;
  rendicionId: string;
  documents: RendicionDocument[];
  onAmountChange: (docId: string, amount: number) => void;
  onBack: () => void;
  onApproved: () => void;
  onSentForReview: () => void;
}

export function SummaryStep({
  orgId,
  rendicionId,
  documents,
  onAmountChange,
  onBack,
  onApproved,
  onSentForReview,
}: SummaryStepProps): React.JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');

  const sortedDocs = [...documents].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  const validDocs = documents.filter((d) => d.ai_validation_status === 'valid' && !d.is_duplicate);
  const invalidDocs = documents.filter((d) => d.ai_validation_status === 'invalid');
  const duplicateDocs = documents.filter((d) => d.is_duplicate);
  const pendingDistributionDocs = validDocs.filter((d) => d.is_pending_distribution);

  const totalAmount = validDocs.reduce((sum, d) => sum + (d.corrected_amount ?? d.amount ?? 0), 0);
  const hasErrors = invalidDocs.length > 0 || duplicateDocs.length > 0;

  async function handleApprove(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const res = await approveRendicion(orgId, rendicionId, true);
      if (!res.success) {
        setError(res.error ?? 'Error al aprobar la rendición.');
        return;
      }

      onApproved();
    } catch {
      setError('Error al aprobar la rendición.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendForReview(): Promise<void> {
    if (!submissionNotes.trim()) { setError('Describe por qué esta rendición es válida.'); return; }
    setSubmitting(true);
    setError(null);

    try {
      const res = await submitRendicion(orgId, rendicionId, {
        submissionNotes: submissionNotes.trim(),
      });

      if (!res.success) {
        setError(res.error ?? 'Error al enviar para revisión.');
        return;
      }

      onSentForReview();
    } catch {
      setError('Error al enviar para revisión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Total documentos válidos
        </p>
        <p className="mt-1 text-3xl font-bold">
          ${totalAmount.toLocaleString('es-CL')}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {validDocs.length} documento{validDocs.length !== 1 ? 's' : ''} válido{validDocs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {(invalidDocs.length > 0
        || duplicateDocs.length > 0
        || pendingDistributionDocs.length > 0) && (
        <div className="space-y-2">
          {invalidDocs.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircleIcon className="h-4 w-4 shrink-0" />
              {invalidDocs.length} documento{invalidDocs.length !== 1 ? 's' : ''} inválido{invalidDocs.length !== 1 ? 's' : ''}
            </div>
          )}
          {duplicateDocs.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              {duplicateDocs.length} documento{duplicateDocs.length !== 1 ? 's' : ''} duplicado{duplicateDocs.length !== 1 ? 's' : ''}
            </div>
          )}
          {pendingDistributionDocs.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              {pendingDistributionDocs.length} documento{pendingDistributionDocs.length !== 1 ? 's' : ''} sin distribución contable
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Documentos
        </p>
        {sortedDocs.map((doc) => (
          <DocumentValidationRow
            key={doc.id}
            doc={doc}
            onAmountChange={onAmountChange}
          />
        ))}
      </div>

      <DistributionSummaryTable documents={documents} />

      {showRejectForm && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <Label htmlFor="submission-notes">¿Por qué esta rendición es válida?</Label>
          <Textarea
            id="submission-notes"
            placeholder="Explica por qué los documentos son válidos a pesar de las observaciones de la IA..."
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2 pt-2">
        {!hasErrors && !showRejectForm && (
          <Button
            onClick={handleApprove}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2Icon className="mr-2 h-4 w-4" />}
            Confirmar y aprobar
          </Button>
        )}

        {!showRejectForm ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowRejectForm(true)}
            disabled={submitting}
          >
            Solicitar revisión manual
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowRejectForm(false); setSubmissionNotes(''); setError(null); }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendForReview}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
              Solicitar revisión manual
            </Button>
          </div>
        )}

        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          Volver
        </Button>
      </div>
    </div>
  );
}
