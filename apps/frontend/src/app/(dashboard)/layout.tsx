import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { DashboardContent } from '@/components/DashboardContent';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <UserProfileProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardContent>{children}</DashboardContent>
        </SidebarInset>
      </SidebarProvider>
    </UserProfileProvider>
  );
}
