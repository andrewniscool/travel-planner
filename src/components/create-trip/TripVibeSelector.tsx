import React from 'react';
import type { TripVibe } from '../../types';

interface TripVibeSelectorProps {
  options: TripVibe[];
  value: TripVibe | '';
  onChange: (value: TripVibe | '') => void;
}

const TripVibeSelector: React.FC<TripVibeSelectorProps> = ({
  options,
  value,
  onChange,
}) => (
  <div>
    <h3 className="mb-4 text-lg font-bold text-neutral-900">Trip Vibe</h3>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(value === option ? '' : option)}
          className={[
            'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
            value === option
              ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
              : 'border-neutral-200 text-neutral-700 hover:border-primary-600 hover:text-primary-700',
          ].join(' ')}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export default TripVibeSelector;
