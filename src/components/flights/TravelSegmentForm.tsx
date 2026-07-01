import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LocationInput from '../ui/LocationInput';
import Select from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import type { LocationRef, TransportMode, TransportSegment } from '../../types';

export type SegmentFormState = {
  mode: TransportMode;
  role: NonNullable<TransportSegment['role']>;
  isPrimary: boolean;
  provider: string;
  confirmationCode: string;
  fromLocation: LocationRef | null;
  toLocation: LocationRef | null;
  departureLocation: string;
  arrivalLocation: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  price: string;
  currency: string;
  notes: string;
  bookingUrl: string;
  fromStopId: string;
  toStopId: string;
};

const transportModes: TransportMode[] = [
  'flight',
  'train',
  'car',
  'bus',
  'ferry',
  'walk',
  'other',
];
const transportRoles: NonNullable<TransportSegment['role']>[] = [
  'arrival',
  'departure',
  'between-stops',
  'local',
];

const formatMode = (mode: TransportMode) =>
  mode.charAt(0).toUpperCase() + mode.slice(1);

const formatRole = (role?: TransportSegment['role']) =>
  role
    ? role
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Travel';

const transportModeOptions = transportModes.map((mode) => ({
  value: mode,
  label: formatMode(mode),
}));

const transportRoleOptions = transportRoles.map((role) => ({
  value: role,
  label: formatRole(role),
}));

const fieldLabelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';
const selectClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';

interface TravelSegmentFormProps {
  form: SegmentFormState;
  isMultiStop: boolean;
  orderedStops: { id: string; name: string }[];
  onChange: (form: SegmentFormState) => void;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  isSaving: boolean;
}

const TravelSegmentForm: React.FC<TravelSegmentFormProps> = ({
  form,
  isMultiStop,
  orderedStops,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
  isSaving,
}) => (
  <form
    className="space-y-5"
    onSubmit={(event) => {
      event.preventDefault();
      void onSubmit();
    }}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Travel type"
        value={form.mode}
        onChange={(value) => onChange({ ...form, mode: value as TransportMode })}
        options={transportModeOptions}
      />
      <Select
        label="Trip purpose"
        value={form.role}
        onChange={(value) =>
          onChange({ ...form, role: value as SegmentFormState['role'] })
        }
        options={transportRoleOptions}
      />
    </div>

    <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
      <input
        type="checkbox"
        checked={form.isPrimary}
        onChange={(event) =>
          onChange({ ...form, isPrimary: event.target.checked })
        }
        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
      />
      Primary travel
    </label>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Provider / company"
        value={form.provider}
        onChange={(event) => onChange({ ...form, provider: event.target.value })}
        placeholder="United Airlines, ANA, Amtrak, Hertz"
      />
      <Input
        label="Confirmation code"
        value={form.confirmationCode}
        onChange={(event) =>
          onChange({ ...form, confirmationCode: event.target.value })
        }
        placeholder="Optional"
      />
      <LocationInput
        label="From location"
        value={form.fromLocation}
        onChange={(location) =>
          onChange({
            ...form,
            fromLocation: location,
            departureLocation: location?.name ?? '',
          })
        }
        placeholder="SFO, Tokyo Station, hotel pickup"
        required
      />
      <LocationInput
        label="To location"
        value={form.toLocation}
        onChange={(location) =>
          onChange({
            ...form,
            toLocation: location,
            arrivalLocation: location?.name ?? '',
          })
        }
        placeholder="HND, Kyoto Station, airport"
        required
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DatePicker
        label="Departure date"
        value={form.departureDate}
        onChange={(value) => onChange({ ...form, departureDate: value })}
      />
      <Input
        label="Departure time"
        type="time"
        value={form.departureTime}
        onChange={(event) =>
          onChange({ ...form, departureTime: event.target.value })
        }
      />
      <DatePicker
        label="Arrival date"
        value={form.arrivalDate}
        onChange={(value) => onChange({ ...form, arrivalDate: value })}
      />
      <Input
        label="Arrival time"
        type="time"
        value={form.arrivalTime}
        onChange={(event) =>
          onChange({ ...form, arrivalTime: event.target.value })
        }
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input
        label="Estimated cost"
        type="number"
        min="0"
        step="0.01"
        value={form.price}
        onChange={(event) => onChange({ ...form, price: event.target.value })}
        placeholder="0"
      />
      <Input
        label="Currency"
        value={form.currency}
        onChange={(event) =>
          onChange({ ...form, currency: event.target.value.toUpperCase() })
        }
        maxLength={3}
      />
      <Input
        label="Booking URL"
        type="url"
        value={form.bookingUrl}
        onChange={(event) =>
          onChange({ ...form, bookingUrl: event.target.value })
        }
        placeholder="Optional"
      />
    </div>

    {isMultiStop && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="From stop"
          value={form.fromStopId}
          onChange={(value) => onChange({ ...form, fromStopId: value })}
          options={[
            { value: '', label: 'Optional' },
            ...orderedStops.map((stop) => ({ value: stop.id, label: stop.name })),
          ]}
        />
        <Select
          label="To stop"
          value={form.toStopId}
          onChange={(value) => onChange({ ...form, toStopId: value })}
          options={[
            { value: '', label: 'Optional' },
            ...orderedStops.map((stop) => ({ value: stop.id, label: stop.name })),
          ]}
        />
      </div>
    )}

    <label>
      <span className={fieldLabelClass}>Notes</span>
      <textarea
        value={form.notes}
        onChange={(event) => onChange({ ...form, notes: event.target.value })}
        className={`${selectClass} min-h-24 resize-y`}
        placeholder="Seat notes, luggage reminders, pickup details, or booking context"
      />
    </label>

    <div className="flex justify-end gap-3 pt-2">
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : submitLabel}
      </Button>
    </div>
  </form>
);

export default TravelSegmentForm;
