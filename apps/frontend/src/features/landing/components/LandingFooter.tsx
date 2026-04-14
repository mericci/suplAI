import Link from 'next/link';

export function LandingFooter(): React.JSX.Element {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: '#e9e8e4',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
              >
                S
              </div>
              <span className="font-bold text-lg" style={{ color: '#0f0f0f' }}>suplAI</span>
            </div>
            <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: 'rgba(0,0,0,0.45)' }}>
              Gestión inteligente de facturas de proveedores para empresas chilenas.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>Plataforma</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Integración SII', href: '#flujo' },
                { label: 'Seguridad', href: '#seguridad' },
                { label: 'Iniciar sesión', href: '/login' },
                { label: 'Registrar empresa', href: '/organizations/register' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm transition-colors hover:text-black"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>Contacto</h4>
            <a
              href="mailto:hola@supl.ai"
              className="text-sm transition-colors hover:text-black"
              style={{ color: 'rgba(0,0,0,0.45)' }}
            >
              hola@supl.ai
            </a>
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.45)' }}>
              Soporte en español · Lunes a Viernes
            </p>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.30)' }}>
            © {new Date().getFullYear()} suplAI. Todos los derechos reservados.
          </p>
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.25)' }}>
            Construido para empresas chilenas 🇨🇱
          </p>
        </div>
      </div>
    </footer>
  );
}
