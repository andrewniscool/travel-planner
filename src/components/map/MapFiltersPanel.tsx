import React from 'react';
import { Filter } from 'lucide-react';
import SearchBar from '../ui/SearchBar';
import { categoryIcons, type CategoryFilter } from './mapPageDisplay';

interface MapFiltersPanelProps {
  activeFilters: Set<CategoryFilter>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleFilter: (category: CategoryFilter) => void;
}

const MapFiltersPanel: React.FC<MapFiltersPanelProps> = ({
  activeFilters,
  searchQuery,
  onSearchChange,
  onToggleFilter,
}) => (
  <div className="shrink-0 bg-white rounded-2xl shadow-card border border-neutral-100 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Filter className="w-4 h-4 text-neutral-500" />
      <h3 className="text-sm font-semibold text-neutral-700">Filter Pins</h3>
    </div>
    <SearchBar
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Search mapped places..."
      className="mb-3"
    />
    <div className="flex flex-wrap gap-2">
      {(Object.keys(categoryIcons) as CategoryFilter[]).map((category) => (
        <button
          key={category}
          onClick={() => onToggleFilter(category)}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            activeFilters.has(category)
              ? 'bg-primary-50 text-primary-600 border border-primary-200'
              : 'bg-neutral-50 text-neutral-400 border border-neutral-200',
          ].join(' ')}
        >
          {categoryIcons[category]}
          {category}
        </button>
      ))}
    </div>
  </div>
);

export default MapFiltersPanel;
