import { Button } from '@/components/ui/button';
import { FadeIn } from '../components/FadeIn';

interface CTASectionProps {
  onDemoOpen: () => void;
}

export function CTASection({ onDemoOpen }: CTASectionProps): React.JSX.Element {
  return (
    <section className="w-full py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
        <div
          className="rounded-3xl p-12 md:p-16 flex flex-col items-center text-center gap-6 relative overflow-hidden"
          style={{
            backgroundColor: '#0f0f0f',
          }}
        >
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">
              ¿Listo para automatizar tu gestión de facturas?
            </h2>
            <p className="text-base md:text-lg max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Solicita una demo gratuita y te mostramos cómo suplAI se adapta a tu empresa en menos de una semana.
            </p>
            <Button
              onClick={onDemoOpen}
              size="lg"
              className="rounded-xl px-10 py-3 text-sm font-semibold mt-2 cursor-pointer"
              style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}
            >
              Solicitar Demo gratuita →
            </Button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Sin tarjeta de crédito · Configuración asistida · Soporte en español
            </p>
          </div>
        </div>
        </FadeIn>
      </div>
    </section>
  );
}
