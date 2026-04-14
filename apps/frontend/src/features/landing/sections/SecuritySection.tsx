'use client';

import { Lock, MapPin, ClipboardList, Users } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';

const TRUST_CARDS = [
  {
    icon: Lock,
    title: 'Autenticación segura',
    description: 'Acceso con correo y contraseña, sesiones con expiración automática y cierre de sesión remoto. Basado en Supabase Auth con estándares de seguridad empresarial.',
  },
  {
    icon: MapPin,
    title: 'Infraestructura controlada',
    description: 'Tus datos financieros se alojan en infraestructura con altos estándares de seguridad. Credenciales del SII encriptadas con AES-256-GCM — nunca expuestas en texto plano.',
  },
  {
    icon: ClipboardList,
    title: 'Trazabilidad total',
    description: 'Cada acción sobre una factura queda registrada con usuario, timestamp y detalle. Historial inmutable listo para auditoría interna, externa o requerimientos legales.',
  },
  {
    icon: Users,
    title: 'Control de accesos (RBAC)',
    description: 'Roles granulares por función: Admin, Aprobador, Estándar y Rendidor. Ningún usuario accede a más de lo que necesita para su rol en el proceso.',
  },
];

export function SecuritySection(): React.JSX.Element {
  return (
    <section id="seguridad" className="w-full py-24 px-4" style={{ backgroundColor: '#e9e8e4' }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <FadeIn>
          <div className="flex flex-col gap-3 max-w-2xl mx-auto text-center items-center">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.40)' }}>
              Seguridad y cumplimiento
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f0f0f' }}>
              Construido para operar con confianza
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
              Los CFOs y gerentes financieros chilenos necesitan certeza sobre dónde están sus datos, quién los accede y qué pasó con cada factura.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto w-full">
          {TRUST_CARDS.map((card, i) => (
            <FadeIn key={card.title} delay={i * 80}>
              <div
                className="rounded-2xl p-6 flex gap-5 bg-white"
                style={{ border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                >
                  <card.icon className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.55)' }} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold" style={{ color: '#0f0f0f' }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.52)' }}>
                    {card.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
