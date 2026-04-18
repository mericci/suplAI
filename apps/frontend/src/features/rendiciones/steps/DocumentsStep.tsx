'use client';

import { useRef, useState } from 'react';
import { UploadIcon, Loader2Icon } from 'lucide-react';
import type { RendicionDocument } from '@supl/shared';
import { Button } from '@/components/ui/button';
import { uploadRendicionDocument } from '@/integrations/backend/rendiciones';
import { DocumentValidationRow } from '../DocumentValidationRow';

interface DocumentsStepProps {
  orgId: string;
  rendicionId: string;
  documents: RendicionDocument[];
  onDocumentAdded: (doc: RendicionDocument) => void;
  onAmountChange: (docId: string, amount: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_EXTS = '.pdf,.jpg,.jpeg,.png,.gif,.webp';

export function DocumentsStep({
  orgId,
  rendicionId,
  documents,
  onDocumentAdded,
  onAmountChange,
  onNext,
  onBack,
}: DocumentsStepProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasPendingValidation = documents.some((d) => d.ai_validation_status === 'pending');

  async function uploadOne(file: File): Promise<void> {
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`${file.name} supera el límite de 10MB`);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(`${file.name}: tipo de archivo no soportado`);
      return;
    }
    try {
      const res = await uploadRendicionDocument(orgId, rendicionId, file);
      if (res.success && res.data) {
        onDocumentAdded(res.data.document);
      } else {
        setUploadError(res.error ?? `Error al subir ${file.name}`);
      }
    } catch {
      setUploadError(`Error al subir ${file.name}`);
    }
  }

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    await Promise.all(Array.from(files).map((f) => uploadOne(f)));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <div
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/10 px-4 py-10 text-center transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {uploading ? (
          <>
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Subiendo y validando con IA...</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UploadIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Arrastra o haz clic para subir documentos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, PNG — máx. 10MB por archivo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                La IA validará cada documento automáticamente
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept={ACCEPTED_EXTS}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documentos ({documents.length})
          </p>
          {documents.map((doc) => (
            <DocumentValidationRow
              key={doc.id}
              doc={doc}
              onAmountChange={onAmountChange}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          onClick={onNext}
          disabled={documents.length === 0 || uploading || hasPendingValidation}
        >
          {hasPendingValidation ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            'Siguiente'
          )}
        </Button>
      </div>
    </div>
  );
}
