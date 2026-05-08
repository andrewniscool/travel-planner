import React from 'react';

type ProgressBarColor = 'primary' | 'success' | 'warning' | 'error' | 'accent';
type ProgressBarSize = 'sm' | 'md';

interface ProgressBarProps {
  value: number;
  color?: ProgressBarColor;
  showLabel?: boolean;
  size?: ProgressBarSize;
  className?: string;
}

const colorClasses: Record<ProgressBarColor, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

const sizeClasses: Record<ProgressBarSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'primary',
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <div className="w-full bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={[
            'rounded-full transition-all duration-500 ease-out',
            colorClasses[color],
            sizeClasses[size],
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-neutral-600 whitespace-nowrap">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
