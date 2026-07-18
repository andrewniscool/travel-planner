import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder, icon, error, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-app-text-muted mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-app-text-subtle">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            placeholder={placeholder}
            className={[
              'w-full px-4 py-2.5 rounded-xl border bg-app-surface text-app-text placeholder:text-app-text-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
              icon ? 'pl-10' : '',
              error ? 'border-error-400 text-error-500' : 'border-app-border',
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
