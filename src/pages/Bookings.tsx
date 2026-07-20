import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BedDouble,
  Bus,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Ship,
  MapPin,
  Plane,
  Pencil,
  Plus,
  Trash2,
  Train,
  Users,
} from 'lucide-react';
import { useTripData } from '../hooks/useTripData';
import { loadTripScopedValue, persistTripScopedValue } from '../utils/tripStorage';
import { calculateDuration, formatCurrency, getMissingDetails, makeManualLocationRef, sortSegmentsByTime } from '../utils/transportSegments';
import { mapLocationRefToHotel } from '../services/locationDisplayMappers';
import { getSafeExternalUrl } from '../utils/safeUrl';
import type { Hotel, TransportMode, TransportSegment } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import InlineNotice from '../components/ui/InlineNotice';
import Modal from '../components/ui/Modal';
import PlanBookingModal, { type PlanStayDraft, type PlanTransportDraft } from '../components/plan/PlanBookingModal';

const LOCAL_TRAVEL_SEGMENTS_KEY = 'travel-builder:travel-segments';
const LOCAL_SELECTED_HOTELS_KEY = 'travel-builder:selected-hotels';
const LOCAL_PLAN_HOTELS_KEY = 'travel-builder:plan-hotels';

const emptyTransportDraft = (): PlanTransportDraft => ({ mode: 'flight', role: 'arrival', provider: '', from: null, to: null, departure: '', arrival: '', price: '', confirmationCode: '', fromStopId: '', toStopId: '', bookingUrl: '', notes: '', isPrimary: true });
const emptyStayDraft = (): PlanStayDraft => ({ location: null, stopId: '', checkIn: '', checkOut: '', pricePerNight: '', totalCost: '', confirmationCode: '', bookingUrl: '', notes: '' });

const modeIcons: Record<TransportMode, React.ElementType> = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  ferry: Ship,
  walk: MapPin,
  other: MapPin,
};

const formatDate = (value?: string, includeTime = false) => {
  if (!value) return 'Date not added';
  const date = new Date(includeTime || value.includes('T') ? value : `${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
};

const nightsBetween = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return undefined;
  const nights = Math.round(
    (new Date(`${checkOut.slice(0, 10)}T00:00:00`).getTime() -
      new Date(`${checkIn.slice(0, 10)}T00:00:00`).getTime()) /
      86_400_000,
  );
  return nights > 0 ? nights : undefined;
};

const BookingStatus = ({ complete }: { complete: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      complete
        ? 'bg-success-50 text-success-700'
        : 'bg-warning-50 text-warning-700'
    }`}
  >
    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
    {complete ? 'Confirmed' : 'Needs details'}
  </span>
);

const TransportBookingCard = ({ segment, onEdit, onDelete }: { segment: TransportSegment; onEdit: (segment: TransportSegment) => void; onDelete: (segment: TransportSegment) => void }) => {
  const [expanded, setExpanded] = useState(true);
  const Icon = modeIcons[segment.mode];
  const missing = getMissingDetails(segment);
  const bookingUrl = getSafeExternalUrl(segment.bookingUrl);
  const isComplete = missing.length === 0 && Boolean(segment.confirmationCode);

  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="border-l-4 border-accent-500">
        <div className="flex items-center justify-between gap-4 border-b border-app-border-muted px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-app-text-subtle">
              {formatDate(segment.departureDateTime)}
            </p>
            <p className="mt-0.5 font-semibold text-app-text-strong">
              {segment.mode === 'flight' ? 'Flight' : `${segment.mode[0].toUpperCase()}${segment.mode.slice(1)}`} to {segment.arrivalLocation || 'destination'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-app-text-subtle">Booking cost</p>
            <p className="font-semibold text-app-text-strong">{formatCurrency(segment.price, segment.currency) || 'Not added'}</p>
          </div>
        </div>

        <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-app-text-strong">{segment.provider || 'Provider not added'}</p>
              <BookingStatus complete={isComplete} />
              {segment.confirmationCode && <span className="rounded-full bg-app-surface-muted px-2.5 py-1 text-xs font-medium text-app-text-muted">Ref {segment.confirmationCode}</span>}
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-app-border-muted bg-app-surface-subtle p-4">
              <div>
                <p className="text-xl font-semibold text-app-text-strong">{formatDate(segment.departureDateTime, true)}</p>
                <p className="mt-1 text-sm font-medium text-app-text">{segment.departureLocation || 'Origin not added'}</p>
                <p className="mt-0.5 text-xs text-app-text-subtle">Departure</p>
              </div>
              <div className="flex min-w-20 flex-col items-center gap-1 text-app-text-subtle">
                <p className="text-[11px] font-medium">{segment.duration || 'Duration'}</p>
                <div className="flex w-full items-center"><span className="h-2 w-2 rounded-full border-2 border-accent-500" /><span className="h-px flex-1 bg-app-border" /><Icon className="mx-1 h-3.5 w-3.5 text-accent-600" /><span className="h-px flex-1 bg-app-border" /><span className="h-2 w-2 rounded-full border-2 border-accent-500" /></div>
                <p className="text-[11px] capitalize">{segment.mode}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-app-text-strong">{formatDate(segment.arrivalDateTime, true)}</p>
                <p className="mt-1 text-sm font-medium text-app-text">{segment.arrivalLocation || 'Destination not added'}</p>
                <p className="mt-0.5 text-xs text-app-text-subtle">Arrival</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-1">
            <button type="button" onClick={() => onEdit(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Edit transportation"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDelete(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label="Delete transportation"><Trash2 className="h-4 w-4" /></button>
            {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Open booking"><ExternalLink className="h-4 w-4" /></a>}
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={expanded ? 'Collapse booking details' : 'Expand booking details'}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-app-border-muted bg-app-surface-subtle px-5 py-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-app-text-subtle">Confirmation</p><p className="mt-1 font-medium text-app-text">{segment.confirmationCode || 'Not added'}</p></div>
            <div><p className="text-xs text-app-text-subtle">Provider</p><p className="mt-1 font-medium text-app-text">{segment.provider || 'Not added'}</p></div>
            <div><p className="text-xs text-app-text-subtle">Duration</p><p className="mt-1 font-medium text-app-text">{segment.duration || 'Not added'}</p></div>
            <div><p className="text-xs text-app-text-subtle">Booking</p>{bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-medium text-primary-700">Open reservation <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="mt-1 font-medium text-app-text">Not added</p>}</div>
          </div>
          {segment.notes && <div className="mt-4 border-t border-app-border-muted pt-4"><p className="text-xs text-app-text-subtle">Notes</p><p className="mt-1 text-sm text-app-text-muted">{segment.notes}</p></div>}
          {missing.length > 0 && <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p><span className="font-semibold">Still needed:</span> {missing.join(', ')}</p></div>}
        </div>
      )}
    </Card>
  );
};

const StayBookingCard = ({ hotel, onEdit, onDelete }: { hotel: Hotel; onEdit: (hotel: Hotel) => void; onDelete: (hotel: Hotel) => void }) => {
  const [expanded, setExpanded] = useState(true);
  const bookingUrl = getSafeExternalUrl(hotel.bookingUrl ?? hotel.locationRef?.websiteUri);
  const nights = nightsBetween(hotel.checkIn, hotel.checkOut);
  const complete = Boolean(hotel.checkIn && hotel.checkOut && hotel.confirmationCode);

  return (
    <Card hover={false} className="overflow-hidden p-0">
      <div className="border-l-4 border-primary-500">
      <div className="flex items-center justify-between gap-4 border-b border-app-border-muted px-4 py-3 sm:px-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-eyebrow text-app-text-subtle">{formatDate(hotel.checkIn)} – {formatDate(hotel.checkOut)}{nights ? ` · ${nights} nights` : ''}</p><p className="mt-0.5 font-semibold text-app-text-strong">Stay in {hotel.neighborhood || hotel.locationRef?.name || 'your destination'}</p></div>
        <div className="text-right"><p className="text-[11px] text-app-text-subtle">Stay total</p><p className="font-semibold text-app-text-strong">{formatCurrency(hotel.totalCost, 'USD') || 'Not added'}</p></div>
      </div>
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        {hotel.image ? (
          <img src={hotel.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700"><BedDouble className="h-6 w-6" /></span>
        )}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700">Hotel</p><BookingStatus complete={complete} />{hotel.rating > 0 && <span className="text-xs font-medium text-app-text-muted">★ {hotel.rating.toFixed(1)}</span>}</div><p className="mt-2 text-lg font-semibold text-app-text-strong">{hotel.name}</p><p className="mt-1 flex items-start gap-1.5 text-sm text-app-text-muted"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hotel.locationRef?.formattedAddress || hotel.neighborhood || 'Location not added'}</p>{hotel.amenities.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{hotel.amenities.slice(0, 4).map((amenity) => <span key={amenity} className="rounded-full bg-app-surface-muted px-2 py-1 text-[11px] font-medium text-app-text-muted">{amenity}</span>)}</div>}</div>
        <div className="flex shrink-0 items-start gap-1">
          <button type="button" onClick={() => onEdit(hotel)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Edit stay"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(hotel)} className="rounded-lg p-2 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label="Delete stay"><Trash2 className="h-4 w-4" /></button>
          {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Open hotel booking"><ExternalLink className="h-4 w-4" /></a>}
          <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={expanded ? 'Collapse stay details' : 'Expand stay details'}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
        </div>
      </div></div>
      {expanded && <div className="border-t border-app-border-muted bg-app-surface-subtle px-5 py-4"><div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><p className="text-xs text-app-text-subtle">Check-in</p><p className="mt-1 font-medium text-app-text">{formatDate(hotel.checkIn)}</p></div>
        <div><p className="text-xs text-app-text-subtle">Check-out</p><p className="mt-1 font-medium text-app-text">{formatDate(hotel.checkOut)}</p></div>
        <div><p className="text-xs text-app-text-subtle">Confirmation</p><p className="mt-1 font-medium text-app-text">{hotel.confirmationCode || 'Not added'}</p></div>
        <div><p className="text-xs text-app-text-subtle">Rate</p><p className="mt-1 font-medium text-app-text">{hotel.pricePerNight ? `${formatCurrency(hotel.pricePerNight, 'USD')} / night` : 'Not added'}</p></div>
      </div>{hotel.description && <div className="mt-4 border-t border-app-border-muted pt-4"><p className="text-xs text-app-text-subtle">About this stay</p><p className="mt-1 text-sm leading-6 text-app-text-muted">{hotel.description}</p></div>}{!complete && <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p><span className="font-semibold">Still needed:</span> {[!hotel.checkIn && 'Check-in', !hotel.checkOut && 'Check-out', !hotel.confirmationCode && 'Confirmation'].filter(Boolean).join(', ')}</p></div>}</div>}
    </Card>
  );
};

const Bookings: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const data = useTripData(tripId);
  const [segments, setSegments] = useState<TransportSegment[]>([]);
  const [stays, setStays] = useState<Hotel[]>([]);
  const [bookingKind, setBookingKind] = useState<'transport' | 'stay' | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingStayId, setEditingStayId] = useState<string | null>(null);
  const [transportDraft, setTransportDraft] = useState<PlanTransportDraft>(emptyTransportDraft);
  const [stayDraft, setStayDraft] = useState<PlanStayDraft>(emptyStayDraft);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'transport'; item: TransportSegment } | { kind: 'stay'; item: Hotel } | null>(null);

  useEffect(() => {
    if (!data.trip) return;
    const trip = data.trip;
    setSegments(loadTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, trip.id, trip.transportSegments));
    const planHotels = loadTripScopedValue<Hotel[]>(LOCAL_PLAN_HOTELS_KEY, trip.id, []);
    const hotels = [...data.hotels, ...planHotels].filter((hotel, index, all) => all.findIndex((candidate) => candidate.id === hotel.id) === index);
    const selectedIds = new Set(loadTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, trip.id, hotels.filter((hotel) => hotel.isSelected).map((hotel) => hotel.id)));
    setStays(hotels.filter((hotel) => selectedIds.has(hotel.id) || planHotels.some((candidate) => candidate.id === hotel.id)));
  }, [data.hotels, data.trip]);

  const openAddTransport = () => { setEditingTransportId(null); setEditingStayId(null); setTransportDraft(emptyTransportDraft()); setBookingError(null); setBookingKind('transport'); };
  const openAddStay = () => { setEditingStayId(null); setEditingTransportId(null); setStayDraft({ ...emptyStayDraft(), stopId: data.orderedStops[0]?.id || '' }); setBookingError(null); setBookingKind('stay'); };
  const editTransport = (segment: TransportSegment) => { setEditingTransportId(segment.id); setEditingStayId(null); setTransportDraft({ mode: segment.mode, role: segment.role || 'between-stops', provider: segment.provider || '', from: segment.fromLocation || makeManualLocationRef(segment.departureLocation), to: segment.toLocation || makeManualLocationRef(segment.arrivalLocation), departure: segment.departureDateTime?.slice(0, 16) || '', arrival: segment.arrivalDateTime?.slice(0, 16) || '', price: typeof segment.price === 'number' ? String(segment.price) : '', confirmationCode: segment.confirmationCode || '', fromStopId: segment.fromStopId || '', toStopId: segment.toStopId || '', bookingUrl: segment.bookingUrl || '', notes: segment.notes || '', isPrimary: Boolean(segment.isPrimary) }); setBookingError(null); setBookingKind('transport'); };
  const editStay = (hotel: Hotel) => { setEditingStayId(hotel.id); setEditingTransportId(null); setStayDraft({ location: hotel.locationRef || makeManualLocationRef(hotel.name), stopId: hotel.stopId || data.orderedStops[0]?.id || '', checkIn: hotel.checkIn || '', checkOut: hotel.checkOut || '', pricePerNight: hotel.pricePerNight ? String(hotel.pricePerNight) : '', totalCost: hotel.totalCost ? String(hotel.totalCost) : '', confirmationCode: hotel.confirmationCode || '', bookingUrl: hotel.bookingUrl || '', notes: hotel.description || '' }); setBookingError(null); setBookingKind('stay'); };

  const saveBooking = () => {
    if (!data.trip || !bookingKind) return;
    setIsSaving(true);
    try {
      if (bookingKind === 'transport') {
        if (!transportDraft.from || !transportDraft.to || !transportDraft.departure || !transportDraft.arrival) { setBookingError('Add the route, departure, and arrival before saving.'); return; }
        const segment: TransportSegment = { id: editingTransportId || `transport-${data.trip.id}-${Date.now()}`, tripId: data.trip.id, mode: transportDraft.mode, role: transportDraft.role, isPrimary: transportDraft.isPrimary, provider: transportDraft.provider.trim() || undefined, fromLocation: transportDraft.from, toLocation: transportDraft.to, departureLocation: transportDraft.from.formattedAddress || transportDraft.from.name, arrivalLocation: transportDraft.to.formattedAddress || transportDraft.to.name, departureDateTime: transportDraft.departure, arrivalDateTime: transportDraft.arrival, duration: calculateDuration(transportDraft.departure, transportDraft.arrival), price: transportDraft.price ? Number(transportDraft.price) : undefined, currency: data.trip.budgetCurrency || 'USD', confirmationCode: transportDraft.confirmationCode.trim() || undefined, bookingUrl: transportDraft.bookingUrl.trim() || undefined, notes: transportDraft.notes.trim() || undefined, fromStopId: transportDraft.fromStopId || undefined, toStopId: transportDraft.toStopId || undefined };
        const next = editingTransportId ? segments.map((item) => item.id === editingTransportId ? segment : item) : [...segments, segment];
        setSegments(next); persistTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, data.trip.id, next);
      } else {
        if (!stayDraft.location || !stayDraft.stopId || !stayDraft.checkIn || !stayDraft.checkOut) { setBookingError('Choose a stay, destination, check-in, and check-out before saving.'); return; }
        if (stayDraft.checkOut <= stayDraft.checkIn) { setBookingError('Check-out must be after check-in.'); return; }
        const existing = editingStayId ? stays.find((item) => item.id === editingStayId) : undefined;
        const base = mapLocationRefToHotel(data.trip.id, stayDraft.stopId, stayDraft.location);
        const hotel: Hotel = { ...base, ...existing, id: existing?.id || base.id, name: stayDraft.location.displayName || stayDraft.location.name, locationRef: stayDraft.location, stopId: stayDraft.stopId, checkIn: stayDraft.checkIn, checkOut: stayDraft.checkOut, pricePerNight: Number(stayDraft.pricePerNight) || 0, totalCost: Number(stayDraft.totalCost) || 0, confirmationCode: stayDraft.confirmationCode.trim() || undefined, bookingUrl: stayDraft.bookingUrl.trim() || undefined, description: stayDraft.notes.trim(), isSelected: true };
        const next = editingStayId ? stays.map((item) => item.id === editingStayId ? hotel : item) : [...stays, hotel];
        setStays(next); persistTripScopedValue(LOCAL_PLAN_HOTELS_KEY, data.trip.id, next); persistTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, data.trip.id, next.map((item) => item.id));
      }
      setBookingKind(null); setEditingTransportId(null); setEditingStayId(null); setBookingError(null);
    } finally { setIsSaving(false); }
  };

  const confirmDelete = () => {
    if (!data.trip || !deleteTarget) return;
    if (deleteTarget.kind === 'transport') {
      const next = segments.filter((item) => item.id !== deleteTarget.item.id);
      setSegments(next);
      persistTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, data.trip.id, next);
    } else {
      const next = stays.filter((item) => item.id !== deleteTarget.item.id);
      setStays(next);
      persistTripScopedValue(LOCAL_PLAN_HOTELS_KEY, data.trip.id, next);
      persistTripScopedValue(LOCAL_SELECTED_HOTELS_KEY, data.trip.id, next.map((item) => item.id));
    }
    setDeleteTarget(null);
  };

  const sortedSegments = useMemo(() => sortSegmentsByTime(segments), [segments]);
  const transportTotal = segments.reduce((sum, segment) => sum + (segment.price ?? 0), 0);
  const staysTotal = stays.reduce((sum, hotel) => sum + (hotel.totalCost ?? 0), 0);
  const needsAttention = segments.filter((segment) => getMissingDetails(segment).length > 0 || !segment.confirmationCode).length + stays.filter((hotel) => !hotel.checkIn || !hotel.checkOut || !hotel.confirmationCode).length;

  if (data.isLoading) return <InlineNotice variant="loading">Loading bookings...</InlineNotice>;
  if (!data.trip) return <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="Trip not found" description="We could not find bookings for this trip." />;

  const total = transportTotal + staysTotal;
  const currency = data.trip.budgetCurrency || 'USD';

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700">{formatDate(data.trip.startDate)} – {formatDate(data.trip.endDate)}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">Bookings</h1>
          <p className="mt-1 text-sm text-app-text-muted">Transportation and stays for {data.tripName}, together in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openAddTransport}><Plane className="mr-1.5 h-4 w-4" />Add transport</Button>
          <Button size="sm" onClick={openAddStay}><Plus className="mr-1.5 h-4 w-4" />Add stay</Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover={false} className="p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><CalendarDays className="h-5 w-5" /></span><div><p className="text-xs text-app-text-muted">Trip length</p><p className="font-semibold text-app-text-strong">{data.tripLengthDays} days</p></div></div></Card>
        <Card hover={false} className="p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Users className="h-5 w-5" /></span><div><p className="text-xs text-app-text-muted">Travelers</p><p className="font-semibold text-app-text-strong">{data.trip.travelers}</p></div></div></Card>
        <Card hover={false} className="p-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${needsAttention ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700'}`}>{needsAttention ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span><div><p className="text-xs text-app-text-muted">Booking health</p><p className="font-semibold text-app-text-strong">{needsAttention ? `${needsAttention} need attention` : 'All set'}</p></div></div></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold text-app-text-strong">Transportation</h2><p className="text-sm text-app-text-muted">Every major leg and transfer, in departure order.</p></div><span className="text-sm font-medium text-app-text-muted">{segments.length} leg{segments.length === 1 ? '' : 's'}</span></div>
            {sortedSegments.length ? sortedSegments.map((segment) => <TransportBookingCard key={segment.id} segment={segment} onEdit={editTransport} onDelete={(item) => setDeleteTarget({ kind: 'transport', item })} />) : <Card hover={false} className="border-dashed p-6"><div className="flex flex-col items-center text-center"><Plane className="h-6 w-6 text-app-text-subtle" /><p className="mt-2 font-medium text-app-text-strong">No transportation yet</p><p className="mt-1 text-sm text-app-text-muted">Add your first flight, train, drive, or transfer.</p><Button className="mt-3" size="sm" variant="outline" onClick={openAddTransport}>Add transport</Button></div></Card>}
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold text-app-text-strong">Stays</h2><p className="text-sm text-app-text-muted">Your confirmed lodging for each destination.</p></div><span className="text-sm font-medium text-app-text-muted">{stays.length} stay{stays.length === 1 ? '' : 's'}</span></div>
            {stays.length ? stays.map((hotel) => <StayBookingCard key={hotel.id} hotel={hotel} onEdit={editStay} onDelete={(item) => setDeleteTarget({ kind: 'stay', item })} />) : <Card hover={false} className="border-dashed p-6"><div className="flex flex-col items-center text-center"><BedDouble className="h-6 w-6 text-app-text-subtle" /><p className="mt-2 font-medium text-app-text-strong">No stays yet</p><p className="mt-1 text-sm text-app-text-muted">Add lodging so every night has a home.</p><Button className="mt-3" size="sm" variant="outline" onClick={openAddStay}>Add stay</Button></div></Card>}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card hover={false} className="p-5">
            <div className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-primary-700" /><h2 className="font-semibold text-app-text-strong">Booking summary</h2></div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-app-text-muted">Transportation</span><span className="font-medium text-app-text">{formatCurrency(transportTotal, currency)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-app-text-muted">Stays</span><span className="font-medium text-app-text">{formatCurrency(staysTotal, currency)}</span></div>
              <div className="border-t border-app-border-muted pt-3"><div className="flex items-baseline justify-between gap-4"><span className="font-semibold text-app-text-strong">Total</span><span className="text-xl font-semibold text-app-text-strong">{formatCurrency(total, currency)}</span></div></div>
            </div>
            <Link to={`/trip/${data.trip.id}/budget`} className="mt-5 block"><Button variant="outline" size="sm" className="w-full">View full budget</Button></Link>
          </Card>
          {needsAttention > 0 && <Card hover={false} className="border-warning-300 p-4"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" /><div><p className="text-sm font-semibold text-app-text-strong">Finish your booking details</p><p className="mt-1 text-xs leading-5 text-app-text-muted">Add missing dates and confirmation codes so everything is ready when you travel.</p></div></div></Card>}
        </aside>
      </div>
      {bookingError && <p role="alert" className="text-sm text-error-600">{bookingError}</p>}
      <PlanBookingModal kind={bookingKind} transport={transportDraft} stay={stayDraft} stops={data.orderedStops} currency={data.trip.budgetCurrency} saving={isSaving} onTransportChange={setTransportDraft} onStayChange={setStayDraft} onClose={() => { if (!isSaving) setBookingKind(null); }} onSave={saveBooking} editing={Boolean(editingTransportId || editingStayId)} saveLabel="Add to bookings" />
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`Delete this ${deleteTarget?.kind === 'stay' ? 'stay' : 'transportation'}?`}
        description={`Are you sure you want to delete this ${deleteTarget?.kind === 'stay' ? 'stay' : 'transportation'}?`}
        size="sm"
        showCloseButton={false}
        overlayClassName="bg-black/35"
        className="mx-4 !w-[calc(100%_-_2rem)] !max-w-sm !rounded-2xl"
        bodyClassName="hidden"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>No, go back</Button><Button variant="danger" size="sm" onClick={confirmDelete}>Yes, delete</Button></div>}
      >
        <span />
      </Modal>
    </div>
  );
};

export default Bookings;
