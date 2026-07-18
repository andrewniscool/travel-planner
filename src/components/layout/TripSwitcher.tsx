import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Luggage, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTripDisplayName } from '../../data/trips';
import { useTripWorkspace } from '../../hooks/useTripWorkspace';
import { formatDateRange } from '../../utils/tripDisplay';

interface TripSwitcherProps {
  isCollapsed: boolean;
  onNavigate: () => void;
}

const TRIP_TOOL_SUFFIXES = new Set([
  '/flights',
  '/hotels',
  '/explore',
  '/itinerary',
  '/map',
  '/budget',
  '/notes',
  '/summary',
]);

const TripSwitcher: React.FC<TripSwitcherProps> = ({ isCollapsed, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { trips, activeTrip, selectTrip, isLoading } = useTripWorkspace();

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const options = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
      );
      (
        options.find((option) => option.getAttribute('aria-selected') === 'true') ?? options[0]
      )?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleSelect = (tripId: string) => {
    const match = location.pathname.match(/^\/trip\/[^/]+(\/[^/]+)?/);
    const suffix = match?.[1] && TRIP_TOOL_SUFFIXES.has(match[1]) ? match[1] : '';
    selectTrip(tripId);
    setOpen(false);
    onNavigate();
    navigate(`/trip/${tripId}${suffix}`);
  };

  const handleCreate = () => {
    setOpen(false);
    onNavigate();
    navigate('/create-trip');
  };

  if (!activeTrip && !isLoading) {
    return isCollapsed ? (
      <button
        type="button"
        onClick={handleCreate}
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
        aria-label="Create your first trip"
        title="Create your first trip"
      >
        <Plus className="h-5 w-5" />
      </button>
    ) : (
      <div className="mx-3 rounded-xl border border-dashed border-app-border px-3 py-3">
        <p className="text-sm font-medium text-app-text">No trips yet</p>
        <button
          type="button"
          onClick={handleCreate}
          className="mt-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
        >
          Create your first trip
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative px-3">
      <div
        className={isCollapsed ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1.5'}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={
            activeTrip
              ? `Switch trip. Current trip: ${getTripDisplayName(activeTrip)}`
              : 'Switch trip'
          }
          title={isCollapsed && activeTrip ? getTripDisplayName(activeTrip) : undefined}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeAndRestoreFocus();
          }}
          className={`flex min-w-0 items-center rounded-xl border border-app-border-muted bg-app-surface-muted text-left transition-colors hover:border-app-border hover:bg-app-surface ${
            isCollapsed ? 'h-11 w-11 justify-center' : 'min-h-12 flex-1 gap-2.5 px-3 py-2'
          }`}
        >
          <Luggage className="h-5 w-5 shrink-0 text-primary-700" />
          {activeTrip && (
            <span
              className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out ${
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-app-text-strong">
                  {getTripDisplayName(activeTrip)}
                </span>
                <span className="block truncate text-[11px] text-app-text-muted">
                  {formatDateRange(activeTrip.startDate, activeTrip.endDate)}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-app-text-muted" />
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleCreate}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-primary-700"
          aria-label="Create new trip"
          title={isCollapsed ? 'Create new trip' : undefined}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select a trip"
          className={`absolute z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-app-border-muted bg-app-surface p-1.5 shadow-elevated animate-fade-in ${
            isCollapsed ? 'left-full top-0 ml-2 w-64' : 'left-3 right-3'
          }`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              closeAndRestoreFocus();
              return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const options = Array.from(
              menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
            );
            if (!options.length) return;
            if (event.key === 'Home') options[0].focus();
            else if (event.key === 'End') options[options.length - 1]?.focus();
            else {
              const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
              const direction = event.key === 'ArrowDown' ? 1 : -1;
              options[(currentIndex + direction + options.length) % options.length]?.focus();
            }
          }}
        >
          {trips.map((trip) => {
            const isActive = trip.id === activeTrip?.id;
            return (
              <button
                key={trip.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(trip.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'bg-primary-600/[0.08] text-primary-700'
                    : 'text-app-text hover:bg-app-surface-muted'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {getTripDisplayName(trip)}
                  </span>
                  <span className="block truncate text-[11px] text-app-text-muted">
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </span>
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleCreate}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-app-border-muted px-3 py-2.5 text-left text-sm font-semibold text-primary-700 hover:bg-primary-600/[0.06]"
          >
            <Plus className="h-4 w-4" />
            Create new trip
          </button>
        </div>
      )}
    </div>
  );
};

export default TripSwitcher;
