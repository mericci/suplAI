const STEPS = [
  {
    number: '01',
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
    flip: false,
  },
  {
    number: '02',
    label: 'Validación con IA',
    title: 'Agentes de IA revisan cada factura antes de que tú lo hagas',
    description:
      'Antes de que una factura llegue a la bandeja de aprobación, fue revisada automáticamente contra el precio pactado en el contrato del proveedor, considerando el tipo de servicio y la tolerancia configurada.',
    bullets: [
      'Comparación automática monto factura vs. contrato',
      'Conversión en tiempo real CLP / USD / UF',
      'Tolerancia configurable por proveedor o global',
      'Auto-aprobación si la validación es satisfactoria',
    ],
    illustration: <AIIllustration />,
    flip: true,
  },
  {
    number: '03',
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
    flip: false,
  },
];

import { FadeIn } from '../components/FadeIn';

export function WorkflowSection(): React.JSX.Element {
  return (
    <section id="flujo" className="w-full py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <FadeIn className="flex flex-col gap-3 max-w-2xl mb-8">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.40)' }}>
            Flujo de trabajo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f0f0f' }}>
            De la factura SII al pago — sin fricción
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
            Cada etapa del proceso — desde la recepción en el SII hasta el pago confirmado —
            está cubierta en una sola plataforma, con registro completo de cada acción.
          </p>
        </FadeIn>

        {/* Steps */}
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <FadeIn key={step.number}>
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 ${
                i < STEPS.length - 1 ? 'border-b' : ''
              }`}
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              {/* Text */}
              <div className={`flex flex-col gap-5 ${step.flip ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(0,0,0,0.20)' }}>
                    {step.number}
                  </span>
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.40)' }}>
                    {step.label}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold leading-snug" style={{ color: '#0f0f0f' }}>
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
                  {step.description}
                </p>
                <ul className="flex flex-col gap-3">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.55)' }}
                      >
                        ✓
                      </span>
                      <span className="text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Illustration */}
              <div
                className={`rounded-2xl flex items-center justify-center p-8 min-h-[240px] ${step.flip ? 'lg:order-1' : 'lg:order-2'}`}
                style={{ backgroundColor: '#e9e8e4', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                {step.illustration}
              </div>
            </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Inline SVG Illustrations ── */

function SyncIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[300px]" fill="none" aria-hidden="true">
      <rect x="10" y="60" width="90" height="60" rx="12" fill="#ffffff" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      <text x="55" y="88" textAnchor="middle" fill="#0f0f0f" fontSize="11" fontWeight="600" opacity="0.80">SII</text>
      <text x="55" y="105" textAnchor="middle" fill="#0f0f0f" fontSize="9" opacity="0.38">Chile</text>
      <path d="M105 90 L155 90" stroke="rgba(0,0,0,0.20)" strokeWidth="2" strokeDasharray="4 3" />
      <polygon points="155,86 163,90 155,94" fill="rgba(0,0,0,0.20)" />
      <rect x="168" y="50" width="100" height="35" rx="8" fill="#ffffff" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
      <rect x="176" y="60" width="50" height="4" rx="2" fill="#0f0f0f" opacity="0.35" />
      <rect x="176" y="68" width="35" height="3" rx="1.5" fill="#0f0f0f" opacity="0.15" />
      <rect x="235" y="60" width="24" height="16" rx="4" fill="#16a34a" opacity="0.85" />
      <text x="247" y="72" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">✓</text>
      <rect x="168" y="92" width="100" height="35" rx="8" fill="#ffffff" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      <rect x="176" y="102" width="50" height="4" rx="2" fill="#0f0f0f" opacity="0.25" />
      <rect x="176" y="110" width="35" height="3" rx="1.5" fill="#0f0f0f" opacity="0.12" />
      <rect x="235" y="102" width="24" height="16" rx="4" fill="#f59e0b" opacity="0.8" />
      <text x="247" y="114" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">!</text>
      <rect x="168" y="134" width="100" height="35" rx="8" fill="#ffffff" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      <rect x="176" y="144" width="50" height="4" rx="2" fill="#0f0f0f" opacity="0.18" />
      <rect x="176" y="152" width="35" height="3" rx="1.5" fill="#0f0f0f" opacity="0.10" />
      <rect x="235" y="144" width="24" height="16" rx="4" fill="#eeeeee" />
      <text x="247" y="156" textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="7">pendiente</text>
    </svg>
  );
}

function AIIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[300px]" fill="none" aria-hidden="true">
      <rect x="20" y="40" width="80" height="100" rx="10" fill="#ffffff" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
      <rect x="30" y="58" width="60" height="4" rx="2" fill="#0f0f0f" opacity="0.40" />
      <rect x="30" y="68" width="45" height="3" rx="1.5" fill="#0f0f0f" opacity="0.15" />
      <rect x="30" y="76" width="55" height="3" rx="1.5" fill="#0f0f0f" opacity="0.15" />
      <rect x="30" y="84" width="40" height="3" rx="1.5" fill="#0f0f0f" opacity="0.12" />
      <rect x="30" y="100" width="60" height="20" rx="4" fill="#f0f0f0" />
      <text x="60" y="115" textAnchor="middle" fill="#0f0f0f" fontSize="9" fontWeight="600" opacity="0.75">$2.890.000</text>
      <text x="60" y="48" textAnchor="middle" fill="#0f0f0f" fontSize="9" opacity="0.30">Contrato.pdf</text>
      <path d="M105 90 L160 90" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="120" cy="90" r="3" fill="rgba(0,0,0,0.18)" />
      <circle cx="135" cy="90" r="3" fill="rgba(0,0,0,0.12)" />
      <circle cx="150" cy="90" r="3" fill="rgba(0,0,0,0.07)" />
      <rect x="162" y="55" width="95" height="70" rx="12" fill="#ffffff" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      <text x="209" y="78" textAnchor="middle" fill="#0f0f0f" fontSize="10" fontWeight="700" opacity="0.70">✦ Agentes de IA</text>
      <rect x="172" y="84" width="75" height="3" rx="1.5" fill="#0f0f0f" opacity="0.12" />
      <rect x="172" y="91" width="60" height="3" rx="1.5" fill="#0f0f0f" opacity="0.12" />
      <rect x="172" y="98" width="70" height="3" rx="1.5" fill="#0f0f0f" opacity="0.10" />
      <circle cx="250" cy="55" r="16" fill="#16a34a" />
      <text x="250" y="60" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">✓</text>
      <text x="209" y="148" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600">Validado — dentro del contrato</text>
    </svg>
  );
}

function NominaIllustration(): React.JSX.Element {
  return (
    <svg viewBox="0 0 280 180" className="w-full max-w-[300px]" fill="none" aria-hidden="true">
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#ebebeb" stroke="rgba(0,0,0,0.06)" strokeWidth="1" opacity="0.7" transform="rotate(-4 75 77)" />
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#f0f0f0" stroke="rgba(0,0,0,0.08)" strokeWidth="1" opacity="0.85" transform="rotate(-2 75 77)" />
      <rect x="30" y="50" width="90" height="55" rx="10" fill="#ffffff" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      <rect x="40" y="62" width="70" height="4" rx="2" fill="#0f0f0f" opacity="0.35" />
      <rect x="40" y="72" width="50" height="3" rx="1.5" fill="#0f0f0f" opacity="0.15" />
      <rect x="40" y="80" width="60" height="3" rx="1.5" fill="#0f0f0f" opacity="0.12" />
      <text x="75" y="100" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600">3 facturas</text>
      <path d="M126 77 L156 77" stroke="rgba(0,0,0,0.20)" strokeWidth="2" />
      <polygon points="156,73 164,77 156,81" fill="rgba(0,0,0,0.20)" />
      <rect x="168" y="35" width="96" height="110" rx="12" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
      <text x="216" y="57" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="700">Nómina #012</text>
      <line x1="178" y1="63" x2="254" y2="63" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      <rect x="178" y="70" width="78" height="3" rx="1.5" fill="#0f0f0f" opacity="0.15" />
      <rect x="178" y="78" width="60" height="3" rx="1.5" fill="#0f0f0f" opacity="0.10" />
      <rect x="178" y="86" width="70" height="3" rx="1.5" fill="#0f0f0f" opacity="0.10" />
      <rect x="178" y="100" width="78" height="2" rx="1" fill="rgba(0,0,0,0.07)" />
      <text x="216" y="116" textAnchor="middle" fill="#0f0f0f" fontSize="9" fontWeight="600" opacity="0.65">$4.340.000</text>
      <rect x="178" y="122" width="78" height="16" rx="5" fill="#16a34a" />
      <text x="217" y="134" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">Marcar como pagada</text>
    </svg>
  );
}
