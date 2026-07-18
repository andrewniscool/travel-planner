import React from 'react';

type PillTone = 'primary' | 'accent' | 'neutral' | 'success' | 'warning';

interface PillProps {
  tone?: PillTone;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const toneClasses: Record<PillTone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-50 text-accent-700',
  neutral: 'bg-app-surface-muted text-app-text-muted',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-700',
};

const Pill: React.FC<PillProps> = ({ tone = 'primary', icon, className = '', children }) => {
  return (
    <span
      className={[
        'inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
      {children}
    </span>
  );
};

export default Pill;
