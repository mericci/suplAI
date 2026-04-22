interface ValidateInvoicePromptParams {
  invoice: {
    document_type: string;
    document_number: string;
    issue_date: string;
    gross_amount: number | string;
  };
  contract: {
    service_description: string | null;
    tariff_type: string | null;
  };
  convertedAmounts: unknown;
  aiTolerancePct: number;
  ufRate: number | null;
}

export function buildValidateInvoicePrompt(params: ValidateInvoicePromptParams): string {
  const { invoice, contract, convertedAmounts, aiTolerancePct, ufRate } = params;
  return `You are an invoice validation assistant for a Chilean company.
Compare the following invoice against the supplier's cost contract.
All contract amounts have been converted to CLP for comparison.

INVOICE:
- Document type: ${invoice.document_type}
- Document number: ${invoice.document_number}
- Issue date: ${invoice.issue_date}
- Gross amount: ${invoice.gross_amount} CLP

SUPPLIER COST CONTRACT:
- Service description: ${contract.service_description ?? 'N/A'}
- Tariff type: ${contract.tariff_type ?? 'N/A'}
- Amounts (converted to CLP): ${JSON.stringify(convertedAmounts)}
${ufRate ? `- UF rate used: 1 UF = ${ufRate} CLP` : ''}

Allow ±${aiTolerancePct}% tolerance when comparing the invoice gross amount against the contract clp_equivalent amounts.
Respond ONLY with valid JSON (no markdown, no explanation):
{"status": "ok", "notes": "<one sentence in Spanish>"} or {"status": "error", "notes": "<one sentence in Spanish>"}`;
}
