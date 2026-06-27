import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plane,
  Train,
  Car,
  Bus,
  Ship,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getTripDisplayName } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  locationRefService,
  transportService,
} from '../services/travelDataService';
import {
  mapLocationRefRowToLocationRef,
  mapTransportSegmentRowToTransportSegment,
} from '../services/tripMappers';
import type { LocationRef, TransportMode, TransportSegment } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import LocationInput from '../components/ui/LocationInput';
import Select from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';

const LOCAL_TRAVEL_SEGMENTS_KEY = 'travel-builder:travel-segments';
const transportModes: TransportMode[] = ['flight', 'train', 'car', 'bus', 'ferry', 'walk', 'other'];
const transportRoles: NonNullable<TransportSegment['role']>[] = [
  'arrival',
  'departure',
  'between-stops',
  'local',
];

type SegmentFormState = {
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

const emptyForm: SegmentFormState = {
  mode: 'flight',
  role: 'arrival',
  isPrimary: true,
  provider: '',
  confirmationCode: '',
  fromLocation: null,
  toLocation: null,
  departureLocation: '',
  arrivalLocation: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  price: '',
  currency: 'USD',
  notes: '',
  bookingUrl: '',
  fromStopId: '',
  toStopId: '',
};

const modeIconMap: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  train: <Train className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  ferry: <Ship className="w-4 h-4" />,
  walk: <MapPin className="w-4 h-4" />,
  other: <MapPin className="w-4 h-4" />,
};

const formatMode = (mode: TransportMode) =>
  mode.charAt(0).toUpperCase() + mode.slice(1);

const formatRole = (role?: TransportSegment['role']) =>
  role ? role.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'Travel';

const transportModeOptions = transportModes.map((mode) => ({
  value: mode,
  label: formatMode(mode),
}));

const transportRoleOptions = transportRoles.map((role) => ({
  value: role,
  label: formatRole(role),
}));

const splitDateTime = (dateTime?: string) => {
  if (!dateTime) return { date: '', time: '' };
  const [date, time = ''] = dateTime.split('T');
  return { date, time: time.slice(0, 5) };
};

const buildDateTime = (date: string, time: string) => {
  if (!date) return undefined;
  return `${date}T${time || '00:00'}:00`;
};

const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const calculateDuration = (departure?: string, arrival?: string) => {
  if (!departure || !arrival) return undefined;
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return undefined;
  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ');
};

const getSegmentSortValue = (segment: TransportSegment) => {
  const dateTime = segment.departureDateTime || segment.arrivalDateTime;
  if (!dateTime) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(dateTime).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const sortSegmentsByTime = (segments: TransportSegment[]) =>
  [...segments].sort((a, b) => getSegmentSortValue(a) - getSegmentSortValue(b));

type TravelFilter = 'all' | 'flight' | 'train' | 'transfer' | 'local' | 'missing';

const getLocationName = (location?: LocationRef | null, fallback = '') =>
  location?.name || fallback;

const isTransferSegment = (segment: TransportSegment) =>
  segment.mode !== 'flight' &&
  (segment.role === 'arrival' ||
    segment.role === 'departure' ||
    segment.role === 'between-stops' ||
    Boolean(segment.fromStopId && segment.toStopId));

const getMissingDetails = (segment: TransportSegment) => {
  const missing: string[] = [];

  if (!getLocationName(segment.fromLocation, segment.departureLocation)) missing.push('From');
  if (!getLocationName(segment.toLocation, segment.arrivalLocation)) missing.push('To');
  if (!segment.departureDateTime) missing.push('Departure');
  if (!segment.arrivalDateTime) missing.push('Arrival');
  if (!segment.provider && segment.mode === 'flight') missing.push('Airline');
  if (!segment.confirmationCode && (segment.mode === 'flight' || segment.bookingUrl)) missing.push('Confirmation');
  if (!segment.bookingUrl) missing.push('Booking link');

  return missing;
};

const matchesTravelFilter = (segment: TransportSegment, filter: TravelFilter) => {
  if (filter === 'all') return true;
  if (filter === 'missing') return getMissingDetails(segment).length > 0;
  if (filter === 'transfer') return isTransferSegment(segment);
  if (filter === 'local') return segment.mode !== 'flight' && segment.role === 'local';
  if (filter === 'train') return segment.mode === 'train' || segment.mode === 'bus' || segment.mode === 'ferry';
  return segment.mode === filter;
};

const formatCurrency = (value?: number, currency = 'USD') =>
  typeof value === 'number' ? `${currency} ${value.toLocaleString()}` : null;

const makeManualLocationRef = (name: string): LocationRef | null => {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return {
    id: `manual-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: trimmedName,
    source: 'manual',
  };
};

const persistGoogleLocation = async (
  userId: string,
  location?: LocationRef,
): Promise<LocationRef | undefined> => {
  if (!location || location.source !== 'google') return location;

  const row = await locationRefService.upsertGoogleLocationRef(userId, location);
  return mapLocationRefRowToLocationRef(row);
};

const loadStoredSegments = (tripId: string, fallbackSegments: TransportSegment[]) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_TRAVEL_SEGMENTS_KEY) ?? '{}') as Record<string, TransportSegment[]>;
    return stored[tripId] ?? fallbackSegments;
  } catch {
    return fallbackSegments;
  }
};

const persistStoredSegments = (tripId: string, segments: TransportSegment[]) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_TRAVEL_SEGMENTS_KEY) ?? '{}') as Record<string, TransportSegment[]>;
    window.localStorage.setItem(
      LOCAL_TRAVEL_SEGMENTS_KEY,
      JSON.stringify({ ...stored, [tripId]: segments })
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_TRAVEL_SEGMENTS_KEY,
      JSON.stringify({ [tripId]: segments })
    );
  }
};

const TransportCard: React.FC<{
  segment: TransportSegment;
  getStopName: (stopId?: string) => string;
  onEdit: (segment: TransportSegment) => void;
  onDelete: (segmentId: string) => void;
}> = ({ segment, getStopName, onEdit, onDelete }) => {
  const fromLabel = segment.fromStopId
    ? getStopName(segment.fromStopId)
    : getLocationName(segment.fromLocation, segment.departureLocation) || 'From';
  const toLabel = segment.toStopId
    ? getStopName(segment.toStopId)
    : getLocationName(segment.toLocation, segment.arrivalLocation) || 'To';
  const departureLabel = formatDateTime(segment.departureDateTime) || 'Departure not set';
  const arrivalLabel = formatDateTime(segment.arrivalDateTime) || 'Arrival not set';
  const priceLabel = formatCurrency(segment.price, segment.currency);
  const missingDetails = getMissingDetails(segment);

  return (
    <Card hover={false} className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            {modeIconMap[segment.mode]}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{formatMode(segment.mode)}</Badge>
              <Badge variant="warning">{formatRole(segment.role)}</Badge>
              {segment.isPrimary && <Badge variant="success">Primary</Badge>}
            </div>

            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              {fromLabel} <span className="text-neutral-300">→</span> {toLabel}
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              {[
                segment.provider || formatMode(segment.mode),
                segment.confirmationCode ? `Confirmation ${segment.confirmationCode}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {missingDetails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {missingDetails.slice(0, 4).map((field) => (
                  <Badge key={field} variant="warning" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {field}
                  </Badge>
                ))}
                {missingDetails.length > 4 && (
                  <Badge variant="warning">+{missingDetails.length - 4} more</Badge>
                )}
              </div>
            )}

            {segment.notes && (
              <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                {segment.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-3 text-sm lg:w-72">
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">Depart</p>
            <p className="mt-1 font-semibold text-neutral-900">{departureLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">Arrive</p>
            <p className="mt-1 font-semibold text-neutral-900">{arrivalLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">Duration</p>
            <p className="mt-1 font-semibold text-neutral-900">{segment.duration || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">Cost</p>
            <p className="mt-1 font-semibold text-neutral-900">{priceLabel || 'Not set'}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:w-36">
          {segment.bookingUrl && (
            <a
              href={segment.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-600 transition-colors hover:bg-primary-50"
              aria-label="Open booking details"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(segment)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Edit travel segment"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(segment.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-600"
            aria-label="Delete travel segment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

const fieldLabelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';
const selectClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';

const TravelSegmentForm: React.FC<{
  form: SegmentFormState;
  isMultiStop: boolean;
  orderedStops: { id: string; name: string }[];
  onChange: (form: SegmentFormState) => void;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  isSaving: boolean;
}> = ({ form, isMultiStop, orderedStops, onChange, onCancel, onSubmit, submitLabel, isSaving }) => (
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
        onChange={(value) => onChange({ ...form, role: value as SegmentFormState['role'] })}
        options={transportRoleOptions}
      />
    </div>

    <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
      <input
        type="checkbox"
        checked={form.isPrimary}
        onChange={(event) => onChange({ ...form, isPrimary: event.target.checked })}
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
        onChange={(event) => onChange({ ...form, confirmationCode: event.target.value })}
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
        onChange={(event) => onChange({ ...form, departureTime: event.target.value })}
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
        onChange={(event) => onChange({ ...form, arrivalTime: event.target.value })}
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
        onChange={(event) => onChange({ ...form, currency: event.target.value.toUpperCase() })}
        maxLength={3}
      />
      <Input
        label="Booking URL"
        type="url"
        value={form.bookingUrl}
        onChange={(event) => onChange({ ...form, bookingUrl: event.target.value })}
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
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : submitLabel}
      </Button>
    </div>
  </form>
);

const Flights: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(tripId);
  const trip = serviceTrip ?? fallbackTrip;
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const isMultiStop = orderedStops.length > 1;
  const [travelSegments, setTravelSegments] = useState<TransportSegment[]>([]);
  const [travelSource, setTravelSource] = useState<'supabase' | 'fallback'>('fallback');
  const [travelError, setTravelError] = useState<string | null>(null);
  const [isSavingSegment, setIsSavingSegment] = useState(false);
  const [segmentModalOpen, setSegmentModalOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentForm, setSegmentForm] = useState<SegmentFormState>(emptyForm);
  const [activeFilter, setActiveFilter] = useState<TravelFilter>('all');
  const loadedTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!trip) return;
    const loadKey = `${trip.id}:${tripSource}`;
    if (loadedTripIdRef.current === loadKey) return;
    loadedTripIdRef.current = loadKey;

    let cancelled = false;
    const fallbackSegments = loadStoredSegments(trip.id, trip.transportSegments);
    setTravelSegments(fallbackSegments);
    setTravelSource('fallback');
    setTravelError(null);

    async function loadSupabaseSegments() {
      if (!trip || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const rows = await transportService.listTransportSegments(trip.id);
        if (cancelled) return;

        const segments = rows.map((row) =>
          mapTransportSegmentRowToTransportSegment(row, [], fallbackSegments),
        );
        setTravelSegments(segments);
        setTravelSource('supabase');
        persistStoredSegments(trip.id, segments);
      } catch {
        if (cancelled) return;
        setTravelError('Supabase travel segments could not be loaded. Showing local travel segments instead.');
      }
    }

    void loadSupabaseSegments();

    return () => {
      cancelled = true;
    };
  }, [trip, tripSource]);

  const updateTravelSegments = (segments: TransportSegment[]) => {
    if (!trip) return;
    setTravelSegments(segments);
    persistStoredSegments(trip.id, segments);
  };

  const openCreateModal = (defaults: Partial<SegmentFormState> = {}) => {
    setEditingSegmentId(null);
    setSegmentForm({ ...emptyForm, ...defaults });
    setSegmentModalOpen(true);
  };

  const openEditModal = (segment: TransportSegment) => {
    const departure = splitDateTime(segment.departureDateTime);
    const arrival = splitDateTime(segment.arrivalDateTime);
    setEditingSegmentId(segment.id);
    setSegmentForm({
      mode: segment.mode,
      role: segment.role || 'arrival',
      isPrimary: !!segment.isPrimary,
      provider: segment.provider || '',
      confirmationCode: segment.confirmationCode || '',
      fromLocation: segment.fromLocation || makeManualLocationRef(segment.departureLocation || ''),
      toLocation: segment.toLocation || makeManualLocationRef(segment.arrivalLocation || ''),
      departureLocation: segment.departureLocation || '',
      arrivalLocation: segment.arrivalLocation || '',
      departureDate: departure.date,
      departureTime: departure.time,
      arrivalDate: arrival.date,
      arrivalTime: arrival.time,
      price: typeof segment.price === 'number' ? String(segment.price) : '',
      currency: segment.currency || 'USD',
      notes: segment.notes || '',
      bookingUrl: segment.bookingUrl || '',
      fromStopId: segment.fromStopId || '',
      toStopId: segment.toStopId || '',
    });
    setSegmentModalOpen(true);
  };

  const closeSegmentModal = () => {
    setSegmentModalOpen(false);
    setEditingSegmentId(null);
    setSegmentForm(emptyForm);
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!trip) return;
    const nextSegments = travelSegments.filter((segment) => segment.id !== segmentId);

    if (travelSource !== 'supabase') {
      updateTravelSegments(nextSegments);
      return;
    }

    try {
      await transportService.deleteTransportSegment(segmentId);
      updateTravelSegments(nextSegments);
      setTravelError(null);
    } catch {
      updateTravelSegments(nextSegments);
      setTravelError('Supabase delete failed. Removed the segment locally instead.');
      setTravelSource('fallback');
    }
  };

  const handleSubmitSegment = async () => {
    if (!trip) return;
    const departureDateTime = buildDateTime(segmentForm.departureDate, segmentForm.departureTime);
    const arrivalDateTime = buildDateTime(segmentForm.arrivalDate, segmentForm.arrivalTime);
    const nextSegment: TransportSegment = {
      id: editingSegmentId || `transport-${trip.id}-${Date.now()}`,
      tripId: trip.id,
      mode: segmentForm.mode,
      role: segmentForm.role,
      isPrimary: segmentForm.isPrimary,
      provider: segmentForm.provider.trim() || undefined,
      confirmationCode: segmentForm.confirmationCode.trim() || undefined,
      fromLocation: segmentForm.fromLocation || undefined,
      toLocation: segmentForm.toLocation || undefined,
      departureLocation: getLocationName(segmentForm.fromLocation, segmentForm.departureLocation).trim(),
      arrivalLocation: getLocationName(segmentForm.toLocation, segmentForm.arrivalLocation).trim(),
      departureDateTime,
      arrivalDateTime,
      duration: calculateDuration(departureDateTime, arrivalDateTime),
      price: segmentForm.price ? Number(segmentForm.price) : undefined,
      currency: segmentForm.currency.trim() || 'USD',
      notes: segmentForm.notes.trim() || undefined,
      bookingUrl: segmentForm.bookingUrl.trim() || undefined,
      fromStopId: isMultiStop && segmentForm.fromStopId ? segmentForm.fromStopId : undefined,
      toStopId: isMultiStop && segmentForm.toStopId ? segmentForm.toStopId : undefined,
    };

    const saveLocally = (segment: TransportSegment) => {
      updateTravelSegments(
        editingSegmentId
          ? travelSegments.map((currentSegment) =>
              currentSegment.id === editingSegmentId ? segment : currentSegment,
            )
          : [segment, ...travelSegments],
      );
    };

    setIsSavingSegment(true);

    try {
      const userId = await getAuthenticatedUserId();

      if (userId && travelSource === 'supabase') {
        const [fromLocation, toLocation] = await Promise.all([
          persistGoogleLocation(userId, nextSegment.fromLocation),
          persistGoogleLocation(userId, nextSegment.toLocation),
        ]);
        const segmentToSave: TransportSegment = {
          ...nextSegment,
          fromLocation,
          toLocation,
          departureLocation: getLocationName(fromLocation, nextSegment.departureLocation).trim(),
          arrivalLocation: getLocationName(toLocation, nextSegment.arrivalLocation).trim(),
        };
        const row = editingSegmentId
          ? await transportService.updateTravelSegment(segmentToSave)
          : await transportService.createTravelSegment(trip.id, segmentToSave);
        const savedSegment = mapTransportSegmentRowToTransportSegment(row, [], [
          segmentToSave,
        ]);

        saveLocally(savedSegment);
        setTravelError(null);
      } else {
        saveLocally(nextSegment);
        setTravelError(
          userId
            ? null
            : 'Saved locally. Sign-in is not connected yet.',
        );
      }

      closeSegmentModal();
    } catch {
      saveLocally(nextSegment);
      setTravelSource('fallback');
      setTravelError('Supabase save failed. Saved the segment locally instead.');
      closeSegmentModal();
    } finally {
      setIsSavingSegment(false);
    }
  };

  const timelineSegments = useMemo(
    () => sortSegmentsByTime(travelSegments),
    [travelSegments]
  );

  const filteredTimelineSegments = useMemo(
    () => timelineSegments.filter((segment) => matchesTravelFilter(segment, activeFilter)),
    [activeFilter, timelineSegments],
  );

  const travelStats = useMemo(
    () => {
      const totalCost = travelSegments.reduce(
        (sum, segment) => sum + (typeof segment.price === 'number' ? segment.price : 0),
        0,
      );

      return {
        flights: travelSegments.filter((segment) => segment.mode === 'flight').length,
        ground: travelSegments.filter((segment) => matchesTravelFilter(segment, 'train')).length,
        transfers: travelSegments.filter((segment) => isTransferSegment(segment)).length,
        missing: travelSegments.filter((segment) => getMissingDetails(segment).length > 0).length,
        totalCost,
      };
    },
    [travelSegments],
  );

  const filterOptions = useMemo(
    () => [
      { key: 'all' as TravelFilter, label: 'All', count: travelSegments.length },
      { key: 'flight' as TravelFilter, label: 'Flights', count: travelStats.flights },
      { key: 'train' as TravelFilter, label: 'Train/Bus', count: travelStats.ground },
      { key: 'transfer' as TravelFilter, label: 'Transfers', count: travelStats.transfers },
      {
        key: 'local' as TravelFilter,
        label: 'Local',
        count: travelSegments.filter((segment) => matchesTravelFilter(segment, 'local')).length,
      },
      { key: 'missing' as TravelFilter, label: 'Missing info', count: travelStats.missing },
    ],
    [travelSegments, travelStats],
  );

  const getStopName = (stopId?: string) =>
    orderedStops.find((stop) => stop.id === stopId)?.name || 'Trip';

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<Plane className="w-8 h-8" />}
          title="Trip not found"
          description="Could not find the trip for these flights."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Flights & Transportation</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Organize every travel leg for {getTripDisplayName(trip)}
          </p>
          {(serviceTripError || travelError) && (
            <p className="text-sm text-warning-700 mt-2">
              {travelError || 'Supabase trip data could not be loaded. Showing local trip data instead.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openCreateModal({ mode: 'flight', role: 'arrival', isPrimary: true })}>
            <Plane className="w-4 h-4 mr-1.5" />
            Flight
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCreateModal({ mode: 'train', role: 'between-stops', isPrimary: true })}>
            <Train className="w-4 h-4 mr-1.5" />
            Train/Bus
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCreateModal({ mode: 'car', role: 'local', isPrimary: false })}>
            <Car className="w-4 h-4 mr-1.5" />
            Local
          </Button>
          <Button size="sm" onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      <Card hover={false} className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Travel plan
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {orderedStops.length > 0
                ? orderedStops.map((stop) => stop.name).join(' → ')
                : getTripDisplayName(trip)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-400">Flights</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{travelStats.flights}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-400">Train/Bus</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{travelStats.ground}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-400">Missing</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{travelStats.missing}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-400">Cost</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">
                {travelStats.totalCost > 0 ? `$${travelStats.totalCost.toLocaleString()}` : '$0'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveFilter(option.key)}
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

      <div className="space-y-3">
        {timelineSegments.length === 0 ? (
          <EmptyState
            icon={<Plane className="w-8 h-8" />}
            title="No travel segments yet"
            description="Add flights, trains, buses, transfers, rideshares, and other travel details."
            actionLabel="Add travel segment"
            onAction={() => openCreateModal()}
          />
        ) : filteredTimelineSegments.length > 0 ? (
          filteredTimelineSegments.map((segment) => (
            <TransportCard
              key={segment.id}
              segment={segment}
              getStopName={getStopName}
              onEdit={openEditModal}
              onDelete={handleDeleteSegment}
            />
          ))
        ) : (
          <EmptyState
            icon={<Plane className="w-8 h-8" />}
            title="No matching travel"
            description="Try another filter or add a new travel segment."
            actionLabel="Add travel segment"
            onAction={() => openCreateModal()}
          />
        )}
      </div>

      <Modal
        isOpen={segmentModalOpen}
        onClose={closeSegmentModal}
        title={editingSegmentId ? 'Edit Travel Segment' : 'Add Travel Segment'}
        size="lg"
      >
        <TravelSegmentForm
          form={segmentForm}
          isMultiStop={isMultiStop}
          orderedStops={orderedStops}
          onChange={setSegmentForm}
          onCancel={closeSegmentModal}
          onSubmit={handleSubmitSegment}
          submitLabel={editingSegmentId ? 'Save changes' : 'Add segment'}
          isSaving={isSavingSegment}
        />
      </Modal>

    </div>
  );
};

export default Flights;
