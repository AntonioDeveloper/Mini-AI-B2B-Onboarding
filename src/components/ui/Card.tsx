import type { ReactNode } from 'react';

export type CardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({
  title,
  description,
  action,
  footer,
  children,
  className = '',
}: CardProps) {
  return (
    <section
      className={[
        'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title || description || action ? (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      <div>{children}</div>

      {footer ? <footer className="mt-4 border-t border-slate-200 pt-4">{footer}</footer> : null}
    </section>
  );
}
