import type { RiskLevel } from '@/lib/validations/onboarding';

export type RiskBadgeProps = {
  riskLevel: RiskLevel;
  className?: string;
};

const riskMap: Record<RiskLevel, { label: string; className: string }> = {
  LOW: {
    label: 'Risco Baixo',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  MEDIUM: {
    label: 'Risco Medio',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  HIGH: {
    label: 'Risco Alto',
    className: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
};

export function RiskBadge({ riskLevel, className = '' }: RiskBadgeProps) {
  const config = riskMap[riskLevel];

  return (
    <span
      aria-label={config.label}
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
