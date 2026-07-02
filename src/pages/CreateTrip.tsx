import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import RouteBuilder from '../components/create-trip/RouteBuilder';
import {
  getRouteStepLabel,
  type RouteMode,
  type StopForm,
} from '../components/create-trip/createTripDisplay';
import TripDetailsSection from '../components/create-trip/TripDetailsSection';
import TripPreviewSidebar from '../components/create-trip/TripPreviewSidebar';
import TripVibeSelector from '../components/create-trip/TripVibeSelector';
import { LOCAL_TRIPS_STORAGE_KEY } from '../data/trips';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTripFromStorageOrMock } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  locationRefService,
  tripService,
} from '../services/travelDataService';
import {
  mapLocationRefRowToLocationRef,
  mapTripWithRelationsToTrip,
} from '../services/tripMappers';
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import {
  DEFAULT_BUDGET_CURRENCY,
  isBudgetCurrency,
} from '../utils/budget';
import type {
  BudgetCurrency,
  LocationRef,
  Trip,
  TripStop,
  TripVibe,
} from '../types';

const VIBE_OPTIONS: TripVibe[] = [
  'Relaxing',
  'Adventure',
  'Food-focused',
  'Romantic',
  'Family',
  'Budget-friendly',
  'Luxury',
  'Cultural',
];

const PREVIEW_IMAGE =
  'https://images.pexels.com/photos/317855/pexels-photo-317855.jpeg?auto=compress&cs=tinysrgb&w=800';
const LOCAL_BUDGET_CURRENCIES_KEY = 'travel-builder:budget-currencies';

const emptyStop = (): StopForm => ({
  name: '',
  country: '',
  startDate: '',
  endDate: '',
  notes: '',
  locationRef: null,
});

const makeManualStopLocation = (name: string): LocationRef | null => {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  return {
    id: `manual-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'location'}`,
    name: trimmedName,
    source: 'manual',
  };
};

const getStopFormLocationRef = (stop: TripStop) =>
  stop.locationRef ?? makeManualStopLocation(stop.name);

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const loadStoredCurrency = (tripId?: string): BudgetCurrency => {
  if (!tripId) return DEFAULT_BUDGET_CURRENCY;

  const currency = loadTripScopedValue<string | undefined>(
    LOCAL_BUDGET_CURRENCIES_KEY,
    tripId,
    undefined,
  );
  return currency && isBudgetCurrency(currency)
    ? currency
    : DEFAULT_BUDGET_CURRENCY;
};

const persistStoredCurrency = (tripId: string, currency: BudgetCurrency) => {
  persistTripScopedValue(LOCAL_BUDGET_CURRENCIES_KEY, tripId, currency);
};

const persistTripStopLocationRefs = async (
  userId: string,
  trip: Trip,
): Promise<Trip> => {
  const stops = await Promise.all(
    trip.stops.map(async (stop) => {
      if (!stop.locationRef?.googlePlaceId) return stop;

      const row = await locationRefService.upsertGoogleLocationRef(
        userId,
        stop.locationRef,
      );
      const locationRef = mapLocationRefRowToLocationRef(row);

      return {
        ...stop,
        name: locationRef.name,
        latitude: locationRef.latitude ?? stop.latitude,
        longitude: locationRef.longitude ?? stop.longitude,
        locationRef,
      };
    }),
  );

  return {
    ...trip,
    stops,
    destination: stops.length === 1 ? stops[0].name : trip.title,
    country: stops[0]?.country ?? trip.country,
  };
};

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const [, setLocalTrips] = useLocalStorage<Trip[]>(
    LOCAL_TRIPS_STORAGE_KEY,
    [],
  );
  const fallbackExistingTrip = useMemo(
    () => (tripId ? getTripFromStorageOrMock(tripId) : undefined),
    [tripId],
  );
  const {
    trip: serviceExistingTrip,
    isLoading: isLoadingServiceTrip,
    error: serviceTripError,
    source: serviceTripSource,
  } = useServiceTrip(tripId);
  const existingTrip = serviceExistingTrip ?? fallbackExistingTrip;
  const isEditing = Boolean(tripId);
  const initialRouteMode: RouteMode =
    existingTrip && existingTrip.stops.length > 1 ? 'multi' : 'single';

  const [title, setTitle] = useState(existingTrip?.title ?? '');
  const [stops, setStops] = useState<StopForm[]>(
    existingTrip?.stops.length
      ? [...existingTrip.stops]
          .sort((a, b) => a.order - b.order)
          .map((stop) => ({
            name: stop.name,
            country: stop.country ?? '',
            startDate: stop.startDate,
            endDate: stop.endDate,
            notes: stop.notes ?? '',
            locationRef: getStopFormLocationRef(stop),
          }))
      : [emptyStop()]
  );
  const [routeMode, setRouteMode] = useState<RouteMode>(initialRouteMode);
  const [travelers, setTravelers] = useState(existingTrip?.travelers ?? 1);
  const [budget, setBudget] = useState<number | ''>(existingTrip?.budget ?? '');
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>(
    () => {
      const persistedCurrency = existingTrip?.budgetCurrency;
      return persistedCurrency && isBudgetCurrency(persistedCurrency)
        ? persistedCurrency
        : loadStoredCurrency(existingTrip?.id);
    }
  );
  const [vibe, setVibe] = useState<TripVibe | ''>(existingTrip?.vibe ?? '');
  const [notes, setNotes] = useState(existingTrip?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [hydratedTripId, setHydratedTripId] = useState(existingTrip?.id ?? null);

  useEffect(() => {
    if (!existingTrip || hydratedTripId === existingTrip.id) return;

    const orderedStops = [...existingTrip.stops].sort(
      (a, b) => a.order - b.order,
    );

    setTitle(existingTrip.title);
    setStops(
      orderedStops.length
        ? orderedStops.map((stop) => ({
            name: stop.name,
            country: stop.country ?? '',
            startDate: stop.startDate,
            endDate: stop.endDate,
            notes: stop.notes ?? '',
            locationRef: getStopFormLocationRef(stop),
          }))
        : [emptyStop()],
    );
    setRouteMode(orderedStops.length > 1 ? 'multi' : 'single');
    setTravelers(existingTrip.travelers);
    setBudget(existingTrip.budget || '');
    setBudgetCurrency(existingTrip.budgetCurrency ?? loadStoredCurrency(existingTrip.id));
    setVibe(existingTrip.vibe);
    setNotes(existingTrip.notes);
    setHydratedTripId(existingTrip.id);
  }, [existingTrip, hydratedTripId]);

  const validStops = useMemo(
    () => stops.filter((stop) => stop.name.trim()),
    [stops]
  );
  const firstStop = validStops[0];
  const lastStop = validStops[validStops.length - 1];
  const tripTitle = title.trim() || (validStops.length > 1 ? `${firstStop?.name ?? 'New'} Trip` : firstStop?.name ?? '');
  const routeLabel = validStops.map((stop) => stop.name.trim()).join(' → ');
  const startDate = firstStop?.startDate || '';
  const endDate = lastStop?.endDate || firstStop?.endDate || '';
  const dateDisplay = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : startDate ? formatDate(startDate) : '';
  const notesPreview = notes.length > 100 ? `${notes.slice(0, 100)}...` : notes;
  const formattedBudget = budget
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: budgetCurrency,
        maximumFractionDigits: budgetCurrency === 'JPY' ? 0 : 0,
      }).format(budget)
    : '';

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (!tripTitle.trim()) {
      messages.push('Trip title is required.');
    }

    if (validStops.length === 0) {
      messages.push('Destination is required.');
    }

    stops.forEach((stop, index) => {
      const hasAnyStopDetails = Boolean(
        stop.name.trim() ||
          stop.country.trim() ||
          stop.startDate ||
          stop.endDate ||
          stop.notes.trim(),
      );

      if (!hasAnyStopDetails && stops.length > 1) return;

      if (!stop.name.trim()) {
        messages.push(`${getRouteStepLabel(index, stops.length)} is required.`);
      }

      if (stop.name.trim() && !stop.startDate) {
        messages.push(`${getRouteStepLabel(index, stops.length)} start date is required.`);
      }

      if (stop.name.trim() && !stop.endDate) {
        messages.push(`${getRouteStepLabel(index, stops.length)} end date is required.`);
      }
    });

    return [...new Set(messages)];
  }, [stops, tripTitle, validStops.length]);

  const shouldShowValidation = submitAttempted && validationMessages.length > 0;

  const getStopFieldError = (
    index: number,
    field: 'name' | 'startDate' | 'endDate',
  ) => {
    if (!submitAttempted) return undefined;

    const stop = stops[index];
    if (!stop) return undefined;

    const hasAnyStopDetails = Boolean(
      stop.name.trim() ||
        stop.country.trim() ||
        stop.startDate ||
        stop.endDate ||
        stop.notes.trim(),
    );

    if (!hasAnyStopDetails && stops.length > 1) return undefined;

    if (field === 'name' && !stop.name.trim()) {
      return 'City / destination is required.';
    }

    if (field === 'startDate' && stop.name.trim() && !stop.startDate) {
      return 'Start date is required.';
    }

    if (field === 'endDate' && stop.name.trim() && !stop.endDate) {
      return 'End date is required.';
    }

    return undefined;
  };

  const updateStop = (index: number, patch: Partial<StopForm>) => {
    setStops((current) =>
      current.map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop)
    );
  };

  const setSingleDestinationMode = () => {
    setRouteMode('single');
    setStops((current) => [current[0] ?? emptyStop()]);
  };

  const setMultiStopMode = () => {
    setRouteMode('multi');
    setStops((current) =>
      current.length > 1 ? current : [...current, emptyStop()],
    );
  };

  const addStop = () => {
    setRouteMode('multi');
    setStops((current) => [...current, emptyStop()]);
  };

  const removeStop = (index: number) => {
    setStops((current) => {
      if (current.length === 1) return current;
      const nextStops = current.filter((_, stopIndex) => stopIndex !== index);
      if (nextStops.length <= 1) {
        setRouteMode('single');
      }
      return nextStops.length ? nextStops : [emptyStop()];
    });
  };

  const buildTrip = (): Trip | undefined => {
    if (validationMessages.length > 0 || !tripTitle) {
      return undefined;
    }
    const selectedVibe = vibe || 'Relaxing';
    const nextTripId = existingTrip?.id ?? `local-trip-${Date.now()}`;
    const previousStops = existingTrip
      ? [...existingTrip.stops].sort((a, b) => a.order - b.order)
      : [];
    const tripStops: TripStop[] = validStops.map((stop, index) => ({
      id: previousStops[index]?.id ?? `stop-${nextTripId}-${index + 1}`,
      tripId: nextTripId,
      name: stop.name.trim(),
      country: stop.country.trim() || undefined,
      startDate: stop.startDate || startDate,
      endDate: stop.endDate || stop.startDate || endDate,
      order: index + 1,
      notes: stop.notes.trim() || undefined,
      locationRef: stop.locationRef ?? undefined,
      latitude: stop.locationRef?.latitude,
      longitude: stop.locationRef?.longitude,
    }));

    return {
      id: nextTripId,
      title: tripTitle,
      destination: tripStops.length === 1 ? tripStops[0].name : tripTitle,
      country: tripStops[0].country ?? '',
      startDate,
      endDate,
      travelers,
      budget: budget || 0,
      budgetCurrency,
      vibe: selectedVibe,
      status: existingTrip?.status ?? 'planning',
      notes,
      image: existingTrip?.image ?? PREVIEW_IMAGE,
      planningProgress: existingTrip?.planningProgress ?? 0,
      stops: tripStops,
      transportSegments: existingTrip?.transportSegments ?? [],
    };
  };

  const saveTripLocally = (trip: Trip) => {
    setLocalTrips((current) => {
      const idsToReplace = new Set(
        [existingTrip?.id, trip.id].filter(Boolean) as string[],
      );
      const nextTrips = [
        ...current.filter((currentTrip) => !idsToReplace.has(currentTrip.id)),
        trip,
      ];

      try {
        window.localStorage.setItem(
          LOCAL_TRIPS_STORAGE_KEY,
          JSON.stringify(nextTrips),
        );
      } catch {
        // The hook still holds the in-memory fallback if localStorage is unavailable.
      }

      return nextTrips;
    });
  };

  const saveTrip = async () => {
    setSubmitAttempted(true);
    const trip = buildTrip();
    if (!trip) {
      setSaveError(
        validationMessages.length > 0
          ? null
          : 'Please complete the required trip details.',
      );
      setSaveMessage(null);
      return undefined;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const userId = await getAuthenticatedUserId();
      const shouldSaveToSupabase =
        Boolean(userId) && (!isEditing || serviceTripSource === 'supabase');

      if (userId && shouldSaveToSupabase) {
        const tripWithPersistedLocations = await persistTripStopLocationRefs(
          userId,
          trip,
        );
        const savedRow =
          isEditing && serviceExistingTrip
            ? await tripService.updateTripWithStops(tripWithPersistedLocations)
            : await tripService.createTripWithStops(
                userId,
                tripWithPersistedLocations,
              );
        const savedTrip = mapTripWithRelationsToTrip(
          savedRow,
          tripWithPersistedLocations,
        );

        saveTripLocally(savedTrip);
        persistStoredCurrency(savedTrip.id, budgetCurrency);
        setSaveMessage('Saved to Supabase.');
        setSaveError(null);
        return savedTrip;
      }

      // Temporary until auth is wired: unauthenticated or local/mock edits stay in localStorage.
      saveTripLocally(trip);
      persistStoredCurrency(trip.id, budgetCurrency);
      setSaveMessage(
        userId
          ? 'Saved locally because this trip is not in Supabase yet.'
          : 'Saved locally. Sign-in is not connected yet.',
      );
      setSaveError(null);
      return trip;
    } catch (error) {
      saveTripLocally(trip);
      persistStoredCurrency(trip.id, budgetCurrency);
      const message =
        error instanceof Error ? error.message : 'Unknown Supabase save error.';
      setSaveMessage(null);
      setSaveError(`Supabase save failed: ${message}. Saved locally instead.`);
      return trip;
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    const trip = await saveTrip();
    if (trip) navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="-m-4 min-h-full bg-white animate-fade-in sm:-m-6 lg:-m-8">
      <div className="mx-auto max-w-[96rem] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        {serviceTripError && (
          <div className="mb-8 rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            Supabase trip data could not be loaded. Editing local trip data instead.
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,28rem)] lg:gap-12">
          <div>
            <div className="mb-10 rounded-3xl bg-neutral-50 px-5 py-6 sm:px-7">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={isEditing ? 'Trip title' : 'Trip Title'}
                className="w-full border-0 bg-transparent p-0 text-4xl font-extrabold tracking-normal text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0 md:text-5xl"
              />
              <p className="mt-4 text-lg text-neutral-500">
                {isEditing
                  ? isLoadingServiceTrip && !existingTrip
                    ? 'Loading your trip details'
                    : 'Update your trip details'
                  : 'Start planning your next adventure'}
              </p>
              {submitAttempted && !tripTitle && (
                <p className="mt-2 text-sm text-error-500">Trip title is required.</p>
              )}
            </div>

            <section className="space-y-10">
              <RouteBuilder
                stops={stops}
                routeMode={routeMode}
                onSetSingleDestinationMode={setSingleDestinationMode}
                onSetMultiStopMode={setMultiStopMode}
                onAddStop={addStop}
                onRemoveStop={removeStop}
                onUpdateStop={updateStop}
                getStopFieldError={getStopFieldError}
              />

              <TripDetailsSection
                travelers={travelers}
                budget={budget}
                budgetCurrency={budgetCurrency}
                onTravelersChange={setTravelers}
                onBudgetChange={setBudget}
                onBudgetCurrencyChange={setBudgetCurrency}
              />

              <TripVibeSelector
                options={VIBE_OPTIONS}
                value={vibe}
                onChange={setVibe}
              />

              <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600">
                <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
                  General Plans
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tell us more about your vision for this trip..."
                  className="w-full resize-none rounded-xl border-0 bg-transparent px-3 pb-3 pt-7 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                />
              </div>

              {shouldShowValidation && (
                <div className="rounded-xl border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-600">
                  <p className="font-medium">Please complete the required fields:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {validationMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-sm font-bold text-neutral-700 underline underline-offset-4 transition-colors hover:text-neutral-500"
                >
                  Cancel
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {saveMessage && (
                    <span className="text-sm text-neutral-500">{saveMessage}</span>
                  )}
                  {saveError && (
                    <span className="max-w-md text-sm text-error-500">{saveError}</span>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContinue}
                    disabled={isSaving}
                    className="gap-2 px-8 shadow-lg shadow-primary-600/20 active:scale-[0.98]"
                  >
                    {isSaving
                      ? 'Saving...'
                      : isEditing
                        ? 'Save Changes'
                        : 'Save Trip'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <TripPreviewSidebar
            previewImage={PREVIEW_IMAGE}
            status={existingTrip?.status}
            tripTitle={tripTitle}
            routeLabel={routeLabel}
            dateDisplay={dateDisplay}
            formattedBudget={formattedBudget}
            travelers={travelers}
            vibe={vibe}
            notesPreview={notesPreview}
            validStops={validStops}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
