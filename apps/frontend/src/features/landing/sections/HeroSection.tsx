import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HeroSectionProps {
  onDemoOpen: () => void;
}

export function HeroSection({ onDemoOpen }: HeroSectionProps): React.JSX.Element {
  return (
    <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-16 pb-0 overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
        {/* Badge */}
        <Badge
          className="hero-fade rounded-full px-4 py-1.5 text-xs font-medium border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderColor: 'rgba(0,0,0,0.12)',
            color: 'rgba(0,0,0,0.65)',
            animationDelay: '0ms',
          }}
        >
          ✦ Integración nativa con el SII
        </Badge>

        {/* Headline */}
        <h1
          className="hero-fade text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
          style={{ color: '#0f0f0f', animationDelay: '100ms' }}
        >
          Gestiona facturas de{' '}
          <br className="hidden sm:block" />
          proveedores con{' '}
          <span style={{ color: 'rgba(0,0,0,0.40)' }}>inteligencia artificial</span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-fade text-base md:text-lg leading-relaxed max-w-2xl"
          style={{ color: 'rgba(0,0,0,0.52)', animationDelay: '200ms' }}
        >
          Deja atrás las planillas Excel y el correo electrónico. suplAI sincroniza
          automáticamente tus facturas del SII, las valida con IA y las lleva desde la
          aprobación hasta el pago — con trazabilidad completa y control de presupuesto.
        </p>

        {/* CTAs */}
        <div
          className="hero-fade flex flex-col sm:flex-row items-center gap-4 mt-2"
          style={{ animationDelay: '300ms' }}
        >
          <Button
            onClick={onDemoOpen}
            size="lg"
            className="rounded-xl px-8 py-3 text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
          >
            Solicitar Demo →
          </Button>
          <Link
            href="#flujo"
            className="text-sm font-medium transition-colors hover:text-black flex items-center gap-1"
            style={{ color: 'rgba(0,0,0,0.45)' }}
          >
            Ver cómo funciona ↓
          </Link>
        </div>

        {/* Trust note */}
        <p
          className="hero-fade text-xs mt-2"
          style={{ color: 'rgba(0,0,0,0.30)', animationDelay: '400ms' }}
        >
          Sin tarjeta de crédito · Configuración asistida · Soporte en español
        </p>
      </div>
    </section>
  );
}
