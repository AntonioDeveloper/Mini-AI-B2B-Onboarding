import type { CompanyStatus } from '@/lib/validations/onboarding';

export type StatusBadgeProps = {
  status: CompanyStatus;
  className?: string;
};

const statusMap: Record<CompanyStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  APPROVED: {
    label: 'Aprovada',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  REJECTED: {
    label: 'Recusada',
    className: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span
      aria-label={`Status: ${config.label}`}
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {config.label}
    </span>
  );
}
