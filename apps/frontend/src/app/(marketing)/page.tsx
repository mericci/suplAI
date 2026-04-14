import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/LandingPage';

export const metadata: Metadata = {
  title: 'suplAI — Gestión inteligente de facturas de proveedores',
  description:
    'Sincroniza facturas del SII, valídalas con IA y apruébalas con control total. La plataforma de cuentas por pagar para empresas chilenas.',
  openGraph: {
    title: 'suplAI — Gestión inteligente de facturas de proveedores',
    description:
      'Automatiza tu flujo de facturas con integración SII y validación por Claude AI.',
  },
};

export default function MarketingPage(): React.JSX.Element {
  return <LandingPage />;
}
