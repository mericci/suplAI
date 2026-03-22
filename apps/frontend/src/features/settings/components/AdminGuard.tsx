'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/integrations/backend/users';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps): React.JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    getMe().then((res) => {
      const role = res.data?.role;
      if (role === 'admin' || role === 'super_admin') {
        setStatus('allowed');
      } else {
        setStatus('denied');
        router.replace('/pending-invoices');
      }
    }).catch(() => {
      setStatus('denied');
      router.replace('/pending-invoices');
    });
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Verificando permisos...</div>
      </div>
    );
  }

  if (status === 'denied') {
    return <></>;
  }

  return <>{children}</>;
}
