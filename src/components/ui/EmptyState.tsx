import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={['flex flex-col items-center justify-center py-12 px-6 text-center', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-surface-muted text-app-text-subtle mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-app-text-strong mb-1">{title}</h3>
      <p className="text-sm text-app-text-muted max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
