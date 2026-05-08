import React from 'react';

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={['flex items-center gap-2 overflow-x-auto', className]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={[
            'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === tab
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
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
