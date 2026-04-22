'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import type { UserPaymentInfo } from '@supl/shared';
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
import { cn } from '@/lib/utils';
import { formatRut } from '@/lib/rut';
import { listPaymentInfos, createPaymentInfo, updateRut } from '@/integrations/backend/users';
import { CHILEAN_BANKS, ACCOUNT_TYPES } from '../constants';
import type { AccountTypeKey } from '../constants';

interface BankingInfoStepProps {
  userRut: string | null;
  selectedAccountId: string | null;
  onSelect: (accountId: string) => void;
  onNext: () => Promise<void>;
}

interface NewAccountForm {
  bank: string;
  accountType: AccountTypeKey;
  accountNumber: string;
  isDefault: boolean;
}

const EMPTY_FORM: NewAccountForm = {
  bank: '',
  accountType: 'cuenta_corriente',
  accountNumber: '',
  isDefault: true,
};

export function BankingInfoStep({
  userRut,
  selectedAccountId,
  onSelect,
  onNext,
}: BankingInfoStepProps): React.JSX.Element {
  const [accounts, setAccounts] = useState<UserPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rut, setRut] = useState(userRut ?? '');
  const [rutSaved, setRutSaved] = useState(!!userRut);

  useEffect(() => {
    listPaymentInfos()
      .then((res) => {
        if (res.success && res.data) {
          setAccounts(res.data);
          const defaultAcc = res.data.find((a) => a.is_default) ?? res.data[0];
          if (defaultAcc && !selectedAccountId) onSelect(defaultAcc.id);
          if (res.data.length === 0) setShowAddForm(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveAccount(): Promise<void> {
    if (!form.bank) { setError('Selecciona un banco.'); return; }
    if (!form.accountNumber.trim()) { setError('El número de cuenta es obligatorio.'); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await createPaymentInfo({
        bank: form.bank,
        accountType: form.accountType,
        accountNumber: form.accountNumber.trim(),
        isDefault: form.isDefault || accounts.length === 0,
      });

      if (!res.success || !res.data) {
        setError(res.error ?? 'Error al guardar la cuenta.');
        return;
      }

      setAccounts((prev) => {
        const updated = form.isDefault ? prev.map((a) => ({ ...a, is_default: false })) : prev;
        return [...updated, res.data!];
      });
      onSelect(res.data.id);
      setShowAddForm(false);
      setForm(EMPTY_FORM);
    } catch {
      setError('Error al guardar la cuenta.');
    } finally {
      setSaving(false);
    }
  }

  function canProceed(): boolean {
    return !!selectedAccountId && (rutSaved || rut.trim().length > 0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rut-field">RUT</Label>
        {rutSaved ? (
          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm">
            <span className="font-mono">{formatRut(rut)}</span>
            <CheckIcon className="ml-auto h-4 w-4 text-green-600" />
          </div>
        ) : (
          <Input
            id="rut-field"
            placeholder="12345678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
          />
        )}
        {!rutSaved && (
          <p className="text-xs text-muted-foreground">
            Tu RUT se guardará junto con tu primera cuenta bancaria.
          </p>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="space-y-2">
          <Label>Cuenta bancaria</Label>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelect(acc.id)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  selectedAccountId === acc.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{acc.bank}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACCOUNT_TYPES[acc.account_type]} · {acc.account_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {acc.is_default && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Por defecto
                      </span>
                    )}
                    {selectedAccountId === acc.id && (
                      <CheckIcon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!showAddForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar otra cuenta
            </Button>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <p className="text-sm font-semibold">Nueva cuenta bancaria</p>

          <div className="space-y-1.5">
            <Label>Banco</Label>
            <Select
              value={form.bank}
              onValueChange={(v) => setForm((p) => ({ ...p, bank: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar banco" />
              </SelectTrigger>
              <SelectContent>
                {CHILEAN_BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de cuenta</Label>
            <Select
              value={form.accountType}
              onValueChange={(v) => setForm((p) => ({ ...p, accountType: v as AccountTypeKey }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ACCOUNT_TYPES) as [AccountTypeKey, string][]).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Número de cuenta</Label>
            <Input
              inputMode="numeric"
              maxLength={20}
              value={form.accountNumber}
              onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
              placeholder="Número de cuenta"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            {accounts.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowAddForm(false); setError(null); setForm(EMPTY_FORM); }}
                disabled={saving}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAccount}
              disabled={saving}
              className="ml-auto"
            >
              {saving ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar cuenta
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={async () => {
            setSubmitting(true);
            setError(null);
            if (!rutSaved && rut.trim()) {
              const rutRes = await updateRut(rut.trim());
              if (!rutRes.success) {
                setError(rutRes.error ?? 'Error al guardar el RUT.');
                setSubmitting(false);
                return;
              }
              setRutSaved(true);
            }
            await onNext();
            setSubmitting(false);
          }}
          disabled={!canProceed() || submitting}
        >
          {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Siguiente
        </Button>
      </div>
    </div>
  );
}
