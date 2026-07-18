import React from 'react';

type BadgeVariant =
  'upcoming' | 'planning' | 'booked' | 'past' | 'default' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  upcoming: 'bg-primary-100 text-primary-700',
  planning: 'bg-accent-100 text-accent-700',
  booked: 'bg-success-100 text-success-600',
  past: 'bg-neutral-100 text-neutral-600',
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-500',
  error: 'bg-error-50 text-error-500',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
};

export default Badge;
