import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin,
  Users,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  Lightbulb,
  Star,
} from 'lucide-react';
import LocationInput from '../components/ui/LocationInput';
import Button from '../components/ui/Button';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import TravelerPicker from '../components/ui/TravelerPicker';
import { DateRangePicker } from '../components/ui/DatePicker';
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
const BUDGET_CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
] as const;
const DEFAULT_BUDGET_CURRENCY: BudgetCurrency = 'USD';

interface StopForm {
  name: string;
  country: string;
  startDate: string;
  endDate: string;
  notes: string;
  locationRef: LocationRef | null;
}

type RouteMode = 'single' | 'multi';

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

const getRouteStepLabel = (index: number, stopCount: number) => {
  if (stopCount <= 1) return 'Destination';
  if (index === 0) return 'Start';
  if (index === stopCount - 1) return 'Final destination';
  return `Stop ${index + 1}`;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const isBudgetCurrency = (currency: string): currency is BudgetCurrency =>
  BUDGET_CURRENCIES.some((option) => option.code === currency);

const loadStoredCurrency = (tripId?: string): BudgetCurrency => {
  if (!tripId) return DEFAULT_BUDGET_CURRENCY;

  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUDGET_CURRENCIES_KEY) ?? '{}') as Record<string, string>;
    const currency = stored[tripId];
    return currency && isBudgetCurrency(currency)
      ? currency
      : DEFAULT_BUDGET_CURRENCY;
  } catch {
    return DEFAULT_BUDGET_CURRENCY;
  }
};

const persistStoredCurrency = (tripId: string, currency: BudgetCurrency) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUDGET_CURRENCIES_KEY) ?? '{}') as Record<string, string>;
    window.localStorage.setItem(
      LOCAL_BUDGET_CURRENCIES_KEY,
      JSON.stringify({ ...stored, [tripId]: currency })
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_BUDGET_CURRENCIES_KEY,
      JSON.stringify({ [tripId]: currency })
    );
  }
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
              <div>
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Route</h2>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="inline-grid rounded-full border border-neutral-200 bg-neutral-50 p-1 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={setSingleDestinationMode}
                        className={[
                          'rounded-full px-4 py-2 text-sm font-bold transition-all',
                          routeMode === 'single'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-900',
                        ].join(' ')}
                      >
                        One destination
                      </button>
                      <button
                        type="button"
                        onClick={setMultiStopMode}
                        className={[
                          'rounded-full px-4 py-2 text-sm font-bold transition-all',
                          routeMode === 'multi'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-900',
                        ].join(' ')}
                      >
                        Multi-stop
                      </button>
                    </div>
                    {routeMode === 'multi' ? (
                      <button
                        type="button"
                        onClick={addStop}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 underline underline-offset-4 transition-colors hover:text-primary-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Stop
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={setMultiStopMode}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 underline underline-offset-4 transition-colors hover:text-primary-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Stop
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {stops.map((stop, index) => (
                    <div
                      key={index}
                      className="group relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-300 hover:shadow-lg sm:p-8"
                    >
                      <div className="absolute -left-3 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-sm">
                        {index + 1}
                      </div>

                      {routeMode === 'multi' && stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="absolute right-4 top-4 rounded-full p-2 text-neutral-300 opacity-100 transition-colors hover:bg-error-50 hover:text-error-500 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Remove stop ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <div className="mb-5 flex flex-col gap-1 pr-10">
                        <p className="text-xs font-extrabold uppercase text-primary-700">
                          {getRouteStepLabel(index, stops.length)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <LocationInput
                            label="Location"
                            value={stop.locationRef}
                            onChange={(location) =>
                              updateStop(index, {
                                name: location?.name ?? '',
                                locationRef: location,
                              })
                            }
                            placeholder="Search destinations"
                            required
                            error={getStopFieldError(index, 'name')}
                          />
                        </div>

                        <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600">
                          <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
                            Country
                          </label>
                          <input
                            value={stop.country}
                            onChange={(event) => updateStop(index, { country: event.target.value })}
                            placeholder="Japan"
                            className="w-full rounded-xl border-0 bg-transparent px-3 pb-2 pt-6 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                          />
                        </div>

                        <DateRangePicker
                          startValue={stop.startDate}
                          endValue={stop.endDate}
                          onChange={(range) =>
                            updateStop(index, {
                              startDate: range.start,
                              endDate: range.end,
                            })
                          }
                          error={getStopFieldError(index, 'startDate') ?? getStopFieldError(index, 'endDate')}
                        />

                        <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600 md:col-span-2">
                          <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
                            Notes
                          </label>
                          <textarea
                            rows={3}
                            value={stop.notes}
                            onChange={(event) => updateStop(index, { notes: event.target.value })}
                            placeholder="Optional stop notes"
                            className="w-full resize-none rounded-xl border-0 bg-transparent px-3 pb-3 pt-7 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {routeMode === 'multi' && (
                    <button
                      type="button"
                      onClick={addStop}
                      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-400 transition-all hover:border-primary-600 hover:text-primary-600"
                    >
                      <MapPin className="mb-2 h-8 w-8" />
                      <span className="font-bold">Add another stop</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-bold text-neutral-900">Trip Details</h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <TravelerPicker
                    value={travelers}
                    onChange={setTravelers}
                  />

                  <div className="flex min-h-[64px] rounded-xl border border-neutral-200 bg-white shadow-sm transition-all focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-500">
                    <div className="flex w-20 shrink-0 items-center border-r border-neutral-200 px-1">
                      <Select
                        value={budgetCurrency}
                        onChange={(nextCurrency) => {
                          if (isBudgetCurrency(nextCurrency)) {
                            setBudgetCurrency(nextCurrency);
                          }
                        }}
                        aria-label="Budget currency"
                        options={BUDGET_CURRENCIES.map((currency) => ({
                          value: currency.code,
                          label: `${currency.code} ${currency.symbol}`,
                          selectedLabel: currency.symbol,
                        }))}
                        buttonClassName="border-0 bg-transparent px-3 py-2 text-lg shadow-none focus:ring-0"
                        dropdownClassName="right-auto w-36"
                      />
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
                        Budget
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={budget}
                        onChange={(event) => setBudget(event.target.value ? Number(event.target.value) : '')}
                        placeholder="5000"
                        className="w-full rounded-r-xl border-0 bg-transparent px-3 pb-2 pt-6 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-bold text-neutral-900">Trip Vibe</h3>
                <div className="flex flex-wrap gap-3">
                  {VIBE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVibe(vibe === option ? '' : option)}
                      className={[
                        'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
                        vibe === option
                          ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                          : 'border-neutral-200 text-neutral-700 hover:border-primary-600 hover:text-primary-700',
                      ].join(' ')}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

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

          <div>
            <div className="lg:sticky lg:top-24">
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Trip Preview
              </p>
              <div className="group">
                <div className="relative mb-4 overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
                  <ImagePlaceholder
                    src={PREVIEW_IMAGE}
                    alt="Trip preview"
                    aspectRatio="video"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-tight text-neutral-900 backdrop-blur-sm">
                      {existingTrip?.status ?? 'Planning'}
                    </span>
                  </div>
                </div>

                <div className="mb-1 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold leading-tight text-neutral-900">
                    {tripTitle || 'Your Trip'}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-800">
                    <Star className="h-4 w-4 fill-primary-600 text-primary-600" />
                    <span className="font-bold">{vibe ? '4.9' : '--'}</span>
                    <span className="text-neutral-500">(vibe)</span>
                  </div>
                </div>

                <p className="text-[15px] text-neutral-500">
                  {routeLabel || 'Add at least one stop'}
                </p>
                <p className="text-[15px] text-neutral-500">
                  {dateDisplay || 'Select stop dates'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <p className="font-bold text-neutral-900">{formattedBudget || 'Set budget'}</p>
                  <p className="text-[15px] text-neutral-500">total budget</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {travelers} traveler{travelers !== 1 ? 's' : ''}
                  </span>
                  {vibe && <Badge variant="default">{vibe}</Badge>}
                </div>

                {(notesPreview || validStops.some((stop) => stop.notes.trim())) && (
                  <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-xs italic leading-relaxed text-neutral-500">
                      <FileText className="mr-1 inline h-3.5 w-3.5" />
                      "
                      {notesPreview ||
                        validStops.find((stop) => stop.notes.trim())?.notes}
                      "
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">Planning Tip</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      Add dates to each stop first. Hotels, budget, and map views become much easier to review once the route is anchored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
