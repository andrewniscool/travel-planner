import React from 'react';
import {
  ArrowUpDown,
  Bus,
  Building2,
  Car,
  Clock,
  Footprints,
  Hash,
  Link2,
  MapPin,
  MoreHorizontal,
  Plane,
  Receipt,
  Ship,
  StickyNote,
  Train,
} from 'lucide-react';
import Input from '../ui/Input';
import LocationInput from '../ui/LocationInput';
import Select from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { BUDGET_CURRENCY_OPTIONS, isBudgetCurrency } from '../../utils/budget';
import type { LocationRef, TransportMode, TransportSegment } from '../../types';

export type SegmentFormState = {
  mode: TransportMode; role: NonNullable<TransportSegment['role']>; isPrimary: boolean;
  provider: string; confirmationCode: string; fromLocation: LocationRef | null; toLocation: LocationRef | null;
  departureLocation: string; arrivalLocation: string; departureDate: string; departureTime: string;
  arrivalDate: string; arrivalTime: string; price: string; currency: string; notes: string;
  bookingUrl: string; fromStopId: string; toStopId: string;
};
export type SegmentFormErrors = Partial<Record<keyof SegmentFormState | 'schedule', string>>;

const transportModes: TransportMode[] = ['flight', 'train', 'car', 'bus', 'ferry', 'walk', 'other'];
const transportRoles: NonNullable<TransportSegment['role']>[] = ['arrival', 'departure', 'between-stops', 'local'];
const titleCase = (value: string) => value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const modeIcons: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  train: <Train className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  bus: <Bus className="h-4 w-4" />,
  ferry: <Ship className="h-4 w-4" />,
  walk: <Footprints className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const Eyebrow: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-app-text-subtle">
    {icon}
    {children}
  </div>
);

interface TravelSegmentFormProps {
  form: SegmentFormState; errors: SegmentFormErrors; isMultiStop: boolean;
  orderedStops: { id: string; name: string }[]; onChange: (form: SegmentFormState) => void;
  onSubmit: () => void | Promise<void>;
}

const TravelSegmentForm: React.FC<TravelSegmentFormProps> = ({ form, errors, isMultiStop, orderedStops, onChange, onSubmit }) => {
  const needsProvider = form.mode !== 'walk' && form.mode !== 'other';
  const providerLabel = form.mode === 'flight' ? 'Airline' : form.mode === 'car' ? 'Rental company or provider' : 'Operator or provider';

  const handleSwap = () => onChange({
    ...form,
    fromLocation: form.toLocation,
    toLocation: form.fromLocation,
    departureLocation: form.arrivalLocation,
    arrivalLocation: form.departureLocation,
    fromStopId: form.toStopId,
    toStopId: form.fromStopId,
  });

  return <form id="travel-segment-form" className="space-y-7 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}>
    {Object.keys(errors).length > 0 && <div role="alert" className="rounded-xl border border-error-100 bg-error-50 p-3 text-sm text-error-600">Check the highlighted travel details before saving.</div>}

    <div className="space-y-3">
      <Eyebrow icon={<Plane className="h-3.5 w-3.5 text-primary-500" />}>Travel type</Eyebrow>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {transportModes.map((mode) => {
          const isActive = form.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...form, mode })}
              aria-pressed={isActive}
              className={[
                'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-app-border-muted text-app-text-muted hover:border-app-border hover:text-app-text',
              ].join(' ')}
            >
              {modeIcons[mode]}
              {titleCase(mode)}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Trip purpose" value={form.role} onChange={(value) => onChange({ ...form, role: value as SegmentFormState['role'] })} options={transportRoles.map((role) => ({ value: role, label: titleCase(role) }))} />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-app-text-muted">Primary segment</span>
          <button
            type="button"
            onClick={() => onChange({ ...form, isPrimary: !form.isPrimary })}
            aria-pressed={form.isPrimary}
            className="flex w-full items-center gap-2.5 rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-medium text-app-text shadow-sm transition-colors hover:border-app-text-subtle"
          >
            <span className={['flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors', form.isPrimary ? 'bg-primary-600 justify-end' : 'bg-app-border justify-start'].join(' ')}>
              <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </span>
            {form.isPrimary ? 'Marked as primary' : 'Mark as primary'}
          </button>
        </div>
      </div>
    </div>

    <div className="space-y-3 border-t border-app-border-muted pt-6">
      <Eyebrow icon={<MapPin className="h-3.5 w-3.5 text-primary-500" />}>Route</Eyebrow>
      <div className="relative space-y-3">
        <LocationInput label="From" value={form.fromLocation} onChange={(location) => onChange({ ...form, fromLocation: location, departureLocation: location?.name ?? '' })} placeholder={form.mode === 'flight' ? 'Airport or terminal' : 'Station, address, or pickup'} required error={errors.departureLocation} />
        <LocationInput label="To" value={form.toLocation} onChange={(location) => onChange({ ...form, toLocation: location, arrivalLocation: location?.name ?? '' })} placeholder={form.mode === 'flight' ? 'Airport or terminal' : 'Station, address, or destination'} required error={errors.arrivalLocation} />
        <button
          type="button"
          onClick={handleSwap}
          aria-label="Swap from and to"
          className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text-muted shadow-sm transition-colors hover:border-primary-300 hover:text-primary-600"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>
      {isMultiStop && <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Select label="From trip stop" value={form.fromStopId} onChange={(value) => onChange({ ...form, fromStopId: value })} options={[{ value: '', label: 'Optional' }, ...orderedStops.map((stop) => ({ value: stop.id, label: stop.name }))]} />
          {errors.fromStopId && <p className="mt-1 text-xs text-error-500">{errors.fromStopId}</p>}
        </div>
        <Select label="To trip stop" value={form.toStopId} onChange={(value) => onChange({ ...form, toStopId: value })} options={[{ value: '', label: 'Optional' }, ...orderedStops.map((stop) => ({ value: stop.id, label: stop.name }))]} />
      </div>}
    </div>

    <div className="space-y-3 border-t border-app-border-muted pt-6">
      <Eyebrow icon={<Clock className="h-3.5 w-3.5 text-primary-500" />}>Schedule</Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <DatePicker label="Departure date" value={form.departureDate} onChange={(value) => onChange({ ...form, departureDate: value })} />
          <Input className="w-32" label="Time" type="time" value={form.departureTime} onChange={(event) => onChange({ ...form, departureTime: event.target.value })} />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <DatePicker label="Arrival date" value={form.arrivalDate} onChange={(value) => onChange({ ...form, arrivalDate: value })} />
          <Input className="w-32" label="Time" type="time" value={form.arrivalTime} onChange={(event) => onChange({ ...form, arrivalTime: event.target.value })} />
        </div>
      </div>
      {errors.schedule && <p className="text-sm text-error-500">{errors.schedule}</p>}
    </div>

    <div className="space-y-3 border-t border-app-border-muted pt-6">
      <Eyebrow icon={<Receipt className="h-3.5 w-3.5 text-primary-500" />}>Booking details</Eyebrow>
      {needsProvider && <div className="grid gap-4 sm:grid-cols-2">
        <Input icon={<Building2 className="h-4 w-4" />} label={providerLabel} value={form.provider} onChange={(event) => onChange({ ...form, provider: event.target.value })} placeholder={form.mode === 'flight' ? 'United, ANA, Delta' : 'Company name'} />
        <Input icon={<Hash className="h-4 w-4" />} label="Confirmation code" value={form.confirmationCode} onChange={(event) => onChange({ ...form, confirmationCode: event.target.value })} placeholder="Optional" />
      </div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-[1fr_9rem] gap-3">
          <Input label="Estimated cost" type="number" min="0" step="0.01" value={form.price} onChange={(event) => onChange({ ...form, price: event.target.value })} error={errors.price} placeholder="0" />
          <Select label="Currency" value={form.currency} onChange={(value) => { if (isBudgetCurrency(value)) onChange({ ...form, currency: value }); }} options={BUDGET_CURRENCY_OPTIONS.map((currency) => ({ value: currency.code, label: currency.code }))} />
        </div>
        <Input icon={<Link2 className="h-4 w-4" />} label="Booking URL" type="url" value={form.bookingUrl} onChange={(event) => onChange({ ...form, bookingUrl: event.target.value })} error={errors.bookingUrl} placeholder="https://…" />
      </div>
    </div>

    <div className="space-y-2 border-t border-app-border-muted pt-6">
      <Eyebrow icon={<StickyNote className="h-3.5 w-3.5 text-primary-500" />}>Notes</Eyebrow>
      <textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className="min-h-24 w-full resize-y rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Seat, luggage, pickup, or booking notes" />
    </div>
  </form>;
};

export default TravelSegmentForm;
