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
const LIMIT_COLOR = '#d97706';

// Generates evenly-spaced ticks and inserts the budget reference so it always appears
function buildSpendTicks(domainMax: number, budgetRef: number): number[] {
  const step = Math.ceil(domainMax / 4 / 1000) * 1000 || 1;
  const ticks: number[] = [];
  for (let t = 0; t <= domainMax; t += step) ticks.push(t);
  if (budgetRef > 0 && !ticks.includes(budgetRef)) {
    ticks.push(budgetRef);
    ticks.sort((a, b) => a - b);
  }
  return ticks;
}

// Custom Y-axis tick: colors the budget-limit value amber, rest stay grey
function SpendAxisTick({
  x, y, payload, budgetRef,
}: {
  x?: number | string; y?: number | string;
  payload?: { value: number };
  budgetRef: number;
}): React.JSX.Element | null {
  if (!payload) return null;
  const isLimit = payload.value === budgetRef;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill={isLimit ? LIMIT_COLOR : '#888'}
        fontSize={11}
        fontWeight={isLimit ? 700 : 400}
      >
        {formatCLP(payload.value)}
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
                  domain={spendDomain}
                  ticks={buildSpendTicks(spendDomain[1], budgetReference)}
                  tick={(props) => <SpendAxisTick {...props} budgetRef={budgetReference} />}
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
                    stroke={LIMIT_COLOR}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
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
