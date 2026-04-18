import type { RendicionStatus } from '@supl/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RENDICION_STATUS_LABELS } from './constants';

interface RendicionStatusBadgeProps {
  status: RendicionStatus;
  className?: string;
}

const STATUS_STYLES: Record<RendicionStatus, string> = {
  pending: [
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'dark:bg-yellow-900/30 dark:text-yellow-400',
  ].join(' '),
  approved: [
    'bg-green-100 text-green-800 border-green-200',
    'dark:bg-green-900/30 dark:text-green-400',
  ].join(' '),
  rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
};

export function RendicionStatusBadge(
  { status, className }: RendicionStatusBadgeProps,
): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status], className)}
    >
      {RENDICION_STATUS_LABELS[status]}
    </Badge>
  );
}
