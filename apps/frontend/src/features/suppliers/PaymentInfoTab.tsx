'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

const EMPTY_FORM: UpsertSupplierPaymentInfoPayload = {
  accountHolderName: '',
  taxIdentifier: '',
  bank: '',
  accountType: 'cuenta_corriente',
  accountNumber: '',
  currency: 'CLP',
};

export function PaymentInfoTab({
  supplierId,
  orgId,
  defaultAccountHolderName = '',
  defaultTaxIdentifier = '',
}: PaymentInfoTabProps): React.JSX.Element {
  const [form, setForm] = useState<UpsertSupplierPaymentInfoPayload>({
    ...EMPTY_FORM,
    accountHolderName: defaultAccountHolderName,
    taxIdentifier: defaultTaxIdentifier,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    setSuccess(false);
    setError(null);
  }

  async function handleSave(): Promise<void> {
    if (!form.accountHolderName.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!form.taxIdentifier.trim()) {
      setError('El RUT es obligatorio.');
      return;
    }
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
          <label className="text-sm font-medium">Nombre del titular</label>
          <Input
            value={form.accountHolderName}
            onChange={(e) => handleFieldChange('accountHolderName', e.target.value)}
            placeholder="Nombre del titular de la cuenta"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">RUT</label>
          <Input
            value={form.taxIdentifier}
            onChange={(e) => handleFieldChange('taxIdentifier', e.target.value)}
            placeholder="Ej: 76.543.210-K"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Banco</label>
          <Select
            value={form.bank}
            onValueChange={(value) => handleFieldChange('bank', value)}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Tipo de cuenta</label>
          <Select
            value={form.accountType}
            onValueChange={(value) => handleFieldChange('accountType', value as AccountTypeKey)}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">N° de cuenta</label>
          <Input
            value={form.accountNumber}
            onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
            placeholder="Número de cuenta"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Moneda</label>
          <Select
            value={form.currency}
            onValueChange={(value) => handleFieldChange('currency', value as CurrencyKey)}
          >
            <SelectTrigger>
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
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600">Información de pago guardada correctamente.</p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
