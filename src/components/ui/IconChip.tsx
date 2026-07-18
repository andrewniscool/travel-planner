import React from 'react';

type IconChipSize = 'sm' | 'md' | 'lg';
type IconChipTone = 'primary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error';

export interface IconChipProps {
  icon: React.ReactNode;
  size?: IconChipSize;
  tone?: IconChipTone;
  className?: string;
}

const sizeClasses: Record<IconChipSize, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-lg',
  lg: 'h-12 w-12 rounded-xl',
};

const toneClasses: Record<IconChipTone, string> = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-600',
  neutral: 'bg-app-surface-muted text-app-text-subtle',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-500',
};

const IconChip: React.FC<IconChipProps> = ({ icon, size = 'md', tone = 'primary', className = '' }) => {
  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center',
        sizeClasses[size],
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
    </span>
  );
};

export default IconChip;
