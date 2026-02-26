'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  Users2Icon,
  WalletIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/integrations/backend/users';
import type { UserProfile } from '@/integrations/backend/users';

const navItems = [
  { label: 'Pendientes', href: '/pending-invoices', icon: ClockIcon },
  { label: 'Ya pagado', href: '/paid-invoices', icon: CheckCircleIcon },
  { label: 'Proveedores', href: '/providers', icon: UsersIcon },
  { label: 'Equipo', href: '/team', icon: Users2Icon },
  { label: 'Presupuesto', href: '/budget', icon: WalletIcon },
  { label: 'Estadísticas', href: '/statistics', icon: BarChart3Icon },
  { label: 'Configuración', href: '/settings', icon: SettingsIcon },
];

function getInitials(profile: UserProfile | null): string {
  if (!profile) return '?';
  const first = profile.first_name?.[0] ?? '';
  const last = profile.last_name?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return profile.email[0]?.toUpperCase() ?? '?';
}

function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return '...';
  return profile.name ?? (`${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email);
}

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getMe().then((res) => {
      if (res.success && res.data) {
        setProfile(res.data);
      }
    }).catch(() => {
      // silently ignore — sidebar still renders without profile
    });
  }, []);

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.push('/login');
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            S
          </span>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            SuplAI
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        className={cn(isActive && 'font-medium')}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(profile)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-sm font-medium leading-none truncate">
              {getDisplayName(profile)}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {profile?.role ?? ''}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="group-data-[collapsible=icon]:hidden shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
