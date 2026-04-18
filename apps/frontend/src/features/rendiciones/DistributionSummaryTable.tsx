import type { RendicionDocument } from '@supl/shared';

interface DistributionSummaryTableProps {
  documents: RendicionDocument[];
}

export function DistributionSummaryTable(
  { documents }: DistributionSummaryTableProps,
): React.JSX.Element {
  const validDocs = documents.filter(
    (d) => d.ai_validation_status === 'valid' && !d.is_duplicate,
  );

  const byCostCenter = validDocs.reduce<Record<string, number>>((acc, doc) => {
    const amount = doc.corrected_amount ?? doc.amount ?? 0;
    if (!doc.cost_center_id) return acc;
    return { ...acc, [doc.cost_center_id]: (acc[doc.cost_center_id] ?? 0) + amount };
  }, {});

  const byAccountingId = validDocs.reduce<Record<string, number>>((acc, doc) => {
    const amount = doc.corrected_amount ?? doc.amount ?? 0;
    if (!doc.accounting_id) return acc;
    return { ...acc, [doc.accounting_id]: (acc[doc.accounting_id] ?? 0) + amount };
  }, {});

  const undistributed = validDocs
    .filter((d) => !d.cost_center_id)
    .reduce((sum, d) => sum + (d.corrected_amount ?? d.amount ?? 0), 0);

  const hasCostCenters = Object.keys(byCostCenter).length > 0;
  const hasAccountingIds = Object.keys(byAccountingId).length > 0;

  if (!hasCostCenters && !hasAccountingIds && undistributed === 0) return <></>;

  return (
    <div className="space-y-4">
      {undistributed > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-yellow-400">
          ${undistributed.toLocaleString('es-CL')} sin centro de costos asignado
        </div>
      )}

      {hasCostCenters && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Por centro de costos
          </p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(byCostCenter).map(([id, amount]) => (
                  <tr key={id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-muted-foreground">{id}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${amount.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasAccountingIds && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Por ID contable
          </p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(byAccountingId).map(([id, amount]) => (
                  <tr key={id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-muted-foreground">{id}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${amount.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
