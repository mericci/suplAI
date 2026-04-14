'use client';

import { useEffect, useRef } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'left' | 'right';
}

export function FadeIn({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: FadeInProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) el.style.transitionDelay = `${delay}ms`;
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const dirClass =
    direction === 'left' ? ' from-left' : direction === 'right' ? ' from-right' : '';

  return (
    <div ref={ref} className={`animate-on-scroll${dirClass}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
