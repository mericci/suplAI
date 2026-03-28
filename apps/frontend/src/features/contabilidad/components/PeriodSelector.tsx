'use client';

import { CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContabilidadPeriod } from '@/integrations/backend/contabilidad';
import { CONTABILIDAD_PERIOD_OPTIONS } from '../constants';

interface PeriodSelectorProps {
  value: ContabilidadPeriod;
  onChange: (period: ContabilidadPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps): React.JSX.Element {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ContabilidadPeriod)}>
      <SelectTrigger className="w-40 gap-2">
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CONTABILIDAD_PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
