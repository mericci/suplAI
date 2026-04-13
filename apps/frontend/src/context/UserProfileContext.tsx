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
  costCenterIds: string[];
  canApproveInvoice: (inv: { serviceId: string | null; serviceCostCenterId: string | null }) => boolean;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  loading: true,
  isAdmin: false,
  isAprobador: false,
  isStandard: false,
  isRendidor: false,
  canApprove: false,
  costCenterIds: [],
  canApproveInvoice: () => false,
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
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isAprobador = role === 'aprobador';
  const costCenterIds = profile?.cost_center_ids ?? [];

  const value: UserProfileContextValue = {
    profile,
    loading,
    isAdmin,
    isAprobador,
    isStandard: role === 'standard',
    isRendidor: role === 'rendidor',
    canApprove: isAdmin || isAprobador,
    costCenterIds,
    canApproveInvoice: (inv) => {
      if (isAdmin) return true;
      if (!isAprobador) return false;
      if (!inv.serviceId || !inv.serviceCostCenterId) return false;
      return costCenterIds.includes(inv.serviceCostCenterId);
    },
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
