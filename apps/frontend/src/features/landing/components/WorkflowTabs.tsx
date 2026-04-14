'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  {
    id: 'sync',
    label: 'Sincronización SII',
    title: 'Facturas del SII directo a tu bandeja',
    description:
      'Conecta tu empresa al SII con un clic. suplAI obtiene automáticamente todas tus facturas de proveedores recibidas, registra los eventos ACD y RCD, y te alerta sobre facturas en mérito antes del vencimiento legal.',
    bullets: [
      'Sincronización automática de facturas recibidas',
      'Registro de eventos ACD/RCD desde la plataforma',
      'Alertas de mérito (plazo legal de 8 días)',
      'Sin digitación manual, sin errores',
    ],
    illustration: <SyncIllustration />,
  },
  {
    id: 'ai',
    label: 'Validación con IA',
    title: 'Agentes de IA revisa antes de que tú lo hagas',
    description:
      'Antes de que una factura llegue a la bandeja de aprobación, fue revisada automáticamente contra el precio pactado en el contrato del proveedor, considerando el tipo de servicio y la tolerancia configurada.',
    bullets: [
      'Comparación automática monto factura vs. contrato',
      'Conversión en tiempo real CLP / USD / UF',
      'Tolerancia configurable por proveedor o global',
      'Auto-aprobación si la validación es satisfactoria',
    ],
    illustration: <AIIllustration />,
  },
  {
    id: 'approve',
    label: 'Aprobación y Control',
    title: 'Flujo de aprobación con trazabilidad total',
    description:
      'Cada factura pasa por un flujo claro: revisión, aprobación o rechazo, con registro de quién decidió, cuándo y por qué. Los roles garantizan que solo las personas correctas actúan sobre cada etapa.',
    bullets: [
      'Roles: Admin, Aprobador, Estándar, Rendidor',
      'Historial completo de eventos por factura',
      'Comentarios y justificaciones de rechazo',
      'Listo para auditoría interna y externa',
    ],
    illustration: <ApproveIllustration />,
  },
  {
    id: 'nomina',
    label: 'Pago por Nóminas',
    title: 'Cierra el ciclo con nóminas de pago',
    description:
      'Agrupa facturas aprobadas en nóminas de pago, genera el detalle del lote y adjunta el voucher de pago cuando se ejecuta la transferencia. El ciclo queda cerrado sin herramientas externas.',
    bullets: [
      'Agrupación de facturas aprobadas en lotes',
      'Adjunto de voucher de pago para trazabilidad',
      'Bloqueo de facturas ya incluidas en nóminas',
      'Historial completo de nóminas pagadas',
    ],
    illustration: <NominaIllustration />,
  },
];

export function WorkflowTabs(): React.JSX.Element {
  return (
    <Tabs defaultValue="sync" className="w-full">
      <TabsList
        className="flex h-auto gap-1 p-1 rounded-xl w-full overflow-x-auto scrollbar-none md:flex-wrap"
        style={{ backgroundColor: 'var(--lp-bg-raised)' }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-shrink-0 md:flex-1 text-sm py-2 px-3 rounded-lg whitespace-nowrap
              data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f]
              text-white/60 data-[state=active]:shadow-none
              focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl md:text-3xl font-bold text-white">{tab.title}</h3>
              <p className="leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
                {tab.description}
              </p>
              <ul className="flex flex-col gap-3">
                {tab.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span
                      className="mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      ✓
                    </span>
                    <span className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl flex items-center justify-center p-8 min-h-[240px]"
              style={{ backgroundColor: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)' }}
            >
              {tab.illustration}
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* ── Inline SVG Illustrations ── */

function SyncIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" fill="none">
      {/* SII box */}
      <rect x="10" y="60" width="90" height="60" rx="12" fill="#1f1f1f" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="55" y="88" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600" opacity="0.85">SII</text>
      <text x="55" y="105" textAnchor="middle" fill="#ffffff" fontSize="9" opacity="0.45">Chile</text>
      {/* Arrow */}
      <path d="M105 90 L155 90" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 3" />
      <polygon points="155,86 163,90 155,94" fill="rgba(255,255,255,0.3)" />
      {/* Invoice cards */}
      <rect x="168" y="50" width="100" height="35" rx="8" fill="#1f1f1f" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <rect x="176" y="60" width="50" height="4" rx="2" fill="#ffffff" opacity="0.45" />
      <rect x="176" y="68" width="35" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="235" y="60" width="24" height="16" rx="4" fill="#16a34a" opacity="0.85" />
      <text x="247" y="72" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">✓</text>

      <rect x="168" y="92" width="100" height="35" rx="8" fill="#1f1f1f" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="176" y="102" width="50" height="4" rx="2" fill="#ffffff" opacity="0.35" />
      <rect x="176" y="110" width="35" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="235" y="102" width="24" height="16" rx="4" fill="#f59e0b" opacity="0.8" />
      <text x="247" y="114" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">!</text>

      <rect x="168" y="134" width="100" height="35" rx="8" fill="#1f1f1f" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="176" y="144" width="50" height="4" rx="2" fill="#ffffff" opacity="0.25" />
      <rect x="176" y="152" width="35" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />
      <rect x="235" y="144" width="24" height="16" rx="4" fill="#2a2a2a" />
      <text x="247" y="156" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">pendiente</text>
    </svg>
  );
}

function AIIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" fill="none">
      {/* PDF document */}
      <rect x="20" y="40" width="80" height="100" rx="10" fill="#1f1f1f" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <rect x="30" y="58" width="60" height="4" rx="2" fill="#ffffff" opacity="0.45" />
      <rect x="30" y="68" width="45" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="30" y="76" width="55" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="30" y="84" width="40" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="30" y="100" width="60" height="20" rx="4" fill="#2a2a2a" />
      <text x="60" y="115" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontWeight="600">$2.890.000</text>
      <text x="60" y="48" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">Contrato.pdf</text>

      {/* Connection trail */}
      <path d="M105 90 L160 90" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="120" cy="90" r="3" fill="rgba(255,255,255,0.3)" />
      <circle cx="135" cy="90" r="3" fill="rgba(255,255,255,0.2)" />
      <circle cx="150" cy="90" r="3" fill="rgba(255,255,255,0.1)" />

      {/* AI badge */}
      <rect x="162" y="55" width="95" height="70" rx="12" fill="#1f1f1f" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="209" y="78" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="700">✦ Agentes de IA</text>
      <rect x="172" y="84" width="75" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="172" y="91" width="60" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="172" y="98" width="70" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />

      {/* Green check badge */}
      <circle cx="250" cy="55" r="16" fill="#16a34a" />
      <text x="250" y="60" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">✓</text>
      <text x="209" y="148" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="600">Validado — dentro del contrato</text>
    </svg>
  );
}

function ApproveIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" fill="none">
      {/* Invoice card */}
      <rect x="15" y="30" width="110" height="120" rx="12" fill="#1f1f1f" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <rect x="25" y="45" width="90" height="5" rx="2.5" fill="#ffffff" opacity="0.5" />
      <rect x="25" y="56" width="65" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="25" y="64" width="80" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />
      <rect x="25" y="80" width="90" height="1" rx="0.5" fill="#ffffff" opacity="0.08" />
      <rect x="25" y="90" width="50" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="25" y="100" width="90" height="4" rx="2" fill="#2a2a2a" />
      <text x="70" y="104" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="8">$1.450.000</text>
      <rect x="25" y="120" width="90" height="22" rx="6" fill="#16a34a" />
      <text x="70" y="135" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">Aprobar</text>

      {/* Flow arrow */}
      <path d="M130 90 L155 90" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <polygon points="155,86 163,90 155,94" fill="rgba(255,255,255,0.3)" />

      {/* Timeline */}
      <rect x="165" y="30" width="100" height="120" rx="12" fill="#161616" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="178" cy="56" r="5" fill="#16a34a" />
      <rect x="188" y="53" width="65" height="3" rx="1.5" fill="#ffffff" opacity="0.45" />
      <rect x="188" y="59" width="45" height="2.5" rx="1.25" fill="#ffffff" opacity="0.18" />
      <line x1="178" y1="62" x2="178" y2="78" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="178" cy="85" r="5" fill="rgba(255,255,255,0.5)" />
      <rect x="188" y="82" width="65" height="3" rx="1.5" fill="#ffffff" opacity="0.45" />
      <rect x="188" y="88" width="50" height="2.5" rx="1.25" fill="#ffffff" opacity="0.18" />
      <line x1="178" y1="91" x2="178" y2="107" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="178" cy="114" r="5" fill="rgba(255,255,255,0.15)" />
      <rect x="188" y="111" width="55" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <text x="215" y="155" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Historial de eventos</text>
    </svg>
  );
}

function NominaIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" fill="none">
      {/* Stacked cards */}
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#161616" stroke="rgba(255,255,255,0.08)" strokeWidth="1" opacity="0.6" transform="rotate(-4 75 77)" />
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#1a1a1a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" opacity="0.8" transform="rotate(-2 75 77)" />
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#1f1f1f" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <rect x="40" y="62" width="70" height="4" rx="2" fill="#ffffff" opacity="0.45" />
      <rect x="40" y="72" width="50" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="40" y="80" width="60" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />
      <text x="75" y="100" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="600">3 facturas</text>

      {/* Arrow */}
      <path d="M126 77 L156 77" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <polygon points="156,73 164,77 156,81" fill="rgba(255,255,255,0.3)" />

      {/* Nomina summary card */}
      <rect x="168" y="35" width="96" height="110" rx="12" fill="#161616" stroke="#16a34a" strokeWidth="1.5" />
      <text x="216" y="57" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="700">Nómina #012</text>
      <line x1="178" y1="63" x2="254" y2="63" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="178" y="70" width="78" height="3" rx="1.5" fill="#ffffff" opacity="0.2" />
      <rect x="178" y="78" width="60" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />
      <rect x="178" y="86" width="70" height="3" rx="1.5" fill="#ffffff" opacity="0.15" />
      <rect x="178" y="100" width="78" height="2" rx="1" fill="rgba(255,255,255,0.08)" />
      <text x="216" y="116" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="600">$4.340.000</text>
      <rect x="178" y="122" width="78" height="16" rx="5" fill="#16a34a" />
      <text x="217" y="134" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">Marcar como pagada</text>
    </svg>
  );
}
