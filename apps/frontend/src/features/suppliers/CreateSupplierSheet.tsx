'use client';

import { useRef, useState } from 'react';
import { PlusIcon, UploadIcon, FileIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { upsertSupplier } from '@/integrations/backend/suppliers';
import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FormFields {
  legalName: string;
  taxIdentifier: string;
}

interface FieldErrors {
  legalName?: string;
  taxIdentifier?: string;
}

interface CreateSupplierSheetProps {
  onSuccess?: () => void;
}

// After stripping dots, a valid Chilean RUT is digits + dash + digit-or-K
const RUT_PATTERN = /^\d{1,9}-[\dkK]$/;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreateSupplierSheet({
  onSuccess,
}: CreateSupplierSheetProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FormFields>({
    legalName: '',
    taxIdentifier: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileUploadWarning, setFileUploadWarning] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FormFields>(
    key: K,
    value: FormFields[K],
  ): void {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleFileSelect(file: File): void {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function handleFileInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function removeFile(): void {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!fields.legalName.trim()) {
      errors.legalName = 'El nombre legal es obligatorio';
    } else if (fields.legalName.trim().length < 2) {
      errors.legalName = 'Debe tener al menos 2 caracteres';
    }

    const cleanedRut = fields.taxIdentifier.trim().replace(/\./g, '');
    if (!cleanedRut) {
      errors.taxIdentifier = 'El RUT es obligatorio';
    } else if (!RUT_PATTERN.test(cleanedRut)) {
      errors.taxIdentifier = 'Ingresa un RUT válido (ej: 12345678-9)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setApiError(null);
    setFileUploadWarning(null);
    if (!validate()) return;

    setStatus('loading');

    try {
      const res = await upsertSupplier({
        legalName: fields.legalName.trim(),
        taxIdentifier: fields.taxIdentifier.trim(),
      });

      if (!res.success) {
        setApiError(res.error ?? 'Ocurrió un error al crear el proveedor');
        setStatus('error');
        return;
      }

      // File upload — best-effort after supplier is created
      if (selectedFile && res.data) {
        try {
          const supabase = createClient();
          const ext = selectedFile.name.split('.').pop() ?? 'bin';
          const path = `${res.data.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('supplier-evidence')
            .upload(path, selectedFile, { upsert: false });

          if (uploadError) {
            setFileUploadWarning(
              'El proveedor fue creado pero el archivo no pudo subirse. Inténtalo nuevamente.',
            );
          }
        } catch {
          setFileUploadWarning(
            'El proveedor fue creado pero el archivo no pudo subirse.',
          );
        }
      }

      setStatus('success');
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado',
      );
      setStatus('error');
    }
  }

  function handleReset(): void {
    setFields({ legalName: '', taxIdentifier: '' });
    setFieldErrors({});
    setApiError(null);
    setFileUploadWarning(null);
    setStatus('idle');
    removeFile();
  }

  function handleOpenChange(value: boolean): void {
    if (!value) {
      if (status === 'success') onSuccess?.();
      setOpen(false);
      // Delay reset so the close animation finishes
      setTimeout(handleReset, 300);
    } else {
      setOpen(true);
    }
  }

  const isLoading = status === 'loading';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Nuevo proveedor
      </Button>

      <SheetContent side="right" className="flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Nuevo proveedor</SheetTitle>
          <SheetDescription>
            Registra un proveedor manualmente con sus datos y documentación.
          </SheetDescription>
        </SheetHeader>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="text-base font-semibold">Proveedor creado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fields.legalName} fue registrado correctamente.
              </p>
            </div>
            {fileUploadWarning && (
              <div className="w-full rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                {fileUploadWarning}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Crear otro
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                Ver proveedores
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Scrollable fields area */}
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              {/* API error banner */}
              {apiError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {apiError}
                </div>
              )}

              {/* ── Datos del proveedor ── */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Datos del proveedor
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="legalName"
                      className="text-sm font-medium leading-none"
                    >
                      Nombre legal{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="legalName"
                      type="text"
                      placeholder="Empresa S.A."
                      value={fields.legalName}
                      onChange={(e) => setField('legalName', e.target.value)}
                      aria-invalid={!!fieldErrors.legalName}
                      disabled={isLoading}
                    />
                    {fieldErrors.legalName && (
                      <p className="text-xs text-destructive">
                        {fieldErrors.legalName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="taxIdentifier"
                      className="text-sm font-medium leading-none"
                    >
                      RUT <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="taxIdentifier"
                      type="text"
                      placeholder="12345678-9"
                      value={fields.taxIdentifier}
                      onChange={(e) =>
                        setField('taxIdentifier', e.target.value)
                      }
                      aria-invalid={!!fieldErrors.taxIdentifier}
                      disabled={isLoading}
                    />
                    {fieldErrors.taxIdentifier ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.taxIdentifier}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Formato: 12345678-9 o 12.345.678-9
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Documentación ── */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Documentación (opcional)
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium leading-none">
                    Evidencia de estructura de costos
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Sube cualquier archivo que acredite la relación de
                    estructura de costos con este proveedor.
                  </p>

                  {selectedFile ? (
                    <div className="mt-2 overflow-hidden rounded-lg border bg-muted/30">
                      {filePreview ? (
                        /* Image preview */
                        <>
                          <div className="relative">
                            <img
                              src={filePreview}
                              alt="Vista previa"
                              className="h-40 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeFile}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                              aria-label="Eliminar archivo"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="border-t px-3 py-2">
                            <p className="truncate text-xs text-muted-foreground">
                              {selectedFile.name} —{' '}
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </>
                      ) : (
                        /* Non-image file row */
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Eliminar archivo"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Drop zone */
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          fileInputRef.current?.click();
                      }}
                      role="button"
                      tabIndex={0}
                      className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <UploadIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Haz clic o arrastra un archivo
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          PDF, imagen, Word, Excel u otro
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={handleFileInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <SheetFooter className="border-t px-4 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear proveedor'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
