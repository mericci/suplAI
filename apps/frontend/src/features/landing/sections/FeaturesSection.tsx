'use client';

import { Users, Wallet, BookOpen, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { FadeIn } from '../components/FadeIn';

const FEATURES = [
  {
    icon: Users,
    title: 'Proveedores centralizados',
    description: 'Ficha global por proveedor con datos de pago, contratos de costo, documentos y centros de costo. Un solo lugar de referencia para todo tu equipo.',
  },
  {
    icon: Wallet,
    title: 'Presupuesto inteligente',
    description: 'Define límites mensuales, trimestrales o anuales por proveedor o de forma global. Monitorea el gasto real contra el presupuesto con métricas visuales.',
  },
  {
    icon: BookOpen,
    title: 'Contabilidad integrada',
    description: 'Centros de costo, IDs contables (plan de cuentas) y distribución de facturas. Organiza cada gasto listo para tu sistema ERP o informe de auditoría.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles y permisos (RBAC)',
    description: 'Admin, Aprobador, Estándar y Rendidor. Cada usuario ve y hace exactamente lo que le corresponde según su función en la empresa.',
  },
  {
    icon: FileText,
    title: 'Integración SII nativa',
    description: 'Sincroniza facturas recibidas directamente desde el SII. Registra eventos ACD/RCD, descarga XMLs y recibe alertas de mérito sin salir de la plataforma.',
  },
  {
    icon: Sparkles,
    title: 'Documentos con IA',
    description: 'Sube contratos PDF y extrae automáticamente montos, servicios y condiciones pactadas. Base para la validación inteligente de cada factura.',
  },
];

export function FeaturesSection(): React.JSX.Element {
  return (
    <section id="funcionalidades" className="w-full py-24 px-4" style={{ backgroundColor: '#e9e8e4' }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <FadeIn>
          <div className="flex flex-col gap-3 max-w-2xl mx-auto text-center items-center">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.40)' }}>
              Todo lo que necesitas
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f0f0f' }}>
              Una plataforma. Toda la operación.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
              Diseñado para la realidad de las empresas chilenas: SII integrado, roles claros y contabilidad lista para usar.
            </p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 70}>
              <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
