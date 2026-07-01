import React from 'react';
import type { TravelFilter } from '../../utils/transportSegments';

export interface TravelFilterOption {
  key: TravelFilter;
  label: string;
  count: number;
}

interface TravelFilterTabsProps {
  options: TravelFilterOption[];
  activeFilter: TravelFilter;
  onChange: (filter: TravelFilter) => void;
}

const TravelFilterTabs: React.FC<TravelFilterTabsProps> = ({
  options,
  activeFilter,
  onChange,
}) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {options.map((option) => {
      const isActive = activeFilter === option.key;
      return (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={[
            'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
            isActive
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          {option.label}
          <span
            className={[
              'rounded-full px-2 py-0.5 text-xs',
              isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500',
            ].join(' ')}
          >
            {option.count}
          </span>
        </button>
      );
    })}
  </div>
);

export default TravelFilterTabs;
