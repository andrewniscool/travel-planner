import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import LocationInput from '../ui/LocationInput';
import Select from '../ui/Select';
import { getBudgetCategoryKey } from '../../utils/budget';
import type {
  BudgetCategory,
  ItineraryItemType,
  LocationRef,
} from '../../types';

export type ItineraryModalMode = 'add' | 'edit';

export interface ItineraryItemFormState {
  time: string;
  name: string;
  type: ItineraryItemType;
  location: string;
  estimatedCost: string;
  notes: string;
  budgetCategory: string;
  locationRef: LocationRef | null;
}

export type ItineraryFormErrors = Partial<
  Record<keyof ItineraryItemFormState, string>
>;

const itineraryItemTypes: { value: ItineraryItemType; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'activity', label: 'Activity' },
  { value: 'free-time', label: 'Free time' },
  { value: 'transport', label: 'Transport' },
];

interface ItineraryItemModalProps {
  isOpen: boolean;
  mode: ItineraryModalMode;
  form: ItineraryItemFormState;
  errors: ItineraryFormErrors;
  budgetCategories: BudgetCategory[];
  isSaving: boolean;
  onClose: () => void;
  onChange: (field: keyof ItineraryItemFormState, value: string) => void;
  onLocationChange: (location: LocationRef | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const ItineraryItemModal: React.FC<ItineraryItemModalProps> = ({
  isOpen,
  mode,
  form,
  errors,
  budgetCategories,
  isSaving,
  onClose,
  onChange,
  onLocationChange,
  onSubmit,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = mode === 'add' ? 'Add itinerary item' : 'Edit itinerary item';
  const buttonText = mode === 'add' ? 'Add item' : 'Save changes';

  return createPortal(
    <div
      className="fixed -inset-px z-[100] bg-black/65 animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-100 animate-slide-up"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => onChange('time', event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.time && (
                  <p className="text-xs text-error-500 mt-1">{errors.time}</p>
                )}
              </div>

              <Select
                label="Type"
                value={form.type}
                onChange={(value) => onChange('type', value)}
                options={itineraryItemTypes.map((type) => ({
                  value: type.value,
                  label: type.label,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.name && (
                <p className="text-xs text-error-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <LocationInput
                label="Location"
                value={form.locationRef}
                onChange={(location) => {
                  onLocationChange(location);
                  onChange(
                    'location',
                    location?.formattedAddress ?? location?.name ?? '',
                  );
                }}
                placeholder="Search for a place"
                error={errors.location}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Estimated cost
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.estimatedCost}
                  onChange={(event) =>
                    onChange('estimatedCost', event.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.estimatedCost && (
                  <p className="text-xs text-error-500 mt-1">
                    {errors.estimatedCost}
                  </p>
                )}
              </div>

              <div>
                <Select
                  label="Budget category"
                  value={form.budgetCategory}
                  onChange={(value) => onChange('budgetCategory', value)}
                  options={[
                    { value: '', label: 'Optional' },
                    ...budgetCategories.map((category) => ({
                      value: getBudgetCategoryKey(category),
                      label: category.stopId
                        ? `${category.name} (${category.stopId})`
                        : category.name,
                    })),
                  ]}
                />
                {errors.budgetCategory && (
                  <p className="text-xs text-error-500 mt-1">
                    {errors.budgetCategory}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(event) => onChange('notes', event.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ItineraryItemModal;
