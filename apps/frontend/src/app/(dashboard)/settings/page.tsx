import { AdminGuard } from '@/features/settings/components/AdminGuard';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function SettingsRoute(): React.JSX.Element {
  return (
    <AdminGuard>
      <SettingsPage />
    </AdminGuard>
  );
}
