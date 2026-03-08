'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  type LabelProps,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BudgetMetrics, BudgetItemWithSpend } from '@/integrations/backend/budget';
import { MONTH_LABELS } from './constants';

interface MetricsTabProps {
  metrics: BudgetMetrics | null;
  loading: boolean;
  items: BudgetItemWithSpend[];
  onFilterChange: (budgetItemIds: string[] | null) => void;
}

function formatMonthLabel(month: string): string {
  const [, m] = month.split('-');
  return MONTH_LABELS[m] ?? month;
}

function formatCLP(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const ALL_VALUE = '__all__';

// Custom SVG label rendered as a floating pill at the right edge of the reference line
function BudgetLimitLabel({ viewBox, value }: LabelProps): React.JSX.Element | null {
  if (!viewBox || typeof viewBox !== 'object') return null;
  const { x = 0, y = 0, width = 0 } = viewBox as { x: number; y: number; width: number };
  const labelText = String(value ?? '');
  const charW = 6.8;
  const padX = 9;
  const padY = 3;
  const rectW = labelText.length * charW + padX * 2;
  const rectH = 18;
  const lx = x + width - rectW - 2;
  const ly = y - rectH / 2 - 2;

  return (
    <g>
      <rect
        x={lx}
        y={ly}
        width={rectW}
        height={rectH}
        rx={9}
        fill="white"
        stroke="#e2af3f"
        strokeWidth={1}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
      />
      <text
        x={lx + rectW / 2}
        y={ly + rectH / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#92400e"
        fontSize={9.5}
        fontWeight={600}
        letterSpacing={0.2}
      >
        {labelText}
      </text>
    </g>
  );
}

export function MetricsTab({
  metrics,
  loading,
  items,
  onFilterChange,
}: MetricsTabProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(ALL_VALUE);

  function handleFilterChange(val: string): void {
    setSelectedId(val);
    if (val === ALL_VALUE) {
      onFilterChange(null);
    } else {
      onFilterChange([val]);
    }
  }

  // Budget reference value: monthly budget from the response (constant across months)
  const budgetReference = metrics?.monthly.find((m) => m.totalBudget > 0)?.totalBudget ?? 0;

  const chartData = (metrics?.monthly ?? []).map((m) => ({
    month: formatMonthLabel(m.month),
    totalSpent: m.totalSpent,
    compliancePct: m.compliancePct,
  }));

  // Y axis domain for spend chart: leave room above the reference line
  const maxSpent = Math.max(...(metrics?.monthly ?? []).map((m) => m.totalSpent), budgetReference, 1);
  const spendDomain: [number, number] = [0, Math.ceil(maxSpent * 1.15)];

  // Compliance Y domain: auto when values exceed 100%
  const maxCompliance = Math.max(...(metrics?.monthly ?? []).map((m) => m.compliancePct), 100);
  const complianceDomain: [number, number] = [0, Math.ceil(maxCompliance * 1.15)];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por presupuesto:</span>
        <Select value={selectedId} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los presupuestos</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Cargando métricas...
        </div>
      ) : !metrics || metrics.monthly.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          No hay datos de métricas disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gasto acumulado mensual — with budget reference line */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">Gasto acumulado mensual</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatCLP}
                  domain={spendDomain}
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(value) => [
                    new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      maximumFractionDigits: 0,
                    }).format(Number(value ?? 0)),
                    'Gasto',
                  ]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="totalSpent" fill="#4f7beb" radius={[4, 4, 0, 0]} />
                {budgetReference > 0 && (
                  <ReferenceLine
                    y={budgetReference}
                    stroke="#e2af3f"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.75}
                    label={<BudgetLimitLabel value={`Límite ${formatCLP(budgetReference)}`} />}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* % Cumplimiento mensual */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">% Cumplimiento mensual</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  domain={complianceDomain}
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, 'Cumplimiento']}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="compliancePct" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
