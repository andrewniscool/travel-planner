import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div
      className={['flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-app-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
