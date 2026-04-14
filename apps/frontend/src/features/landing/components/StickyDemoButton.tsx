'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';

interface StickyDemoButtonProps {
  onOpen: () => void;
}

export function StickyDemoButton({ onOpen }: StickyDemoButtonProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-4"
      style={{
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      <CalendarIcon className="w-4 h-4" aria-hidden="true" />
      Solicitar Demo
    </button>
  );
}
