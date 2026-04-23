'use client';

import { useState } from 'react';
import {
  FileIcon, CheckCircle2Icon, XCircleIcon, Loader2Icon, AlertTriangleIcon, EyeIcon,
} from 'lucide-react';
import type { RendicionDocument } from '@supl/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BACKING_TYPES, VALIDATION_STATUS_LABELS } from './constants';

interface DocumentValidationRowProps {
  doc: RendicionDocument;
  onAmountChange?: (docId: string, amount: number) => void;
  readOnly?: boolean;
  getPreviewUrl?: () => Promise<string>;
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

export function DocumentValidationRow({
  doc,
  onAmountChange,
  readOnly = false,
  getPreviewUrl,
}: DocumentValidationRowProps): React.JSX.Element {
  const isPending = doc.ai_validation_status === 'pending';
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function handlePreviewOpen(): Promise<void> {
    setPreviewOpen(true);
    if (previewUrl) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = await getPreviewUrl!();
      setPreviewUrl(url);
    } catch {
      setPreviewError('No se pudo cargar el documento.');
    } finally {
      setPreviewLoading(false);
    }
  }
  const isValid = doc.ai_validation_status === 'valid';
  const isInvalid = doc.ai_validation_status === 'invalid';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        isInvalid && 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20',
        doc.is_duplicate && 'border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-950/20',
        isValid && !doc.is_duplicate && 'border-green-200 bg-green-50/30',
        isPending && 'border-border bg-muted/20',
      )}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{doc.file_name}</p>
          {isPending && <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
          {isValid && !doc.is_duplicate && <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-green-600" />}
          {isInvalid && <XCircleIcon className="h-3.5 w-3.5 shrink-0 text-red-600" />}
          {doc.is_duplicate && <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-orange-600" />}
          {getPreviewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Ver documento"
              onClick={handlePreviewOpen}
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc.backing_type && (
            <Badge variant="secondary" className="text-xs">
              {BACKING_TYPES[doc.backing_type]}
            </Badge>
          )}
          {doc.service_type && (
            <span className="text-xs text-muted-foreground">{doc.service_type}</span>
          )}
        </div>

        {!isPending && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Monto:</span>
            {readOnly ? (
              <span className="text-sm font-medium">
                {doc.corrected_amount != null || doc.amount != null
                  ? `$${(doc.corrected_amount ?? doc.amount ?? 0).toLocaleString('es-CL')}`
                  : '—'}
              </span>
            ) : (
              <Input
                type="number"
                className="h-7 w-32 text-sm"
                value={doc.corrected_amount ?? doc.amount ?? ''}
                onChange={(e) => onAmountChange?.(doc.id, parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            )}
          </div>
        )}

        {isInvalid && doc.ai_validation_notes && (
          <p className="text-xs text-red-600 dark:text-red-400">{doc.ai_validation_notes}</p>
        )}
        {doc.is_duplicate && (
          <p className="text-xs text-orange-600 dark:text-orange-400">Documento duplicado detectado</p>
        )}
        {doc.is_pending_distribution && isValid && !doc.is_duplicate && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendiente de distribución contable</p>
        )}
      </div>

      <div className="shrink-0">
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            isPending && 'border-border text-muted-foreground',
            isValid && !doc.is_duplicate && 'border-green-300 bg-green-50 text-green-700',
            isInvalid && 'border-red-300 bg-red-50 text-red-700',
            doc.is_duplicate && 'border-orange-300 bg-orange-50 text-orange-700',
          )}
        >
          {doc.is_duplicate ? 'Duplicado' : VALIDATION_STATUS_LABELS[doc.ai_validation_status]}
        </Badge>
      </div>

      {getPreviewUrl && (
        <Sheet open={previewOpen} onOpenChange={(v) => { if (v) handlePreviewOpen(); else setPreviewOpen(false); }}>
          <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-2xl">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle className="truncate text-sm font-medium">{doc.file_name}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col overflow-hidden">
              {previewLoading && (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {previewError && (
                <div className="flex flex-1 items-center justify-center p-6">
                  <p className="text-sm text-destructive">{previewError}</p>
                </div>
              )}
              {previewUrl && !previewLoading && (
                isImageFile(doc.file_name) ? (
                  <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={doc.file_name}
                      className="max-h-full max-w-full rounded object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={doc.file_name}
                    className="flex-1 border-0"
                  />
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
