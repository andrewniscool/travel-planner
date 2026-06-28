import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Search,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { mockLocationSuggestions } from '../../data/locationSuggestions';
import {
  placesService,
  type PlaceAutocompleteSuggestion,
} from '../../services/placesService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import type { LocationRef } from '../../types';

type SearchField = 'where' | 'when' | 'who';
type LocationSuggestion =
  | { kind: 'google'; suggestion: PlaceAutocompleteSuggestion }
  | { kind: 'location'; location: LocationRef };

interface LandingTripSearchProps {
  onSearch: () => void;
}

const SEARCH_BAR_MAX_WIDTH = 'max-w-5xl';
const FIELD_BASE_CLASS =
  'relative z-10 flex min-h-[78px] flex-col justify-center rounded-[1.75rem] px-7 py-4 text-left transition-all duration-300 ease-out md:h-full md:min-h-0 md:rounded-full md:px-8';
const FIELD_ACTIVE_CLASS =
  'bg-app-surface shadow-[0_10px_30px_rgb(15_23_42_/_0.16)] md:bg-transparent md:shadow-none';
const FIELD_IDLE_CLASS = 'hover:bg-app-surface/65';
const FIELD_LABEL_CLASS =
  'block text-xs font-extrabold leading-none tracking-normal text-app-text';
const FIELD_VALUE_CLASS =
  'mt-2 block h-8 truncate text-base font-semibold md:text-[15px]';
const OVERLAY_BASE_CLASS =
  'absolute z-40 mt-4 overflow-hidden rounded-[1.75rem] border border-app-border bg-app-surface shadow-[0_18px_45px_rgb(15_23_42_/_0.18)]';
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const countLabel = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const makeManualLocation = (name: string): LocationRef => ({
  id: `manual-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'location'}`,
  name: name.trim(),
  source: 'manual',
});

const toDate = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

const isSameDay = (first: Date | null, second: Date | null) =>
  Boolean(
    first &&
      second &&
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate(),
  );

const isBetween = (date: Date, start: Date | null, end: Date | null) =>
  Boolean(start && end && date > start && date < end);

const formatDateLabel = (value?: string, fallback = 'Add date') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatSearchDateLabel = (start: string, end: string) => {
  if (!start && !end) return 'Add dates';

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const formatValue = (value: string) =>
    formatter.format(new Date(`${value}T00:00:00`));

  if (start && end) return `${formatValue(start)} - ${formatValue(end)}`;
  return start ? formatValue(start) : formatValue(end);
};

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const days: (Date | null)[] = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return days;
};

const CalendarMonth: React.FC<{
  monthDate: Date;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelect: (date: Date) => void;
}> = ({ monthDate, selectedStart, selectedEnd, onSelect }) => (
  <div className="space-y-5">
    <h3 className="text-center text-lg font-bold text-app-text">
      {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
    </h3>
    <div className="grid grid-cols-7 gap-y-2">
      {WEEKDAYS.map((day) => (
        <div key={day} className="py-1 text-center text-[11px] font-bold text-app-text-subtle">
          {day}
        </div>
      ))}
      {getCalendarDays(monthDate).map((date, index) => {
        if (!date) return <div key={`empty-${index}`} />;

        const isStart = isSameDay(date, selectedStart);
        const isEnd = isSameDay(date, selectedEnd);
        const isMiddle = isBetween(date, selectedStart, selectedEnd);
        const isSingleSelected = isStart && !selectedEnd;

        return (
          <button
            key={toDateString(date)}
            type="button"
            onClick={() => onSelect(date)}
            className={[
              'relative flex aspect-square items-center justify-center text-base font-semibold transition-colors',
              isMiddle ? 'bg-primary-50 text-app-text' : 'text-app-text-muted',
              isStart && selectedEnd ? 'rounded-l-full bg-primary-600 text-white' : '',
              isEnd && selectedStart ? 'rounded-r-full bg-primary-600 text-white' : '',
              isSingleSelected ? 'rounded-full bg-primary-600 text-white' : '',
              !isStart && !isEnd ? 'hover:rounded-full hover:bg-app-surface-muted hover:ring-1 hover:ring-app-text' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {date.getDate()}
          </button>
        );
      })}
    </div>
  </div>
);

const LandingTripSearch: React.FC<LandingTripSearchProps> = ({ onSearch }) => {
  const prefersReducedMotion = useReducedMotion();
  const [destinationQuery, setDestinationQuery] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<
    PlaceAutocompleteSuggestion[]
  >([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState(() =>
    crypto.randomUUID?.() ?? String(Date.now()),
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draftDateRange, setDraftDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [selectingDate, setSelectingDate] = useState<'start' | 'end'>('start');
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [activeOverlay, setActiveOverlay] = useState<SearchField | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const activeFieldIndex =
    activeOverlay === 'where'
      ? 0
      : activeOverlay === 'when'
        ? 1
        : activeOverlay === 'who'
          ? 2
          : null;

  const draftStartDate = toDate(draftDateRange?.start ?? startDate);
  const draftEndDate = toDate(draftDateRange?.end ?? endDate);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setActiveOverlay(null);
        setDraftDateRange(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmedQuery = destinationQuery.trim();
    if (!isSupabaseConfigured || trimmedQuery.length < 3) {
      setGoogleSuggestions([]);
      setIsLoadingPlaces(false);
      setPlacesError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingPlaces(true);
    setPlacesError(null);

    const timeoutId = window.setTimeout(() => {
      placesService
        .autocomplete(trimmedQuery, { sessionToken })
        .then((nextSuggestions) => {
          if (requestIdRef.current !== requestId) return;
          setGoogleSuggestions(nextSuggestions);
          setPlacesError(null);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setGoogleSuggestions([]);
          setPlacesError('Google Places is unavailable. Using local suggestions.');
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setIsLoadingPlaces(false);
        });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [destinationQuery, sessionToken]);

  const mockSuggestions = useMemo(() => {
    const normalizedQuery = destinationQuery.trim().toLowerCase();
    if (!normalizedQuery) return mockLocationSuggestions.slice(0, 6);
    return mockLocationSuggestions
      .filter((suggestion) =>
        [
          suggestion.name,
          suggestion.formattedAddress,
          ...(suggestion.placeTypes ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 6);
  }, [destinationQuery]);

  const locationSuggestions = useMemo<LocationSuggestion[]>(() => {
    if (googleSuggestions.length > 0) {
      return googleSuggestions.map((suggestion) => ({
        kind: 'google',
        suggestion,
      }));
    }

    return mockSuggestions.map((location) => ({
      kind: 'location',
      location,
    }));
  }, [googleSuggestions, mockSuggestions]);

  const guestSummary = useMemo(() => {
    const peopleCount = adults + children;
    const parts = [
      peopleCount ? countLabel(peopleCount, 'guest') : '',
      pets ? countLabel(pets, 'pet') : '',
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Add guests';
  }, [adults, children, pets]);

  const guestRows = [
    {
      key: 'adults',
      title: 'Adults',
      description: 'Ages 13 or above',
      value: adults,
      setValue: setAdults,
    },
    {
      key: 'children',
      title: 'Children',
      description: 'Ages 2-12',
      value: children,
      setValue: setChildren,
    },
    {
      key: 'pets',
      title: 'Pets',
      description: 'Traveling companions',
      value: pets,
      setValue: setPets,
    },
  ];

  const dateSummary = useMemo(() => {
    const displayStartDate = draftDateRange?.start ?? startDate;
    const displayEndDate = draftDateRange?.end ?? endDate;
    return formatSearchDateLabel(displayStartDate, displayEndDate);
  }, [draftDateRange?.end, draftDateRange?.start, endDate, startDate]);

  const datePrompt = (draftDateRange?.end ?? endDate)
    ? 'Confirm your dates'
    : (draftDateRange?.start ?? startDate)
      ? 'Select an end date'
      : 'Select a start date';

  const fieldClassName = (field: SearchField, extra = '') =>
    [
      FIELD_BASE_CLASS,
      activeOverlay === field ? FIELD_ACTIVE_CLASS : FIELD_IDLE_CLASS,
      extra,
    ]
      .filter(Boolean)
      .join(' ');

  const showWhereOverlay = () => {
    setActiveOverlay('where');
    setIsSearchExpanded(false);
    window.requestAnimationFrame(() => destinationInputRef.current?.focus());
  };

  const showWhenOverlay = () => {
    setActiveOverlay('when');
    setIsSearchExpanded(false);
    setDraftDateRange({ start: startDate, end: endDate });
    setSelectingDate(endDate ? 'start' : 'end');
    const currentStart = toDate(startDate);
    if (currentStart) {
      setVisibleMonth(new Date(currentStart.getFullYear(), currentStart.getMonth(), 1));
    }
  };

  const showWhoOverlay = () => {
    setActiveOverlay('who');
    setIsSearchExpanded(false);
    setDraftDateRange(null);
  };

  const handleDestinationChange = (nextQuery: string) => {
    setDestinationQuery(nextQuery);
    setGoogleSuggestions([]);
    setActiveOverlay('where');
  };

  const selectLocation = (location: LocationRef) => {
    setDestinationQuery(location.name);
    setActiveOverlay(null);
  };

  const selectGoogleSuggestion = async (suggestion: PlaceAutocompleteSuggestion) => {
    setDestinationQuery(suggestion.mainText ?? suggestion.text);
    setIsLoadingPlaces(true);
    setPlacesError(null);

    try {
      const location = await placesService.getDetails(suggestion.placeId, {
        sessionToken,
      });
      setDestinationQuery(location.name);
      setSessionToken(crypto.randomUUID?.() ?? String(Date.now()));
      setActiveOverlay(null);
    } catch {
      const manualLocation = makeManualLocation(suggestion.text);
      setDestinationQuery(manualLocation.name);
      setPlacesError('Place details could not be loaded. Saved as a manual location.');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const selectDate = (date: Date) => {
    const nextValue = toDateString(date);
    const currentStart = draftDateRange?.start ?? startDate;
    const currentEnd = draftDateRange?.end ?? endDate;
    const currentStartDate = toDate(currentStart);
    const currentEndDate = toDate(currentEnd);

    if (selectingDate === 'start' || !currentStartDate || (currentEndDate && date > currentEndDate)) {
      setDraftDateRange({ start: nextValue, end: '' });
      setSelectingDate('end');
      return;
    }

    if (currentStartDate && date < currentStartDate) {
      setDraftDateRange({ start: nextValue, end: '' });
      setSelectingDate('end');
      return;
    }

    setDraftDateRange({ start: currentStart, end: nextValue });
    setSelectingDate('start');
  };

  const confirmDates = () => {
    setStartDate(draftDateRange?.start ?? '');
    setEndDate(draftDateRange?.end ?? '');
    setDraftDateRange(null);
    setActiveOverlay(null);
  };

  const cancelDates = () => {
    setDraftDateRange(null);
    setActiveOverlay(null);
  };

  const clearDates = () => {
    setDraftDateRange({ start: '', end: '' });
    setSelectingDate('start');
  };

  const overlayPositionClass =
    activeOverlay === 'where'
      ? 'left-0 w-[min(36rem,calc(100vw-2rem))]'
      : activeOverlay === 'when'
        ? 'left-0 w-full'
        : 'right-0 w-[min(24rem,calc(100vw-2rem))]';

  const overlayTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.9 };

  const contentTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeOut' as const };

  return (
    <section className="relative z-20 -mt-16 px-4 sm:px-6">
      <div ref={searchRef} className={['relative mx-auto', SEARCH_BAR_MAX_WIDTH].join(' ')}>
        <div className="overflow-visible rounded-[1.75rem] border border-app-border bg-app-surface-muted shadow-[0_18px_45px_rgb(15_23_42_/_0.18)] md:rounded-full">
          <div className="relative grid grid-cols-1 md:h-[82px] md:grid-cols-3 md:items-stretch">
            {activeFieldIndex !== null && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-0 hidden rounded-full bg-app-surface shadow-[0_10px_30px_rgb(15_23_42_/_0.16)] transition-transform duration-300 ease-out md:block"
                style={{
                  width: 'calc(100% / 3)',
                  transform: `translateX(calc(${activeFieldIndex} * 100%))`,
                }}
              />
            )}

            <div
              className={fieldClassName('where')}
              onClick={showWhereOverlay}
              onFocus={showWhereOverlay}
            >
              <span className={FIELD_LABEL_CLASS}>Where</span>
              <input
                ref={destinationInputRef}
                value={destinationQuery}
                onChange={(event) => handleDestinationChange(event.target.value)}
                placeholder="Search destinations"
                className="mt-2 h-8 w-full border-0 bg-transparent p-0 text-base font-semibold text-app-text outline-none placeholder:text-app-text-muted focus:outline-none focus:ring-0 md:text-[15px]"
              />
            </div>

            <button
              type="button"
              className={fieldClassName('when')}
              onClick={showWhenOverlay}
            >
              <span className={FIELD_LABEL_CLASS}>When</span>
              <span
                className={[
                  FIELD_VALUE_CLASS,
                  startDate || endDate || draftDateRange?.start || draftDateRange?.end
                    ? 'text-app-text'
                    : 'text-app-text-muted',
                ].join(' ')}
              >
                {dateSummary}
              </span>
            </button>

            <div className="relative">
              <div
                className={fieldClassName(
                  'who',
                  isSearchExpanded ? 'w-full pr-40 md:pr-40' : 'w-full pr-24 md:pr-24',
                )}
                onClick={showWhoOverlay}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    showWhoOverlay();
                  }
                }}
                aria-expanded={activeOverlay === 'who'}
                aria-haspopup="dialog"
              >
                <span className={FIELD_LABEL_CLASS}>Who</span>
                <span
                  className={[
                    FIELD_VALUE_CLASS,
                    adults + children + pets > 0
                      ? 'text-app-text'
                      : 'text-app-text-muted',
                  ].join(' ')}
                >
                  {guestSummary}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveOverlay(null);
                    setDraftDateRange(null);
                    if (!isSearchExpanded) {
                      setIsSearchExpanded(true);
                      return;
                    }
                    onSearch();
                  }}
                  className={[
                    'absolute right-3 top-1/2 flex h-14 -translate-y-1/2 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-900/15 transition-all duration-300 ease-out hover:-translate-y-[52%] hover:bg-primary-700 active:scale-[0.98]',
                    isSearchExpanded ? 'w-32 px-6' : 'w-14 px-0',
                  ].join(' ')}
                  aria-label="Search trips"
                >
                  <Search className="h-5 w-5" />
                  <span
                    className={[
                      'transition-all duration-200',
                      isSearchExpanded
                        ? 'max-w-20 opacity-100'
                        : 'max-w-0 opacity-0',
                    ].join(' ')}
                  >
                    Search
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeOverlay && (
            <motion.div
              key="landing-search-overlay"
              layout
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
              transition={overlayTransition}
              className={[OVERLAY_BASE_CLASS, overlayPositionClass].join(' ')}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeOverlay}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                  transition={contentTransition}
                >
                  {activeOverlay === 'where' && (
                    <div className="p-3">
                      {isLoadingPlaces && (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-app-text-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching Google Places...
                        </div>
                      )}
                      {locationSuggestions.length > 0 ? (
                        locationSuggestions.map((suggestion) => {
                          const key =
                            suggestion.kind === 'google'
                              ? suggestion.suggestion.placeId
                              : suggestion.location.id;
                          const name =
                            suggestion.kind === 'google'
                              ? suggestion.suggestion.mainText ?? suggestion.suggestion.text
                              : suggestion.location.name;
                          const description =
                            suggestion.kind === 'google'
                              ? suggestion.suggestion.secondaryText
                              : suggestion.location.formattedAddress;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                if (suggestion.kind === 'google') {
                                  void selectGoogleSuggestion(suggestion.suggestion);
                                } else {
                                  selectLocation(suggestion.location);
                                }
                              }}
                              className="flex w-full items-start gap-3 rounded-xl px-4 py-4 text-left transition-colors hover:bg-app-surface-muted"
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-app-text">
                                  {name}
                                </span>
                                {description && (
                                  <span className="block truncate text-xs text-app-text-muted">
                                    {description}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectLocation(makeManualLocation(destinationQuery))}
                          className="w-full rounded-xl px-4 py-4 text-left text-sm text-app-text-muted transition-colors hover:bg-app-surface-muted"
                        >
                          Use "{destinationQuery.trim() || 'this destination'}" as a custom location
                        </button>
                      )}
                      {placesError && (
                        <div className="border-t border-app-border-muted px-4 py-2 text-xs text-warning-700">
                          {placesError}
                        </div>
                      )}
                    </div>
                  )}

                  {activeOverlay === 'when' && (
                    <div>
                      <div className="flex flex-col gap-4 border-b border-app-border-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                          className="hidden rounded-full p-2 text-app-text-muted hover:bg-app-surface-muted hover:text-app-text sm:inline-flex"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-bold text-app-text">{datePrompt}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={clearDates}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-app-text-muted underline hover:bg-app-surface-muted"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                            className="rounded-full p-2 text-app-text-muted hover:bg-app-surface-muted hover:text-app-text"
                            aria-label="Next month"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-8 p-5 md:grid-cols-2">
                        {[visibleMonth, addMonths(visibleMonth, 1)].map((month) => (
                          <CalendarMonth
                            key={`${month.getFullYear()}-${month.getMonth()}`}
                            monthDate={month}
                            selectedStart={draftStartDate}
                            selectedEnd={draftEndDate}
                            onSelect={selectDate}
                          />
                        ))}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-app-border-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid grid-cols-2 gap-2 text-sm sm:w-80">
                          <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2">
                            <span className="block text-[10px] font-bold uppercase text-primary-700">
                              Start
                            </span>
                            <span className="mt-0.5 block truncate font-semibold text-app-text">
                              {formatDateLabel(draftDateRange?.start ?? '', 'Add date')}
                            </span>
                          </div>
                          <div className="rounded-xl border border-app-border bg-app-surface px-3 py-2">
                            <span className="block text-[10px] font-bold uppercase text-app-text-muted">
                              End
                            </span>
                            <span className="mt-0.5 block truncate font-semibold text-app-text">
                              {formatDateLabel(draftDateRange?.end ?? '', 'Add date')}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelDates}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-app-text-muted hover:bg-app-surface-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={confirmDates}
                            className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeOverlay === 'who' && (
                    <div className="divide-y divide-app-border p-6">
                      {guestRows.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="text-base font-bold text-app-text">
                              {row.title}
                            </p>
                            <p className="mt-1 text-sm text-app-text-muted">
                              {row.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                row.setValue((value) => Math.max(0, value - 1))
                              }
                              disabled={row.value === 0}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border text-app-text transition-colors hover:border-app-text disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-app-border"
                              aria-label={`Remove ${row.title.toLowerCase()}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center text-base font-semibold text-app-text">
                              {row.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => row.setValue((value) => value + 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-app-border text-app-text transition-colors hover:border-app-text"
                              aria-label={`Add ${row.title.toLowerCase()}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LandingTripSearch;
