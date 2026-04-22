'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClockIcon,
  CheckCircleIcon,
  ThumbsUpIcon,
  XCircleIcon,
  UsersIcon,
  Users2Icon,
  WalletIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
  BookOpenIcon,
  ReceiptIcon,
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
import { useUserProfile } from '@/context/UserProfileContext';
import type { UserProfile } from '@/integrations/backend/users';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super Admin',
  aprobador: 'Aprobador',
  standard: 'Estándar',
  rendidor: 'Rendidor',
};

const invoiceItems = [
  { label: 'Pendientes', href: '/pending-invoices', icon: ClockIcon },
  { label: 'Aprobadas', href: '/approved-invoices', icon: ThumbsUpIcon },
  { label: 'Rechazadas', href: '/rejected-invoices', icon: XCircleIcon },
  { label: 'Ya pagado', href: '/paid-invoices', icon: CheckCircleIcon },
];

const providerItem = { label: 'Proveedores', href: '/providers', icon: UsersIcon };
const accountingItem = { label: 'Contabilidad', href: '/accounting', icon: BookOpenIcon };
const rendicionesItem = { label: 'Rendiciones', href: '/refunds', icon: ReceiptIcon };

const adminOnlyItems = [
  { label: 'Equipo', href: '/team', icon: Users2Icon },
  { label: 'Presupuesto', href: '/budget', icon: WalletIcon },
  { label: 'Estadísticas', href: '/statistics', icon: BarChart3Icon },
  { label: 'Configuración', href: '/settings', icon: SettingsIcon },
];

function getNavItems(role: string): Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> {
  if (role === 'admin' || role === 'super_admin') {
    return [...invoiceItems, providerItem, accountingItem, rendicionesItem, ...adminOnlyItems];
  }
  if (role === 'aprobador') {
    return [...invoiceItems, providerItem, rendicionesItem];
  }
  if (role === 'standard') {
    return [...invoiceItems, providerItem, accountingItem, rendicionesItem];
  }
  if (role === 'rendidor') {
    return [rendicionesItem];
  }
  return [];
}

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
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  const role = profile?.role ?? '';
  const navItems = getNavItems(role);

  async function handleSignOut(): Promise<void> {
    await signOut();
    window.location.href = '/login';
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
                const isActive = (item.href === '/accounting' || item.href === '/refunds')
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;
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
            <span className="text-xs text-muted-foreground">
              {ROLE_LABELS[profile?.role ?? ''] ?? (profile?.role ?? '')}
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
