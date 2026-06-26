'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      hint,
      error,
      placeholder,
      options,
      className = '',
      containerClassName = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedBy = [hint ? `${selectId}-hint` : '', error ? `${selectId}-error` : '']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={['space-y-1.5', containerClassName].filter(Boolean).join(' ')}>
        {label ? (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        ) : null}

        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition',
            'focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
            error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hint ? (
          <p id={`${selectId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={`${selectId}-error`} className="text-xs text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
