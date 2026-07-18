import React from 'react';

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  return (
    <div
      className={['flex items-center gap-2 overflow-x-auto', className].filter(Boolean).join(' ')}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={[
            'inline-flex items-center font-medium transition-colors whitespace-nowrap',
            size === 'sm' ? 'rounded-full px-3 py-1.5 text-xs' : 'rounded-lg px-4 py-2 text-sm',
            activeTab === tab
              ? 'bg-primary-600 text-white'
              : 'bg-app-surface-muted text-app-text-muted hover:bg-neutral-200 hover:text-app-text',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
