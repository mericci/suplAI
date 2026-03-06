'use client';

import { useState } from 'react';
import { EyeIcon, Loader2Icon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { getSupplierDocumentPreviewUrl } from '@/integrations/backend/suppliers';

interface DocumentPreviewSheetProps {
  supplierId: string;
  docId: string;
  fileName: string;
  trigger?: React.ReactNode;
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

export function DocumentPreviewSheet({
  supplierId,
  docId,
  fileName,
  trigger,
}: DocumentPreviewSheetProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(): Promise<void> {
    setOpen(true);
    if (signedUrl) return; // Already fetched

    setLoading(true);
    setError(null);
    try {
      const res = await getSupplierDocumentPreviewUrl(supplierId, docId);
      if (!res.success || !res.data) {
        setError('No se pudo cargar el documento.');
        return;
      }
      setSignedUrl(res.data.signedUrl);
    } catch {
      setError('Error al obtener la URL del documento.');
    } finally {
      setLoading(false);
    }
  }

  const isImage = isImageFile(fileName);

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen} className="cursor-pointer">{trigger}</div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleOpen}
          aria-label="Ver documento"
        >
          <EyeIcon className="h-4 w-4" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-2xl">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="truncate text-sm font-medium">{fileName}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            {loading && (
              <div className="flex flex-1 items-center justify-center">
                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {signedUrl && !loading && (
              isImage ? (
                <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={fileName}
                    className="max-h-full max-w-full rounded object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={signedUrl}
                  title={fileName}
                  className="flex-1 border-0"
                />
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
