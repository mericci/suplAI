'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, CheckCircleIcon } from 'lucide-react';
import { registerOrganization } from '@/integrations/backend/organizations';
import { createClient } from '@/lib/supabase/client';
import { HttpError } from '@/lib/http';
import type { FormState, FormErrors, SubmitStatus } from './types';

/* ------------------------------------------------------------------ */
/*  Validation                                                          */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(state: FormState): FormErrors {
  const errors: FormErrors = { org: {}, adminUser: {} };

  if (!state.org.legalName.trim() || state.org.legalName.trim().length < 2) {
    errors.org.legalName = 'El nombre legal debe tener al menos 2 caracteres.';
  }
  if (!state.org.taxIdentifier.trim()) {
    errors.org.taxIdentifier = 'El RUT es obligatorio.';
  }
  if (!state.org.taxAuthorityPassword) {
    errors.org.taxAuthorityPassword = 'La contraseña SII es obligatoria.';
  }

  if (state.includeAdmin) {
    if (!state.adminUser.firstName.trim()) {
      errors.adminUser.firstName = 'El nombre es obligatorio.';
    }
    if (!state.adminUser.lastName.trim()) {
      errors.adminUser.lastName = 'El apellido es obligatorio.';
    }
    if (!state.adminUser.email.trim()) {
      errors.adminUser.email = 'El correo es obligatorio.';
    } else if (!EMAIL_RE.test(state.adminUser.email)) {
      errors.adminUser.email = 'Ingresa un correo válido.';
    }

    const pw = state.adminUser.password;
    if (!pw) {
      errors.adminUser.password = 'La contraseña es obligatoria.';
    } else if (pw.length < 8) {
      errors.adminUser.password = 'Debe tener al menos 8 caracteres.';
    } else if (!/[A-Z]/.test(pw)) {
      errors.adminUser.password = 'Debe incluir al menos una mayúscula.';
    } else if (!/[a-z]/.test(pw)) {
      errors.adminUser.password = 'Debe incluir al menos una minúscula.';
    } else if (!/\d/.test(pw)) {
      errors.adminUser.password = 'Debe incluir al menos un número.';
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return (
    Object.values(errors.org).some(Boolean)
    || Object.values(errors.adminUser).some(Boolean)
  );
}

/* ------------------------------------------------------------------ */
/*  Initial state                                                       */
/* ------------------------------------------------------------------ */

const INITIAL_STATE: FormState = {
  org: { legalName: '', taxIdentifier: '', taxAuthorityPassword: '' },
  adminUser: {
    firstName: '', lastName: '', email: '', password: '',
  },
  includeAdmin: false,
};

const INITIAL_ERRORS: FormErrors = { org: {}, adminUser: {} };

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function OrganizationRegistrationForm(): React.JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSiiPassword, setShowSiiPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const isLoading = submitStatus === 'loading';

  /* ---------------------------------------------------------------- */
  /*  Field helpers                                                    */
  /* ---------------------------------------------------------------- */

  function setOrgField(field: keyof FormState['org'], value: string): void {
    setForm((prev) => ({ ...prev, org: { ...prev.org, [field]: value } }));
    setErrors((prev) => ({ ...prev, org: { ...prev.org, [field]: undefined } }));
  }

  function setAdminField(field: keyof FormState['adminUser'], value: string): void {
    setForm((prev) => ({ ...prev, adminUser: { ...prev.adminUser, [field]: value } }));
    setErrors((prev) => ({ ...prev, adminUser: { ...prev.adminUser, [field]: undefined } }));
  }

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate(form);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setSubmitStatus('loading');

    try {
      const payload = {
        organization: { ...form.org },
        ...(form.includeAdmin ? { adminUser: { ...form.adminUser } } : {}),
      };

      const response = await registerOrganization(payload);

      if (response.success) {
        const sessionData = response.data?.session;
        if (sessionData) {
          const supabase = createClient();
          await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });
          router.push('/onboarding/configure-invoices');
          router.refresh();
        } else {
          setSubmitStatus('success');
        }
      } else {
        setApiError(response.error ?? 'Error al crear la organización.');
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
  /*  Success state                                                    */
  /* ---------------------------------------------------------------- */

  if (submitStatus === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-bold text-foreground">
            ¡Organización creada!
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Tu organización fue registrada exitosamente.
            {form.includeAdmin && (
              <>
                {' '}
                <a href="/login" className="font-medium text-primary hover:underline">
                  Iniciar sesión
                </a>
                {' '}con las credenciales del administrador.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Form                                                             */
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
              Registrar organización
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu empresa en SuplAI para empezar a gestionar facturas.
            </p>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border bg-card p-6 shadow-sm space-y-5"
        >

          {/* ---- Organization section ---- */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Datos de la empresa
            </h2>

            {/* Legal name */}
            <div className="space-y-1.5">
              <label htmlFor="legalName" className="text-sm font-medium text-foreground">
                Nombre legal
              </label>
              <input
                id="legalName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Corp S.A."
                value={form.org.legalName}
                onChange={(e) => setOrgField('legalName', e.target.value)}
                disabled={isLoading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.org.legalName && (
                <p className="text-xs text-destructive">{errors.org.legalName}</p>
              )}
            </div>

            {/* Tax identifier */}
            <div className="space-y-1.5">
              <label htmlFor="taxIdentifier" className="text-sm font-medium text-foreground">
                RUT empresa
              </label>
              <input
                id="taxIdentifier"
                type="text"
                placeholder="76.123.456-7"
                value={form.org.taxIdentifier}
                onChange={(e) => setOrgField('taxIdentifier', e.target.value)}
                disabled={isLoading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.org.taxIdentifier && (
                <p className="text-xs text-destructive">{errors.org.taxIdentifier}</p>
              )}
            </div>

            {/* SII password */}
            <div className="space-y-1.5">
              <label htmlFor="taxAuthorityPassword" className="text-sm font-medium text-foreground">
                Contraseña SII
              </label>
              <div className="relative">
                <input
                  id="taxAuthorityPassword"
                  type={showSiiPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Contraseña del SII"
                  value={form.org.taxAuthorityPassword}
                  onChange={(e) => setOrgField('taxAuthorityPassword', e.target.value)}
                  disabled={isLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSiiPassword((v) => !v)}
                  aria-label={showSiiPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSiiPassword
                    ? <EyeOffIcon className="h-4 w-4" />
                    : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.org.taxAuthorityPassword && (
                <p className="text-xs text-destructive">{errors.org.taxAuthorityPassword}</p>
              )}
            </div>
          </div>

          {/* ---- Admin user toggle ---- */}
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Registrar usuario administrador
              </p>
              <p className="text-xs text-muted-foreground">
                Crea una cuenta de acceso para esta organización.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.includeAdmin}
              onClick={() => setForm((prev) => ({ ...prev, includeAdmin: !prev.includeAdmin }))}
              disabled={isLoading}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${form.includeAdmin ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${form.includeAdmin ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* ---- Admin fields (conditional) ---- */}
          {form.includeAdmin && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Cuenta de administrador
              </h2>

              {/* First name + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="adminFirstName" className="text-sm font-medium text-foreground">
                    Nombre
                  </label>
                  <input
                    id="adminFirstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Juan"
                    value={form.adminUser.firstName}
                    onChange={(e) => setAdminField('firstName', e.target.value)}
                    disabled={isLoading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.adminUser.firstName && (
                    <p className="text-xs text-destructive">{errors.adminUser.firstName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="adminLastName" className="text-sm font-medium text-foreground">
                    Apellido
                  </label>
                  <input
                    id="adminLastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Díaz"
                    value={form.adminUser.lastName}
                    onChange={(e) => setAdminField('lastName', e.target.value)}
                    disabled={isLoading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.adminUser.lastName && (
                    <p className="text-xs text-destructive">{errors.adminUser.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="adminEmail" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@empresa.com"
                  value={form.adminUser.email}
                  onChange={(e) => setAdminField('email', e.target.value)}
                  disabled={isLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.adminUser.email && (
                  <p className="text-xs text-destructive">{errors.adminUser.email}</p>
                )}
              </div>

              {/* Admin password */}
              <div className="space-y-1.5">
                <label htmlFor="adminPassword" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    type={showAdminPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.adminUser.password}
                    onChange={(e) => setAdminField('password', e.target.value)}
                    disabled={isLoading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminPassword
                      ? <EyeOffIcon className="h-4 w-4" />
                      : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.adminUser.password && (
                  <p className="text-xs text-destructive">{errors.adminUser.password}</p>
                )}
              </div>
            </div>
          )}

          {/* ---- API error banner ---- */}
          {apiError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          )}

          {/* ---- Submit ---- */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? 'Creando organización...' : 'Crear organización'}
          </button>
        </form>
      </div>
    </div>
  );
}
