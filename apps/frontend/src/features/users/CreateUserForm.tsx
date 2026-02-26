'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMe, createUser } from '@/integrations/backend/users';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FormFields {
  email: string;
  firstName: string;
  lastName: string;
  role: 'standard' | 'admin' | 'moderator';
  password: string;
}

interface FieldErrors {
  email?: string;
  role?: string;
  password?: string;
}

interface CreateUserFormProps {
  onSuccess?: () => void;
}

const ROLE_OPTIONS: { value: FormFields['role']; label: string }[] = [
  { value: 'standard', label: 'Estándar' },
  { value: 'admin', label: 'Administrador' },
  { value: 'moderator', label: 'Moderador' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cached so the form doesn't call getMe() on every mount
let cachedOrgId: string | null = null;

export function CreateUserForm({ onSuccess }: CreateUserFormProps): React.JSX.Element {
  const [fields, setFields] = useState<FormFields>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'standard',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const orgIdRef = useRef<string | null>(cachedOrgId);

  useEffect(() => {
    if (orgIdRef.current) return;
    getMe()
      .then((res) => {
        if (res.success && res.data) {
          cachedOrgId = res.data.organization_id;
          orgIdRef.current = res.data.organization_id;
        }
      })
      .catch(() => {
        // org context will be caught at submit time
      });
  }, []);

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]): void {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!fields.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!EMAIL_REGEX.test(fields.email.trim())) {
      errors.email = 'Ingresa un email válido';
    }

    if (!fields.role) {
      errors.role = 'Selecciona un rol';
    }

    if (fields.password && fields.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (
      fields.password &&
      (!/[A-Z]/.test(fields.password) ||
        !/[a-z]/.test(fields.password) ||
        !/[0-9]/.test(fields.password))
    ) {
      errors.password = 'Debe incluir mayúsculas, minúsculas y un número';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    const orgId = orgIdRef.current;
    if (!orgId) {
      setApiError('No se pudo obtener el contexto de la organización. Recarga la página.');
      return;
    }

    setStatus('loading');

    try {
      const payload = {
        email: fields.email.trim(),
        ...(fields.firstName.trim() && { firstName: fields.firstName.trim() }),
        ...(fields.lastName.trim() && { lastName: fields.lastName.trim() }),
        role: fields.role,
        ...(fields.password && { password: fields.password }),
      };

      const res = await createUser(orgId, payload);

      if (!res.success) {
        setApiError(res.error ?? 'Ocurrió un error al crear el usuario');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      setStatus('error');
    }
  }

  function handleCreateAnother(): void {
    setFields({ email: '', firstName: '', lastName: '', role: 'standard', password: '' });
    setFieldErrors({});
    setApiError(null);
    setStatus('idle');
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✓</span>
          </div>
          <div>
            <p className="text-lg font-semibold">Usuario creado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fields.email} fue agregado al equipo correctamente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCreateAnother}>
              Crear otro
            </Button>
            {onSuccess && (
              <Button onClick={onSuccess}>Ver equipo</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold">Datos del usuario</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El usuario recibirá acceso según el rol asignado.
          </p>
        </div>

        {apiError && (
          <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="usuario@empresa.com"
              value={fields.email}
              onChange={(e) => setField('email', e.target.value)}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          {/* First + Last name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-sm font-medium leading-none">Nombre</label>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Juan"
                value={fields.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-sm font-medium leading-none">Apellido</label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Pérez"
                value={fields.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
              />
            </div>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium leading-none">
              Rol <span className="text-destructive">*</span>
            </label>
            <select
              id="role"
              value={fields.role}
              onChange={(e) => setField('role', e.target.value as FormFields['role'])}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-invalid={!!fieldErrors.role}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p className="text-xs text-destructive">{fieldErrors.role}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium leading-none">Contraseña (opcional)</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                value={fields.password}
                onChange={(e) => setField('password', e.target.value)}
                className="pr-10"
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Si no se asigna contraseña, el usuario podrá crear una al iniciar sesión.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creando...' : 'Crear usuario'}
          </Button>
        </div>
      </div>
    </form>
  );
}
