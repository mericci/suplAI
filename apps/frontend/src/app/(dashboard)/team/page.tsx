'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { CreateUserForm } from '@/features/users/CreateUserForm';

export default function TeamPage(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-lg font-semibold">Equipo</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-xl">
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
