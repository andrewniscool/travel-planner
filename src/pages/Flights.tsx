import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plane,
  Train,
  Car,
  Plus,
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
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import {
  buildDateTime,
  calculateDuration,
  getLocationName,
  getMissingDetails,
  isTransferSegment,
  makeManualLocationRef,
  matchesTravelFilter,
  sortSegmentsByTime,
  splitDateTime,
  type TravelFilter,
} from '../utils/transportSegments';
import type { LocationRef, TransportSegment } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import TransportCard from '../components/flights/TransportCard';
import TravelSegmentForm, {
  type SegmentFormState,
} from '../components/flights/TravelSegmentForm';
import TravelSummaryCard from '../components/flights/TravelSummaryCard';
import TravelFilterTabs from '../components/flights/TravelFilterTabs';

const LOCAL_TRAVEL_SEGMENTS_KEY = 'travel-builder:travel-segments';

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

const persistGoogleLocation = async (
  userId: string,
  location?: LocationRef,
): Promise<LocationRef | undefined> => {
  if (!location || location.source !== 'google') return location;

  const row = await locationRefService.upsertGoogleLocationRef(userId, location);
  return mapLocationRefRowToLocationRef(row);
};

const loadStoredSegments = (tripId: string, fallbackSegments: TransportSegment[]) => {
  return loadTripScopedValue(
    LOCAL_TRAVEL_SEGMENTS_KEY,
    tripId,
    fallbackSegments,
  );
};

const persistStoredSegments = (tripId: string, segments: TransportSegment[]) => {
  persistTripScopedValue(LOCAL_TRAVEL_SEGMENTS_KEY, tripId, segments);
};

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

      <TravelSummaryCard
        orderedStops={orderedStops}
        tripDisplayName={getTripDisplayName(trip)}
        stats={travelStats}
      />

      <TravelFilterTabs
        options={filterOptions}
        activeFilter={activeFilter}
        onChange={setActiveFilter}
      />

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
