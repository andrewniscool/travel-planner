import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, FileText, ArrowRight, Plus, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import Badge from '../components/ui/Badge';
import { LOCAL_TRIPS_STORAGE_KEY } from '../data/trips';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTripFromStorageOrMock } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  getAuthenticatedUserId,
  tripService,
} from '../services/travelDataService';
import { mapTripWithRelationsToTrip } from '../services/tripMappers';
import type { Trip, TripStop, TripVibe } from '../types';

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

interface StopForm {
  name: string;
  country: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const emptyStop = (): StopForm => ({
  name: '',
  country: '',
  startDate: '',
  endDate: '',
  notes: '',
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
          }))
      : [emptyStop()]
  );
  const [travelers, setTravelers] = useState(existingTrip?.travelers ?? 1);
  const [budget, setBudget] = useState<number | ''>(existingTrip?.budget ?? '');
  const [vibe, setVibe] = useState<TripVibe | ''>(existingTrip?.vibe ?? '');
  const [notes, setNotes] = useState(existingTrip?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
          }))
        : [emptyStop()],
    );
    setTravelers(existingTrip.travelers);
    setBudget(existingTrip.budget || '');
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

  const updateStop = (index: number, patch: Partial<StopForm>) => {
    setStops((current) =>
      current.map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop)
    );
  };

  const addStop = () => setStops((current) => [...current, emptyStop()]);

  const removeStop = (index: number) => {
    setStops((current) => current.length === 1 ? current : current.filter((_, stopIndex) => stopIndex !== index));
  };

  const buildTrip = (): Trip | undefined => {
    if (!tripTitle || validStops.length === 0 || !startDate || !endDate || !vibe) {
      return undefined;
    }
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
      vibe,
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
    const trip = buildTrip();
    if (!trip) {
      setSaveError('Add at least one stop with dates and choose a trip vibe.');
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
        const savedRow =
          isEditing && serviceExistingTrip
            ? await tripService.updateTripWithStops(trip)
            : await tripService.createTripWithStops(userId, trip);
        const savedTrip = mapTripWithRelationsToTrip(savedRow, trip);

        saveTripLocally(savedTrip);
        setSaved(true);
        setSaveMessage('Saved to Supabase.');
        setSaveError(null);
        return savedTrip;
      }

      // Temporary until auth is wired: unauthenticated or local/mock edits stay in localStorage.
      saveTripLocally(trip);
      setSaved(true);
      setSaveMessage(
        userId
          ? 'Saved locally because this trip is not in Supabase yet.'
          : 'Saved locally. Sign-in is not connected yet.',
      );
      setSaveError(null);
      return trip;
    } catch (error) {
      saveTripLocally(trip);
      setSaved(true);
      const message =
        error instanceof Error ? error.message : 'Unknown Supabase save error.';
      setSaveMessage(null);
      setSaveError(`Supabase save failed: ${message}. Saved locally instead.`);
      return trip;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await saveTrip();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleContinue = async () => {
    const trip = await saveTrip();
    if (trip) navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            {isEditing ? 'Edit Trip' : 'Create a New Trip'}
          </h1>
          <p className="mt-1 text-neutral-500">
            {isEditing
              ? isLoadingServiceTrip && !existingTrip
                ? 'Loading your trip details'
                : 'Update your trip details'
              : 'Start planning your next adventure'}
          </p>
          {serviceTripError && (
            <p className="mt-2 text-sm text-warning-700">
              Supabase trip data could not be loaded. Editing local trip data instead.
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[60%] space-y-6">
            <Input
              label="Trip Title"
              placeholder="Japan Spring Trip"
              icon={<MapPin className="w-4 h-4" />}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-neutral-700">Stops</label>
                <Button variant="ghost" size="sm" onClick={addStop}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Stop
                </Button>
              </div>
              {stops.map((stop, index) => (
                <Card key={index} hover={false} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-neutral-800">Stop {index + 1}</h3>
                    {stops.length > 1 && (
                      <button onClick={() => removeStop(index)} className="text-neutral-400 hover:text-error-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="City / Destination" value={stop.name} onChange={(e) => updateStop(index, { name: e.target.value })} />
                    <Input label="Country" value={stop.country} onChange={(e) => updateStop(index, { country: e.target.value })} />
                    <input type="date" value={stop.startDate} onChange={(e) => updateStop(index, { startDate: e.target.value })} className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900" />
                    <input type="date" value={stop.endDate} onChange={(e) => updateStop(index, { endDate: e.target.value })} className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900" />
                  </div>
                  <textarea rows={2} placeholder="Stop notes" value={stop.notes} onChange={(e) => updateStop(index, { notes: e.target.value })} className="mt-3 w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 resize-none" />
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Number of Travelers" type="number" min={1} icon={<Users className="w-4 h-4" />} value={travelers} onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))} />
              <Input label="Budget" type="number" min={0} icon={<DollarSign className="w-4 h-4" />} value={budget} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2.5">Trip Vibe</label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((option) => (
                  <button key={option} type="button" onClick={() => setVibe(vibe === option ? '' : option)} className={`px-4 py-2 rounded-full text-sm font-medium ${vibe === option ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
              <textarea rows={4} placeholder="Any special plans or ideas?" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 resize-none" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-neutral-200">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <div className="flex-1" />
              {saveMessage && (
                <span className="text-sm text-neutral-500">{saveMessage}</span>
              )}
              {saveError && (
                <span className="text-sm text-error-500">{saveError}</span>
              )}
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : saved ? 'Saved!' : isEditing ? 'Save Changes' : 'Save Trip'}
              </Button>
              <Button
                variant="primary"
                onClick={handleContinue}
                disabled={isSaving}
                className="inline-flex items-center gap-2"
              >
                {isSaving
                  ? 'Saving...'
                  : isEditing
                    ? 'Return to Trip'
                    : 'Continue to Planning'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-[40%]">
            <div className="lg:sticky lg:top-8">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Live Preview</p>
              <Card hover={false} className="overflow-hidden">
                <div className="relative">
                  <ImagePlaceholder src={PREVIEW_IMAGE} alt="Trip preview" aspectRatio="video" />
                  {tripTitle && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-5"><h3 className="text-xl font-bold text-white drop-shadow-md">{tripTitle}</h3></div>}
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-neutral-900">{tripTitle || 'Your Trip'}</h3>
                  <p className="text-sm text-neutral-500">{routeLabel || 'Add at least one stop'}</p>
                  <div className="flex items-center gap-2 text-sm text-neutral-600"><Calendar className="w-4 h-4 text-neutral-400" /><span>{dateDisplay || 'Select stop dates'}</span></div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600"><Users className="w-4 h-4 text-neutral-400" /><span>{travelers} traveler{travelers !== 1 ? 's' : ''}</span></div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600"><DollarSign className="w-4 h-4 text-neutral-400" /><span>{budget ? `$${budget.toLocaleString()}` : 'Set a budget'}</span></div>
                  {vibe && <Badge variant="default">{vibe}</Badge>}
                  {notesPreview && <div className="pt-2 border-t border-neutral-100"><p className="text-sm text-neutral-500 leading-relaxed"><FileText className="inline w-3.5 h-3.5 mr-1" />{notesPreview}</p></div>}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
