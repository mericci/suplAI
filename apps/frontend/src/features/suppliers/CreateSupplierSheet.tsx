'use client';

import { useRef, useState } from 'react';
import {
  PlusIcon, UploadIcon, FileIcon, XIcon, PlusCircleIcon, Loader2Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  upsertSupplier,
  extractSupplierDocument,
  createSupplierDocument,
  listSuppliers,
} from '@/integrations/backend/suppliers';
import type { ExtractedDocumentData, Supplier } from '@/integrations/backend/suppliers';
import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'extracting' | 'loading' | 'success' | 'error';
type Step = 'upload' | 'form';

interface Amount {
  amount: string;
  currency: string;
  concept: string;
  frequency: string;
}

interface FormFields {
  legalName: string;
  taxIdentifier: string;
  serviceDescription: string;
  serviceCategory: string;
  tariffType: string;
  tariffDetail: string;
  amounts: Amount[];
}

interface FieldErrors {
  legalName?: string;
  taxIdentifier?: string;
}

export interface CreateSupplierSheetProps {
  onSuccess?: () => void;
  /** If provided, the sheet will be pre-scoped to this supplier (skip upsert, add doc only) */
  supplierId?: string;
  /** Supplier data used for RUT mismatch check when supplierId is set */
  supplier?: Supplier;
  /** Trigger element override — if not provided, renders the default "Nuevo proveedor" button */
  trigger?: React.ReactNode;
}

const RUT_PATTERN = /^\d{1,9}-[\dkK]$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function emptyAmount(): Amount {
  return {
    amount: '', currency: 'CLP', concept: '', frequency: 'Mensual',
  };
}

export function CreateSupplierSheet({
  onSuccess,
  supplierId: presetSupplierId,
  supplier: presetSupplier,
  trigger,
}: CreateSupplierSheetProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [status, setStatus] = useState<Status>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fileUploadWarning, setFileUploadWarning] = useState<string | null>(null);

  // RUT mismatch warning state
  const [rutMismatch, setRutMismatch] = useState<{
    extracted: string;
    supplier: string;
  } | null>(null);

  // Duplicate RUT check state
  const [duplicateSupplier, setDuplicateSupplier] = useState<Supplier | null>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fields, setFields] = useState<FormFields>({
    legalName: '',
    taxIdentifier: '',
    serviceDescription: '',
    serviceCategory: '',
    tariffType: '',
    tariffDetail: '',
    amounts: [],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [documentRole, setDocumentRole] = useState<'cost_contract' | 'additional'>('cost_contract');

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]): void {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (key in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleFileSelect(file: File): void {
    setExtractionError(null);
    if (file.size > MAX_FILE_SIZE) {
      setExtractionError('El archivo supera el límite de 10MB');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setExtractionError('Tipo de archivo no soportado. Usa PDF, JPG, PNG, GIF o WebP.');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
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
    setExtractionError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function applyExtracted(data: ExtractedDocumentData): void {
    const inferredRole = (data.tariffType || data.amounts.length > 0) ? 'cost_contract' : 'additional';
    setDocumentRole(inferredRole);
    setFields((prev) => ({
      ...prev,
      legalName: data.supplierName ?? prev.legalName,
      taxIdentifier: data.supplierRut ?? prev.taxIdentifier,
      serviceDescription: data.serviceDescription ?? prev.serviceDescription,
      serviceCategory: data.serviceCategory ?? prev.serviceCategory,
      tariffType: data.tariffType ?? prev.tariffType,
      tariffDetail: data.tariffDetail ?? prev.tariffDetail,
      amounts: data.amounts.length > 0
        ? data.amounts.map((a) => ({
          amount: String(a.amount),
          currency: a.currency,
          concept: a.concept,
          frequency: a.frequency,
        }))
        : prev.amounts,
    }));
  }

  async function handleAnalyzeDocument(): Promise<void> {
    if (!selectedFile) return;
    setStatus('extracting');
    setExtractionError(null);
    setRutMismatch(null);
    try {
      const res = await extractSupplierDocument(selectedFile);
      if (!res.success || !res.data) {
        setExtractionError('No se pudo analizar el documento. Puedes completar los datos manualmente.');
      } else {
        applyExtracted(res.data);

        // RUT mismatch check: when adding a doc to an existing supplier
        if (presetSupplierId && presetSupplier && res.data.supplierRut) {
          const extractedRut = res.data.supplierRut.trim().replace(/\./g, '');
          const supplierRut = presetSupplier.taxIdentifier.trim().replace(/\./g, '');
          if (extractedRut.toLowerCase() !== supplierRut.toLowerCase()) {
            setRutMismatch({
              extracted: res.data.supplierRut,
              supplier: presetSupplier.taxIdentifier,
            });
          }
        }

        setStep('form');
      }
    } catch {
      setExtractionError('Error al analizar el documento. Puedes completar los datos manualmente.');
    } finally {
      setStatus('idle');
    }
  }

  function validate(): boolean {
    if (presetSupplierId) return true; // Skip supplier validation if pre-scoped

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError(null);
    setFileUploadWarning(null);
    setDuplicateSupplier(null);
    if (!validate()) return;

    setStatus('loading');

    try {
      let supplierId = presetSupplierId ?? null;

      // Step 1: upsert supplier (only if not pre-scoped)
      if (!supplierId) {
        // Duplicate RUT check: prevent silently updating an existing supplier
        const cleanedRut = fields.taxIdentifier.trim().replace(/\./g, '');
        const lookupRes = await listSuppliers({ taxIdentifier: cleanedRut, limit: 1 });
        if (lookupRes.success && lookupRes.data && lookupRes.data.length > 0) {
          const existing = lookupRes.data[0];
          setDuplicateSupplier(existing);
          setStatus('idle');
          return;
        }

        const res = await upsertSupplier({
          legalName: fields.legalName.trim(),
          taxIdentifier: fields.taxIdentifier.trim(),
        });
        if (!res.success || !res.data) {
          setApiError(res.error ?? 'Error al crear el proveedor');
          setStatus('error');
          return;
        }
        supplierId = res.data.id;
      }

      // Step 2: upload file to Supabase Storage (if any)
      let storagePath: string | null = null;
      if (selectedFile && supplierId) {
        try {
          const supabase = createClient();
          const ext = selectedFile.name.split('.').pop() ?? 'bin';
          const path = `${supplierId}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('supplier-evidence')
            .upload(path, selectedFile, { upsert: false });

          if (uploadError) {
            setFileUploadWarning(
              'El proveedor fue guardado pero el archivo no pudo subirse. Inténtalo nuevamente.',
            );
          } else {
            storagePath = path;
          }
        } catch {
          setFileUploadWarning('El archivo no pudo subirse, pero el proveedor fue guardado.');
        }
      }

      // Step 3: create document record if there's a file or service data
      const hasServiceData = fields.serviceDescription || fields.serviceCategory
        || fields.tariffType || fields.tariffDetail || fields.amounts.length > 0;

      if (storagePath && supplierId) {
        const docRes = await createSupplierDocument(supplierId, {
          fileName: selectedFile!.name,
          storagePath,
          documentType: null,
          documentRole,
          serviceCategory: fields.serviceCategory || null,
          serviceDescription: fields.serviceDescription || null,
          tariffType: fields.tariffType || null,
          tariffDetail: fields.tariffDetail || null,
          amounts: fields.amounts
            .filter((a) => a.concept && a.amount)
            .map((a) => ({
              amount: parseFloat(a.amount) || 0,
              currency: a.currency,
              concept: a.concept,
              frequency: a.frequency,
            })),
        });
        if (!docRes.success) {
          setFileUploadWarning('Proveedor guardado, pero hubo un error al registrar el documento.');
        }
      }

      setStatus('success');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      setStatus('error');
    }
  }

  function handleReset(): void {
    setStep('upload');
    setDocumentRole('cost_contract');
    setFields({
      legalName: '', taxIdentifier: '', serviceDescription: '', serviceCategory: '', tariffType: '', tariffDetail: '', amounts: [],
    });
    setFieldErrors({});
    setApiError(null);
    setFileUploadWarning(null);
    setRutMismatch(null);
    setDuplicateSupplier(null);
    setStatus('idle');
    removeFile();
  }

  function handleOpenChange(value: boolean): void {
    if (!value) {
      if (status === 'success') onSuccess?.();
      setOpen(false);
      setTimeout(handleReset, 300);
    } else {
      setOpen(true);
    }
  }

  const isLoading = status === 'loading' || status === 'extracting';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <PlusIcon className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{presetSupplierId ? 'Agregar documento' : 'Nuevo proveedor'}</SheetTitle>
          <SheetDescription>
            {step === 'upload'
              ? 'Sube un documento para autocompletar los datos del proveedor con IA.'
              : 'Revisa y completa la información del proveedor y servicio.'}
          </SheetDescription>
        </SheetHeader>

        {status === 'success' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="text-base font-semibold">
                {presetSupplierId ? 'Documento agregado' : 'Proveedor creado'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {presetSupplierId
                  ? 'El documento fue registrado correctamente.'
                  : `${fields.legalName} fue registrado correctamente.`}
              </p>
            </div>
            {fileUploadWarning && (
              <div className="w-full rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                {fileUploadWarning}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Agregar otro
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                {presetSupplierId ? 'Ver documentos' : 'Ver proveedores'}
              </Button>
            </div>
          </div>
        )}
        {status !== 'success' && step === 'upload' && (
          /* ── Step 1: Document upload ── */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {extractionError && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  {extractionError}
                </div>
              )}

              {selectedFile ? (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  {filePreview ? (
                    <>
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={filePreview} alt="Vista previa" className="h-48 w-full object-cover" />
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
                          {selectedFile.name} — {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
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
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/10 px-4 py-12 text-center transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UploadIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Subir documento para autocompletar</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, JPG, PNG, GIF o WebP — máx. 10MB
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      La IA extraerá los datos del proveedor y servicio automáticamente
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileInputChange}
              />
            </div>

            <div className="border-t px-4 py-4 space-y-2">
              {selectedFile && (
                <Button
                  className="w-full"
                  onClick={handleAnalyzeDocument}
                  disabled={status === 'extracting'}
                >
                  {status === 'extracting' ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Analizando documento...
                    </>
                  ) : (
                    'Analizar con IA y continuar'
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep('form')}
              >
                Completar manualmente
              </Button>
            </div>
          </div>
        )}
        {status !== 'success' && step === 'form' && (
          /* ── Step 2: Review & edit form ── */
          <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              {rutMismatch && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">El RUT del documento no coincide con el proveedor</p>
                  <table className="w-full text-xs mt-2 border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-0.5 pr-3 text-amber-700 font-medium">Documento:</td>
                        <td className="py-0.5 font-mono">{rutMismatch.extracted}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 pr-3 text-amber-700 font-medium">Proveedor:</td>
                        <td className="py-0.5 font-mono">{rutMismatch.supplier}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-amber-600">
                    Puedes continuar de todas formas o verificar que el documento sea correcto.
                  </p>
                </div>
              )}

              {duplicateSupplier && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <p className="font-medium">Ya existe un proveedor con este RUT</p>
                  <p className="mt-1 text-xs">
                    RUT {duplicateSupplier.taxIdentifier}:{' '}
                    <strong>{duplicateSupplier.legalName}</strong>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ingresa un RUT diferente o busca al proveedor existente en el listado.
                  </p>
                </div>
              )}

              {apiError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {apiError}
                </div>
              )}

              {/* Document type selector (only shown when adding to existing supplier) */}
              {presetSupplierId && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tipo de documento
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDocumentRole('cost_contract')}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        documentRole === 'cost_contract'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted'
                      }`}
                      disabled={isLoading}
                    >
                      Contrato de costo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocumentRole('additional')}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        documentRole === 'additional'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted'
                      }`}
                      disabled={isLoading}
                    >
                      Documento adicional
                    </button>
                  </div>
                </div>
              )}

              {/* Supplier section (hidden if pre-scoped) */}
              {!presetSupplierId && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Datos del proveedor
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="legalName" className="text-sm font-medium leading-none">
                        Nombre legal <span className="text-destructive">*</span>
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
                        <p className="text-xs text-destructive">{fieldErrors.legalName}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="taxIdentifier" className="text-sm font-medium leading-none">
                        RUT <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="taxIdentifier"
                        type="text"
                        placeholder="12345678-9"
                        value={fields.taxIdentifier}
                        onChange={(e) => setField('taxIdentifier', e.target.value)}
                        aria-invalid={!!fieldErrors.taxIdentifier}
                        disabled={isLoading}
                      />
                      {fieldErrors.taxIdentifier ? (
                        <p className="text-xs text-destructive">{fieldErrors.taxIdentifier}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Formato: 12345678-9 o 12.345.678-9</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Service section (cost contracts only) */}
              {documentRole === 'cost_contract' && <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Servicio (opcional)
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="serviceCategory" className="text-sm font-medium leading-none">
                      Categoría del servicio
                    </label>
                    <Input
                      id="serviceCategory"
                      type="text"
                      placeholder="ej: Consultoría, Arriendo, Software"
                      value={fields.serviceCategory}
                      onChange={(e) => setField('serviceCategory', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="serviceDescription" className="text-sm font-medium leading-none">
                      Descripción del servicio
                    </label>
                    <Textarea
                      id="serviceDescription"
                      placeholder="Describe el servicio prestado por este proveedor..."
                      value={fields.serviceDescription}
                      onChange={(e) => setField('serviceDescription', e.target.value)}
                      disabled={isLoading}
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tariffType" className="text-sm font-medium leading-none">
                      Tipo de tarifa
                    </label>
                    <Input
                      id="tariffType"
                      type="text"
                      placeholder="ej: Fijo en CLP, Variable por hora"
                      value={fields.tariffType}
                      onChange={(e) => setField('tariffType', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tariffDetail" className="text-sm font-medium leading-none">
                      Detalle de tarifa
                    </label>
                    <Textarea
                      id="tariffDetail"
                      placeholder="Condiciones, descuentos u observaciones adicionales..."
                      value={fields.tariffDetail}
                      onChange={(e) => setField('tariffDetail', e.target.value)}
                      disabled={isLoading}
                      rows={2}
                    />
                  </div>
                </div>
              </div>}

              {/* Amounts section (cost contracts only) */}
              {documentRole === 'cost_contract' && <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Montos (opcional)
                </p>
                <div className="space-y-3">
                  {fields.amounts.map((amount, idx) => (
                    <div key={idx} className="relative rounded-lg border bg-muted/20 p-3">
                      <button
                        type="button"
                        onClick={() => setField('amounts', fields.amounts.filter((_, i) => i !== idx))}
                        className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label="Eliminar monto"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2 flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Concepto</label>
                          <Input
                            placeholder="ej: Renta mensual"
                            value={amount.concept}
                            onChange={(e) => {
                              const updated = [...fields.amounts];
                              updated[idx] = { ...updated[idx], concept: e.target.value };
                              setField('amounts', updated);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Monto</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={amount.amount}
                            onChange={(e) => {
                              const updated = [...fields.amounts];
                              updated[idx] = { ...updated[idx], amount: e.target.value };
                              setField('amounts', updated);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Moneda</label>
                          <Input
                            placeholder="CLP"
                            value={amount.currency}
                            onChange={(e) => {
                              const updated = [...fields.amounts];
                              updated[idx] = { ...updated[idx], currency: e.target.value };
                              setField('amounts', updated);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="col-span-2 flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Frecuencia</label>
                          <Input
                            placeholder="ej: Mensual, Por hora, Único"
                            value={amount.frequency}
                            onChange={(e) => {
                              const updated = [...fields.amounts];
                              updated[idx] = { ...updated[idx], frequency: e.target.value };
                              setField('amounts', updated);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setField('amounts', [...fields.amounts, emptyAmount()])}
                    disabled={isLoading}
                  >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Agregar monto
                  </Button>
                </div>
              </div>}

              {/* Uploaded file summary */}
              {selectedFile && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Documento de respaldo
                  </p>
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
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
                </div>
              )}
            </div>

            <SheetFooter className="border-t px-4 py-4">
              {!presetSupplierId && step === 'form' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('upload')}
                  disabled={isLoading}
                  className="mr-auto"
                >
                  ← Volver
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar proveedor'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
