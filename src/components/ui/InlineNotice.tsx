import React from 'react';
import { Loader2 } from 'lucide-react';

type InlineNoticeVariant = 'info' | 'loading' | 'warning' | 'error';

interface InlineNoticeProps {
  variant?: InlineNoticeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<InlineNoticeVariant, string> = {
  info: 'border-app-border-muted bg-app-surface text-app-text-muted',
  loading: 'border-app-border-muted bg-app-surface text-app-text-muted',
  warning: 'border-warning-100 bg-warning-50 text-warning-700',
  error: 'border-error-100 bg-error-50 text-error-600',
};

const InlineNotice: React.FC<InlineNoticeProps> = ({ variant = 'info', className = '', children }) => {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={['rounded-xl border px-4 py-3 text-sm', variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      {variant === 'loading' && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
      {children}
    </div>
  );
};

export default InlineNotice;
