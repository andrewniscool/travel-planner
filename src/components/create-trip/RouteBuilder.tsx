import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import LocationInput from '../ui/LocationInput';
import { DateRangePicker } from '../ui/DatePicker';
import { getRouteStepLabel, type RouteMode, type StopForm } from './createTripDisplay';

interface RouteBuilderProps {
  stops: StopForm[];
  routeMode: RouteMode;
  onSetSingleDestinationMode: () => void;
  onSetMultiStopMode: () => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onUpdateStop: (index: number, patch: Partial<StopForm>) => void;
  getStopFieldError: (
    index: number,
    field: 'name' | 'startDate' | 'endDate',
  ) => string | undefined;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  stops,
  routeMode,
  onSetSingleDestinationMode,
  onSetMultiStopMode,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  getStopFieldError,
}) => (
  <div>
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Route</h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-grid rounded-full border border-neutral-200 bg-neutral-50 p-1 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSetSingleDestinationMode}
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
            onClick={onSetMultiStopMode}
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
        <button
          type="button"
          onClick={routeMode === 'multi' ? onAddStop : onSetMultiStopMode}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 underline underline-offset-4 transition-colors hover:text-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Stop
        </button>
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
              onClick={() => onRemoveStop(index)}
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
                  onUpdateStop(index, {
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
                onChange={(event) =>
                  onUpdateStop(index, { country: event.target.value })
                }
                placeholder="Japan"
                className="w-full rounded-xl border-0 bg-transparent px-3 pb-2 pt-6 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
              />
            </div>

            <DateRangePicker
              months={2}
              startValue={stop.startDate}
              endValue={stop.endDate}
              onChange={(range) =>
                onUpdateStop(index, {
                  startDate: range.start,
                  endDate: range.end,
                })
              }
              error={
                getStopFieldError(index, 'startDate') ??
                getStopFieldError(index, 'endDate')
              }
            />

            <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600 md:col-span-2">
              <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
                Notes
              </label>
              <textarea
                rows={3}
                value={stop.notes}
                onChange={(event) =>
                  onUpdateStop(index, { notes: event.target.value })
                }
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
          onClick={onAddStop}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-400 transition-all hover:border-primary-600 hover:text-primary-600"
        >
          <MapPin className="mb-2 h-8 w-8" />
          <span className="font-bold">Add another stop</span>
        </button>
      )}
    </div>
  </div>
);

export default RouteBuilder;
