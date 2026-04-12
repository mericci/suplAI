'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '@/integrations/backend/users';
import type { UserProfile } from '@/integrations/backend/users';

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAprobador: boolean;
  isStandard: boolean;
  isRendidor: boolean;
  canApprove: boolean;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  loading: true,
  isAdmin: false,
  isAprobador: false,
  isStandard: false,
  isRendidor: false,
  canApprove: false,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.success && res.data) setProfile(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const role = profile?.role ?? '';
  const value: UserProfileContextValue = {
    profile,
    loading,
    isAdmin: role === 'admin' || role === 'super_admin',
    isAprobador: role === 'aprobador',
    isStandard: role === 'standard',
    isRendidor: role === 'rendidor',
    canApprove: role === 'admin' || role === 'super_admin' || role === 'aprobador',
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextValue {
  return useContext(UserProfileContext);
}
