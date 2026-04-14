'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LandingNavProps {
  onDemoOpen: () => void;
}

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Flujo de trabajo', href: '#flujo' },
  { label: 'Validación IA', href: '#ia' },
  { label: 'Seguridad', href: '#seguridad' },
];

export function LandingNav({ onDemoOpen }: LandingNavProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: 'rgba(242,241,238,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo — dark badge matching app sidebar */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
          >
            S
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#0f0f0f' }}>suplAI</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm transition-colors hover:text-black"
              style={{ color: 'rgba(0,0,0,0.50)' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm transition-colors hover:text-black"
            style={{ color: 'rgba(0,0,0,0.55)' }}
          >
            Iniciar sesión
          </Link>
          <Button
            onClick={onDemoOpen}
            size="sm"
            className="rounded-lg text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
          >
            Solicitar Demo
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button
              className="p-1 transition-colors"
              style={{ color: 'rgba(0,0,0,0.55)' }}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
            >
              {open ? <XIcon className="w-5 h-5" aria-hidden="true" /> : <MenuIcon className="w-5 h-5" aria-hidden="true" />}
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72"
            style={{ backgroundColor: '#f2f1ee', borderColor: 'rgba(0,0,0,0.08)' }}
          >
            <div className="flex flex-col gap-6 mt-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium transition-colors hover:text-black"
                  style={{ color: 'rgba(0,0,0,0.60)' }}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 mt-4 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm text-center py-2 rounded-lg border font-medium"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.65)' }}
                >
                  Iniciar sesión
                </Link>
                <button
                  onClick={() => { setOpen(false); onDemoOpen(); }}
                  className="text-sm text-center py-2.5 rounded-lg font-semibold"
                  style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
                >
                  Solicitar Demo
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
