import React, { useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LocationInput from '../ui/LocationInput';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { getBudgetCategoryKey } from '../../utils/budget';
import type { BudgetCategory, BudgetCurrency, ItineraryItemType, LocationRef } from '../../types';

export type ItineraryModalMode = 'add' | 'edit';
export interface ItineraryItemFormState { time: string; name: string; type: ItineraryItemType; location: string; estimatedCost: string; notes: string; budgetCategory: string; locationRef: LocationRef | null; }
export type ItineraryFormErrors = Partial<Record<keyof ItineraryItemFormState, string>>;

const itineraryItemTypes: { value: ItineraryItemType; label: string }[] = [
  { value: 'flight', label: 'Flight' }, { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' }, { value: 'activity', label: 'Activity' },
  { value: 'free-time', label: 'Free time' }, { value: 'transport', label: 'Transport' },
];

interface ItineraryItemModalProps {
  isOpen: boolean; mode: ItineraryModalMode; form: ItineraryItemFormState;
  errors: ItineraryFormErrors; budgetCategories: BudgetCategory[]; isSaving: boolean;
  dayNumber?: number; timeOfDay?: string; currency?: BudgetCurrency;
  stopNames?: Record<string, string>; onClose: () => void;
  onChange: (field: keyof ItineraryItemFormState, value: string) => void;
  onLocationChange: (location: LocationRef | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const ItineraryItemModal: React.FC<ItineraryItemModalProps> = ({
  isOpen, mode, form, errors, budgetCategories, isSaving, dayNumber, timeOfDay,
  currency = 'USD', stopNames = {}, onClose, onChange, onLocationChange, onSubmit,
}) => {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const firstError = Object.keys(errors)[0] as keyof ItineraryItemFormState | undefined;
    if (firstError) document.querySelector<HTMLElement>(`[data-itinerary-field="${firstError}"] input, [data-itinerary-field="${firstError}"] button`)?.focus();
  }, [errors, isOpen]);

  const title = mode === 'add' ? 'Add itinerary item' : 'Edit itinerary item';
  const context = dayNumber ? `Day ${dayNumber}${timeOfDay ? ` · ${timeOfDay[0].toUpperCase()}${timeOfDay.slice(1)}` : ''}` : undefined;

  return (
    <Modal
      isOpen={isOpen} onClose={onClose} title={title} description={context} size="md"
      closeOnBackdrop={!isSaving} closeOnEscape={!isSaving} initialFocusRef={nameRef}
      footer={<div className="flex items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button><Button type="submit" form="itinerary-item-form" disabled={isSaving}>{isSaving ? 'Saving…' : mode === 'add' ? 'Add item' : 'Save changes'}</Button></div>}
    >
      <form id="itinerary-item-form" onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div data-itinerary-field="time"><Input label="Time" type="time" value={form.time} onChange={(event) => onChange('time', event.target.value)} error={errors.time} /></div>
          <div data-itinerary-field="type"><Select label="Type" value={form.type} onChange={(value) => onChange('type', value)} options={itineraryItemTypes} /></div>
        </div>
        <div data-itinerary-field="name"><Input ref={nameRef} label="Name" value={form.name} onChange={(event) => onChange('name', event.target.value)} error={errors.name} /></div>
        <div data-itinerary-field="location"><LocationInput label="Location" value={form.locationRef} onChange={(location) => { onLocationChange(location); onChange('location', location?.formattedAddress ?? location?.name ?? ''); }} placeholder="Search for a place" error={errors.location} /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div data-itinerary-field="estimatedCost"><Input label={`Estimated cost (${currency})`} type="number" min={0} step="0.01" value={form.estimatedCost} onChange={(event) => onChange('estimatedCost', event.target.value)} error={errors.estimatedCost} /></div>
          <div data-itinerary-field="budgetCategory"><Select label="Budget category" value={form.budgetCategory} onChange={(value) => onChange('budgetCategory', value)} options={[{ value: '', label: 'Optional' }, ...budgetCategories.map((category) => ({ value: getBudgetCategoryKey(category), label: category.stopId ? `${category.name} (${stopNames[category.stopId] ?? 'Trip stop'})` : category.name }))]} />{errors.budgetCategory && <p className="mt-1.5 text-sm text-error-500">{errors.budgetCategory}</p>}</div>
        </div>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-app-text-muted">Notes</span><textarea value={form.notes} onChange={(event) => onChange('notes', event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
      </form>
    </Modal>
  );
};

export default ItineraryItemModal;
