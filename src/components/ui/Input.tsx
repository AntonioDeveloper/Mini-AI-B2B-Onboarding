'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { id, label, hint, error, className = '', containerClassName = '', ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = [hint ? `${inputId}-hint` : '', error ? `${inputId}-error` : '']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={['space-y-1.5', containerClassName].filter(Boolean).join(' ')}>
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition',
            'placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
            error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
