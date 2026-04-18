'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import type { RendicionDocument } from '@supl/shared';
import { cn } from '@/lib/utils';
import { createRendicion } from '@/integrations/backend/rendiciones';
import { BankingInfoStep } from './steps/BankingInfoStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { SummaryStep } from './steps/SummaryStep';

interface NuevaRendicionProps {
  orgId: string;
  userRut: string | null;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { label: 'Datos bancarios' },
  { label: 'Documentos' },
  { label: 'Resumen' },
];

export function NuevaRendicion({ orgId, userRut }: NuevaRendicionProps): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [rendicionId, setRendicionId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RendicionDocument[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleStep1Next(): Promise<void> {
    if (!selectedAccountId) return;
    setCreateError(null);

    if (!rendicionId) {
      const res = await createRendicion(orgId, { userPaymentInfoId: selectedAccountId });
      if (!res.success || !res.data) {
        setCreateError(res.error ?? 'Error al crear la rendición.');
        return;
      }
      setRendicionId(res.data.id);
    }

    setStep(2);
  }

  function handleDocumentAdded(doc: RendicionDocument): void {
    setDocuments((prev) => {
      const existing = prev.findIndex((d) => d.id === doc.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = doc;
        return updated;
      }
      return [...prev, doc];
    });
  }

  function handleAmountChange(docId: string, amount: number): void {
    setDocuments((prev) => prev.map(
      (d) => (d.id === docId ? { ...d, corrected_amount: amount } : d),
    ));
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nueva rendición</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube tus documentos de respaldo y te reembolsaremos el monto validado.
        </p>
      </div>

      <nav aria-label="Pasos" className="mb-8 flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const stepNum = (idx + 1) as Step;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary text-primary',
                    !isCompleted && !isActive && 'border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'text-xs',
                    isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mb-4 flex-1 border-t-2 transition-colors',
                    step > stepNum ? 'border-primary' : 'border-muted-foreground/20',
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      {createError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {createError}
        </div>
      )}

      {step === 1 && (
        <BankingInfoStep
          userRut={userRut}
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
          onNext={handleStep1Next}
        />
      )}

      {step === 2 && rendicionId && (
        <DocumentsStep
          orgId={orgId}
          rendicionId={rendicionId}
          documents={documents}
          onDocumentAdded={handleDocumentAdded}
          onAmountChange={handleAmountChange}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && rendicionId && (
        <SummaryStep
          orgId={orgId}
          rendicionId={rendicionId}
          documents={documents}
          onAmountChange={handleAmountChange}
          onBack={() => setStep(2)}
          onApproved={() => router.push('/rendiciones')}
          onSentForReview={() => router.push('/rendiciones')}
        />
      )}
    </div>
  );
}
