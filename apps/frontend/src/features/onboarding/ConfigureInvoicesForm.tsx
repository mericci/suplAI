'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from 'lucide-react';
import { getMe } from '@/integrations/backend/users';
import { importInvoices } from '@/integrations/backend/invoices';
import { HttpError } from '@/lib/http';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function lastMonthValue(): { year: number; month: number } {
  const now = new Date();
  if (now.getMonth() === 0) {
    return { year: now.getFullYear() - 1, month: 12 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function isAfterLastMonth(year: number, month: number): boolean {
  const { year: ly, month: lm } = lastMonthValue();
  return year > ly || (year === ly && month > lm);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export function ConfigureInvoicesForm(): React.JSX.Element {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);

  const [year, setYear] = useState<string>(String(CURRENT_YEAR));
  const [month, setMonth] = useState<string>('01');
  const [defaultStatus, setDefaultStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [fromError, setFromError] = useState<string | null>(null);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);

  const isLoading = submitStatus === 'loading';

  /* Load current user's orgId */
  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.success && res.data) {
          setOrgId(res.data.organization_id);
        }
      })
      .catch(() => {
        // silent — orgId remains null, submit will surface the error
      });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Submit                                                            */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError(null);
    setFromError(null);

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (isAfterLastMonth(y, m)) {
      const { year: ly, month: lm } = lastMonthValue();
      setFromError(`El período no puede ser posterior a ${ly}-${String(lm).padStart(2, '0')}.`);
      return;
    }

    if (!orgId) {
      setApiError('No se pudo obtener la organización. Recarga la página.');
      return;
    }

    setSubmitStatus('loading');

    try {
      const from = `${year}-${month}`;
      const response = await importInvoices(orgId, { from, defaultStatus });

      if (response.success) {
        setImportedCount(response.data?.count ?? 0);
        setSubmitStatus('success');
      } else {
        setApiError(response.error ?? 'Error al importar facturas.');
        setSubmitStatus('error');
      }
    } catch (err) {
      setApiError(
        err instanceof HttpError
          ? err.message
          : 'Error inesperado. Intenta nuevamente.',
      );
      setSubmitStatus('error');
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Success state                                                     */
  /* ---------------------------------------------------------------- */

  if (submitStatus === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-bold text-foreground">
            ¡Importación completada!
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Se importaron <span className="font-semibold text-foreground">{importedCount}</span> facturas
            correctamente desde el SII.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Form                                                              */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
              S
            </span>
            <span className="text-2xl font-bold text-foreground">SuplAI</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Importar facturas históricas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona desde qué período deseas importar tus facturas del SII.
            </p>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border bg-card p-6 shadow-sm space-y-5"
        >

          {/* Period section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Período de inicio
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Year */}
              <div className="space-y-1.5">
                <label htmlFor="year" className="text-sm font-medium text-foreground">
                  Año
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => { setYear(e.target.value); setFromError(null); }}
                  disabled={isLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="space-y-1.5">
                <label htmlFor="month" className="text-sm font-medium text-foreground">
                  Mes
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => { setMonth(e.target.value); setFromError(null); }}
                  disabled={isLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {fromError && (
              <p className="text-xs text-destructive">{fromError}</p>
            )}
          </div>

          {/* Default status */}
          <div className="space-y-1.5">
            <label htmlFor="defaultStatus" className="text-sm font-medium text-foreground">
              Estado por defecto
            </label>
            <select
              id="defaultStatus"
              value={defaultStatus}
              onChange={(e) => setDefaultStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
              disabled={isLoading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Estado inicial que se asignará a todas las facturas importadas.
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading
              ? 'Conectando con el SII y descargando facturas...'
              : 'Importar facturas'}
          </button>

          {/* Skip link */}
          <p className="text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push('/')}
              disabled={isLoading}
              className="hover:underline disabled:opacity-50"
            >
              Omitir por ahora
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
