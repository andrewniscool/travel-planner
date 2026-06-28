import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Users } from 'lucide-react';

interface TravelerPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label?: string;
  className?: string;
}

const TravelerPicker: React.FC<TravelerPickerProps> = ({
  value,
  onChange,
  min = 1,
  label = 'Travelers',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adults, setAdults] = useState(() => Math.max(min, value || min));
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef(value);
  const normalizedValue = Math.max(min, value || min);

  useEffect(() => {
    if (value === previousValueRef.current) return;

    previousValueRef.current = value;
    const peopleCount = adults + children;
    if (peopleCount === normalizedValue) return;

    setAdults(Math.max(min, normalizedValue - children));
  }, [adults, children, min, normalizedValue, value]);

  useEffect(() => {
    onChange(Math.max(min, adults + children));
  }, [adults, children, min, onChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const guestRows = useMemo(
    () => [
      {
        key: 'adults',
        title: 'Adults',
        description: 'Ages 13 or above',
        value: adults,
        setValue: setAdults,
        min,
      },
      {
        key: 'children',
        title: 'Children',
        description: 'Ages 2-12',
        value: children,
        setValue: setChildren,
        min: 0,
      },
      {
        key: 'pets',
        title: 'Pets',
        description: 'Traveling companions',
        value: pets,
        setValue: setPets,
        min: 0,
      },
    ],
    [adults, children, min, pets],
  );

  return (
    <div ref={rootRef} className={['relative', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-neutral-300 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-extrabold uppercase text-neutral-900">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-neutral-900">
            {normalizedValue} traveler{normalizedValue === 1 ? '' : 's'}
            {pets > 0 ? `, ${pets} pet${pets === 1 ? '' : 's'}` : ''}
          </span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Users className="h-4 w-4" />
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose number of travelers"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-xl"
        >
          <div className="divide-y divide-neutral-200 p-6">
            {guestRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-base font-bold text-neutral-900">
                    {row.title}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {row.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      row.setValue((current) => Math.max(row.min, current - 1))
                    }
                    disabled={row.value === row.min}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-neutral-200"
                    aria-label={`Remove ${row.title.toLowerCase()}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-base font-semibold text-neutral-900">
                    {row.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => row.setValue((current) => current + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition-colors hover:border-neutral-900"
                    aria-label={`Add ${row.title.toLowerCase()}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerPicker;
