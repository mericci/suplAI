'use client';

import { FadeIn } from '../components/FadeIn';

function AIIllustration({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 320 220" className={className ?? 'w-full max-w-sm'} fill="none" aria-hidden="true">
      {/* PDF card */}
      <rect x="20" y="40" width="100" height="140" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" />
      <rect x="32" y="62" width="76" height="6" rx="3" fill="#0f0f0f" opacity="0.5" />
      <rect x="32" y="74" width="55" height="4" rx="2" fill="#0f0f0f" opacity="0.15" />
      <rect x="32" y="83" width="68" height="4" rx="2" fill="#0f0f0f" opacity="0.12" />
      <rect x="32" y="92" width="50" height="4" rx="2" fill="#0f0f0f" opacity="0.12" />
      <rect x="32" y="101" width="62" height="4" rx="2" fill="#0f0f0f" opacity="0.08" />
      <rect x="32" y="118" width="76" height="28" rx="6" fill="#f0f0f0" />
      <text x="70" y="132" textAnchor="middle" fill="#0f0f0f" fontSize="11" fontWeight="600" opacity="0.80">$2.890.000</text>
      <text x="70" y="145" textAnchor="middle" fill="#0f0f0f" fontSize="8" opacity="0.35">Monto contrato</text>
      <text x="70" y="52" textAnchor="middle" fill="#0f0f0f" fontSize="9" opacity="0.30">Contrato.pdf</text>

      {/* Connection trail */}
      <path d="M125 110 L175 110" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="140" cy="110" r="3.5" fill="rgba(0,0,0,0.20)" />
      <circle cx="157" cy="110" r="3.5" fill="rgba(0,0,0,0.13)" />
      <circle cx="174" cy="110" r="3.5" fill="rgba(0,0,0,0.07)" />

      {/* AI card */}
      <rect x="180" y="60" width="120" height="100" rx="14" fill="#ffffff" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      <text x="240" y="86" textAnchor="middle" fill="#0f0f0f" fontSize="11" fontWeight="700" opacity="0.75">✦ Agentes de IA</text>
      <rect x="192" y="94" width="96" height="4" rx="2" fill="#0f0f0f" opacity="0.10" />
      <rect x="192" y="103" width="75" height="4" rx="2" fill="#0f0f0f" opacity="0.10" />
      <rect x="192" y="112" width="88" height="4" rx="2" fill="#0f0f0f" opacity="0.08" />
      <rect x="192" y="126" width="96" height="26" rx="6" fill="rgba(22,163,74,0.08)" stroke="rgba(22,163,74,0.25)" strokeWidth="1" />
      <text x="240" y="143" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600">✓ Dentro del contrato</text>

      {/* Check badge */}
      <circle cx="295" cy="65" r="20" fill="#16a34a" />
      <text x="295" y="71" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">✓</text>

      {/* Caption */}
      <rect x="80" y="195" width="160" height="14" rx="4" fill="rgba(0,0,0,0.04)" />
      <text x="160" y="206" textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="9">Validado automáticamente</text>
    </svg>
  );
}

export function AISection(): React.JSX.Element {
  return (
    <section id="ia" className="w-full py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Illustration — left on desktop */}
          <FadeIn direction="left" className="order-2 lg:order-1">
            <div
              className="rounded-2xl flex items-center justify-center p-10 min-h-[280px]"
              style={{ backgroundColor: '#e9e8e4', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <AIIllustration />
            </div>
          </FadeIn>

          {/* Text — right on desktop */}
          <FadeIn direction="right" delay={100} className="order-1 lg:order-2">
            <div className="flex flex-col gap-6">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.40)' }}>
                Validación con IA
              </span>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f0f0f' }}>
                Agentes de IA revisan cada factura antes de que tú lo hagas
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
                Conectamos agentes de IA con los contratos de costo de tus proveedores. Antes de
                que una factura llegue a la bandeja de aprobación, fue revisada automáticamente
                contra el precio pactado, el tipo de servicio y las condiciones del contrato —
                con tolerancia configurable.
              </p>
              <ul className="flex flex-col gap-3 mt-2">
                {[
                  'Detecta montos fuera de contrato',
                  'Alerta sobre servicios no pactados',
                  'Escala solo las facturas que requieren revisión humana',
                  'Genera un resumen de validación por factura',
                  'Auto-aprobación configurable si la validación es satisfactoria',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.55)' }}
                    >
                      ✓
                    </span>
                    <span className="text-sm" style={{ color: 'rgba(0,0,0,0.58)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
