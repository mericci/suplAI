'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getSupplierPaymentInfo,
  upsertSupplierPaymentInfo,
} from '@/integrations/backend/suppliers';
import type { UpsertSupplierPaymentInfoPayload } from '@/integrations/backend/suppliers';
import {
  CHILEAN_BANKS,
  ACCOUNT_TYPES,
  CURRENCIES,
} from './constants/chilean-banks';
import type { AccountTypeKey, CurrencyKey } from './constants/chilean-banks';

interface PaymentInfoTabProps {
  supplierId: string;
  orgId: string;
  defaultAccountHolderName?: string;
  defaultTaxIdentifier?: string;
  readOnly?: boolean;
}

const EMPTY_FORM: UpsertSupplierPaymentInfoPayload = {
  accountHolderName: '',
  taxIdentifier: '',
  bank: '',
  accountType: 'cuenta_corriente',
  accountNumber: '',
  currency: 'CLP',
  email: '',
};

export function PaymentInfoTab({
  supplierId,
  orgId,
  defaultAccountHolderName = '',
  defaultTaxIdentifier = '',
  readOnly = false,
}: PaymentInfoTabProps): React.JSX.Element {
  const [form, setForm] = useState<UpsertSupplierPaymentInfoPayload>({
    ...EMPTY_FORM,
    accountHolderName: defaultAccountHolderName,
    taxIdentifier: defaultTaxIdentifier,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentInfo = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await getSupplierPaymentInfo(orgId, supplierId);
        if (res.success && res.data) {
          setForm({
            accountHolderName: res.data.accountHolderName,
            taxIdentifier: res.data.taxIdentifier,
            bank: res.data.bank,
            accountType: res.data.accountType,
            accountNumber: res.data.accountNumber,
            currency: res.data.currency,
            email: res.data.email ?? '',
          });
        }
      } catch {
        // If no payment info exists yet, keep defaults
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [supplierId, orgId]);

  function handleFieldChange(field: keyof UpsertSupplierPaymentInfoPayload, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSuccess(false);
    setError(null);
  }

  async function handleSave(): Promise<void> {
    if (!form.bank) {
      setError('Selecciona un banco.');
      return;
    }
    if (!form.accountNumber.trim()) {
      setError('El número de cuenta es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await upsertSupplierPaymentInfo(orgId, supplierId, form);
      if (!res.success) {
        setError(res.error ?? 'Error al guardar la información de pago.');
        return;
      }
      setSuccess(true);
      setIsDirty(false);
    } catch {
      setError('Error al guardar la información de pago.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre del titular</Label>
          <p className="flex h-9 items-center text-sm">
            {form.accountHolderName || <span className="text-muted-foreground">—</span>}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>RUT</Label>
          <p className="flex h-9 items-center text-sm">
            {form.taxIdentifier || <span className="text-muted-foreground">—</span>}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-bank">Banco</Label>
          <Select
            value={form.bank}
            onValueChange={(value) => handleFieldChange('bank', value)}
            disabled={readOnly}
          >
            <SelectTrigger id="payment-bank">
              <SelectValue placeholder="Seleccionar banco" />
            </SelectTrigger>
            <SelectContent>
              {CHILEAN_BANKS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-account-type">Tipo de cuenta</Label>
          <Select
            value={form.accountType}
            onValueChange={(value) => handleFieldChange('accountType', value as AccountTypeKey)}
            disabled={readOnly}
          >
            <SelectTrigger id="payment-account-type">
              <SelectValue placeholder="Seleccionar tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(ACCOUNT_TYPES) as [AccountTypeKey, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-account-number">N° de cuenta</Label>
          <Input
            id="payment-account-number"
            inputMode="numeric"
            maxLength={16}
            value={form.accountNumber}
            onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
            placeholder="Número de cuenta"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-currency">Moneda</Label>
          <Select
            value={form.currency}
            onValueChange={(value) => handleFieldChange('currency', value as CurrencyKey)}
            disabled={readOnly}
          >
            <SelectTrigger id="payment-currency">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CURRENCIES) as [CurrencyKey, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="payment-email">Correo de contacto</Label>
          <Input
            id="payment-email"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="proveedor@ejemplo.com"
            disabled={readOnly}
          />
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-700">
          Información de pago guardada correctamente.
        </p>
      )}

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      )}
    </div>
  );
}
