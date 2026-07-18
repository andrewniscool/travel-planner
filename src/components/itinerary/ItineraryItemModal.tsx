import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LocationInput from '../ui/LocationInput';
import Select from '../ui/Select';
import { getBudgetCategoryKey } from '../../utils/budget';
import type { BudgetCategory, ItineraryItemType, LocationRef } from '../../types';

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

export type ItineraryFormErrors = Partial<Record<keyof ItineraryItemFormState, string>>;

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
    <div className="fixed -inset-px z-[100] bg-black/65 animate-fade-in" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg bg-app-surface rounded-2xl shadow-elevated animate-slide-up"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-app-border-muted">
            <h2 className="text-lg font-semibold text-app-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-lg text-app-text-subtle hover:text-app-text-muted hover:bg-app-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Time"
                type="time"
                value={form.time}
                onChange={(event) => onChange('time', event.target.value)}
                error={errors.time}
              />

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

            <Input
              label="Name"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              error={errors.name}
            />

            <div>
              <LocationInput
                label="Location"
                value={form.locationRef}
                onChange={(location) => {
                  onLocationChange(location);
                  onChange('location', location?.formattedAddress ?? location?.name ?? '');
                }}
                placeholder="Search for a place"
                error={errors.location}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Estimated cost"
                type="number"
                min={0}
                step="0.01"
                value={form.estimatedCost}
                onChange={(event) => onChange('estimatedCost', event.target.value)}
                error={errors.estimatedCost}
              />

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
                  <p className="text-xs text-error-500 mt-1">{errors.budgetCategory}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-text-muted mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(event) => onChange('notes', event.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-surface text-app-text placeholder:text-app-text-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-app-border-muted">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : buttonText}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ItineraryItemModal;
