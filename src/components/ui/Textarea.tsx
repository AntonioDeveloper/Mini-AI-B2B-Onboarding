'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { id, label, hint, error, className = '', containerClassName = '', rows = 4, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const describedBy = [hint ? `${textareaId}-hint` : '', error ? `${textareaId}-error` : '']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={['space-y-1.5', containerClassName].filter(Boolean).join(' ')}>
        {label ? (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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
          <p id={`${textareaId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={`${textareaId}-error`} className="text-xs text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
