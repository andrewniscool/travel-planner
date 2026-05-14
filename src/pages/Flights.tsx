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
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getTripDisplayName } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  transportService,
} from '../services/travelDataService';
import { mapTransportSegmentRowToTransportSegment } from '../services/tripMappers';
import type { LocationRef, TransportMode, TransportSegment } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import LocationInput from '../components/ui/LocationInput';

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

const getLocationName = (location?: LocationRef | null, fallback = '') =>
  location?.name || fallback;

const makeManualLocationRef = (name: string): LocationRef | null => {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return {
    id: `manual-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: trimmedName,
    source: 'manual',
  };
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
}> = ({ segment, getStopName, onEdit, onDelete }) => (
  <Card hover={false} className="p-4">
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600">
        {modeIconMap[segment.mode]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-neutral-900">
              {segment.fromStopId || segment.toStopId
                ? `${getStopName(segment.fromStopId)} → ${getStopName(segment.toStopId)}`
                : `${getLocationName(segment.fromLocation, segment.departureLocation) || 'From'} → ${getLocationName(segment.toLocation, segment.arrivalLocation) || 'To'}`}
            </h3>
            <Badge variant="default">{formatMode(segment.mode)}</Badge>
            <Badge variant="warning">{formatRole(segment.role)}</Badge>
            {segment.isPrimary && <Badge variant="success">Primary</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(segment)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              aria-label="Edit travel segment"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(segment.id)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50"
              aria-label="Delete travel segment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-neutral-600 mt-1">
          {segment.provider || formatMode(segment.mode)}
          {segment.confirmationCode ? ` · ${segment.confirmationCode}` : ''}
        </p>
        <p className="text-sm text-neutral-500 mt-1">
          {getLocationName(segment.fromLocation, segment.departureLocation)} to{' '}
          {getLocationName(segment.toLocation, segment.arrivalLocation)}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {[
            formatDateTime(segment.departureDateTime),
            formatDateTime(segment.arrivalDateTime),
            segment.duration,
            typeof segment.price === 'number'
              ? `${segment.currency || 'USD'} ${segment.price.toLocaleString()}`
              : undefined,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {segment.notes && <p className="text-sm text-neutral-600 mt-3">{segment.notes}</p>}
        {segment.bookingUrl && (
          <a
            href={segment.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 mt-3"
          >
            Booking details
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  </Card>
);

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
      <label>
        <span className={fieldLabelClass}>Travel type</span>
        <select
          value={form.mode}
          onChange={(event) => onChange({ ...form, mode: event.target.value as TransportMode })}
          className={selectClass}
        >
          {transportModes.map((mode) => (
            <option key={mode} value={mode}>{formatMode(mode)}</option>
          ))}
        </select>
      </label>
      <label>
        <span className={fieldLabelClass}>Role</span>
        <select
          value={form.role}
          onChange={(event) => onChange({ ...form, role: event.target.value as SegmentFormState['role'] })}
          className={selectClass}
        >
          {transportRoles.map((role) => (
            <option key={role} value={role}>{formatRole(role)}</option>
          ))}
        </select>
      </label>
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
      <Input
        label="Departure date"
        type="date"
        value={form.departureDate}
        onChange={(event) => onChange({ ...form, departureDate: event.target.value })}
      />
      <Input
        label="Departure time"
        type="time"
        value={form.departureTime}
        onChange={(event) => onChange({ ...form, departureTime: event.target.value })}
      />
      <Input
        label="Arrival date"
        type="date"
        value={form.arrivalDate}
        onChange={(event) => onChange({ ...form, arrivalDate: event.target.value })}
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
        <label>
          <span className={fieldLabelClass}>From stop</span>
          <select
            value={form.fromStopId}
            onChange={(event) => onChange({ ...form, fromStopId: event.target.value })}
            className={selectClass}
          >
            <option value="">Optional</option>
            {orderedStops.map((stop) => (
              <option key={stop.id} value={stop.id}>{stop.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={fieldLabelClass}>To stop</span>
          <select
            value={form.toStopId}
            onChange={(event) => onChange({ ...form, toStopId: event.target.value })}
            className={selectClass}
          >
            <option value="">Optional</option>
            {orderedStops.map((stop) => (
              <option key={stop.id} value={stop.id}>{stop.name}</option>
            ))}
          </select>
        </label>
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

  const openCreateModal = () => {
    setEditingSegmentId(null);
    setSegmentForm(emptyForm);
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
        const row = editingSegmentId
          ? await transportService.updateTravelSegment(nextSegment)
          : await transportService.createTravelSegment(trip.id, nextSegment);
        const savedSegment = mapTransportSegmentRowToTransportSegment(row, [], [
          nextSegment,
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

  const manualFlightSegments = useMemo(
    () => travelSegments.filter((segment) => segment.mode === 'flight'),
    [travelSegments]
  );

  const betweenStopSegments = useMemo(
    () => travelSegments.filter((segment) => segment.role === 'between-stops' || (segment.fromStopId && segment.toStopId)),
    [travelSegments]
  );

  const localSegments = useMemo(
    () => travelSegments.filter((segment) => segment.role === 'local'),
    [travelSegments]
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Flights & Transportation</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Plan major travel for {getTripDisplayName(trip)}
          </p>
          {(serviceTripError || travelError) && (
            <p className="text-sm text-warning-700 mt-2">
              {travelError || 'Supabase trip data could not be loaded. Showing local trip data instead.'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Travel Segment
          </Button>
        </div>
      </div>

      <Card hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">All Travel Segments</h2>
        {travelSegments.length > 0 ? (
          <div className="space-y-3">
            {travelSegments.map((segment) => (
              <TransportCard
                key={segment.id}
                segment={segment}
                getStopName={getStopName}
                onEdit={openEditModal}
                onDelete={handleDeleteSegment}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Plane className="w-8 h-8" />}
            title="No travel segments yet"
            description="Manually add flight, train, car, bus, ferry, or other travel details."
            actionLabel="Add travel segment"
            onAction={openCreateModal}
          />
        )}
      </Card>

      {betweenStopSegments.length > 0 && (
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Between Stops</h2>
          <div className="space-y-3">
            {betweenStopSegments.map((segment) => (
              <TransportCard
                key={segment.id}
                segment={segment}
                getStopName={getStopName}
                onEdit={openEditModal}
                onDelete={handleDeleteSegment}
              />
            ))}
          </div>
        </Card>
      )}

      <Card hover={false} className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Flights</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Manually track flight details when flights are part of the trip.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Flight
          </Button>
        </div>

        {manualFlightSegments.length > 0 ? (
          <div className="space-y-3">
            {manualFlightSegments.map((segment) => (
              <TransportCard
                key={segment.id}
                segment={segment}
                getStopName={getStopName}
                onEdit={openEditModal}
                onDelete={handleDeleteSegment}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Plane className="w-8 h-8" />}
            title="No flights added yet"
            description="Add airline, route, schedule, cost, confirmation, and notes manually."
            actionLabel="Add flight"
            onAction={openCreateModal}
          />
        )}
      </Card>

      <Card hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Local Transportation</h2>
        {localSegments.length > 0 ? (
          <div className="space-y-3">
            {localSegments.map((segment) => (
              <TransportCard
                key={segment.id}
                segment={segment}
                getStopName={getStopName}
                onEdit={openEditModal}
                onDelete={handleDeleteSegment}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title="No local transportation yet"
            description="Add metro passes, taxis, rental cars, rideshare, and local transfer details when they matter."
            actionLabel="Add local transport"
            onAction={openCreateModal}
          />
        )}
      </Card>

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
