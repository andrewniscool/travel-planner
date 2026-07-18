import React from 'react';

interface SectionHeaderProps {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, meta, action, className = '' }) => {
  return (
    <div
      className={['mb-3 flex items-center justify-between gap-2', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-app-text-strong">{title}</h2>
        {meta && <span className="text-xs text-app-text-muted">{meta}</span>}
      </div>
      {action}
    </div>
  );
};

export default SectionHeader;
