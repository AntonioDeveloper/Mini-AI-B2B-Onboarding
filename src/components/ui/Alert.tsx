import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
}: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'rounded-lg border px-4 py-3 text-sm',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}
