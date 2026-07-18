import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  trend,
  trendValue,
  className = '',
}) => {
  return (
    <div
      className={[
        'bg-app-surface rounded-2xl p-6 shadow-card border border-app-border-muted',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-app-text-strong">{value}</p>
          <p className="text-sm text-app-text-muted mt-0.5">{label}</p>
        </div>
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-3">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-success-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-error-500" />
          )}
          <span className={trend === 'up' ? 'text-sm text-success-500' : 'text-sm text-error-500'}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
