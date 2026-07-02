import React from 'react';
import { FileText, Lightbulb, Star, Users } from 'lucide-react';
import Badge from '../ui/Badge';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import type { StopForm } from './createTripDisplay';
import type { TripStatus, TripVibe } from '../../types';

interface TripPreviewSidebarProps {
  previewImage: string;
  status?: TripStatus;
  tripTitle: string;
  routeLabel: string;
  dateDisplay: string;
  formattedBudget: string;
  travelers: number;
  vibe: TripVibe | '';
  notesPreview: string;
  validStops: StopForm[];
}

const TripPreviewSidebar: React.FC<TripPreviewSidebarProps> = ({
  previewImage,
  status,
  tripTitle,
  routeLabel,
  dateDisplay,
  formattedBudget,
  travelers,
  vibe,
  notesPreview,
  validStops,
}) => (
  <div>
    <div className="lg:sticky lg:top-24">
      <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
        Trip Preview
      </p>
      <div className="group">
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
          <ImagePlaceholder
            src={previewImage}
            alt="Trip preview"
            aspectRatio="video"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-4 left-4">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-tight text-neutral-900 backdrop-blur-sm">
              {status ?? 'Planning'}
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
          <p className="font-bold text-neutral-900">
            {formattedBudget || 'Set budget'}
          </p>
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
              Add dates to each stop first. Hotels, budget, and map views become
              much easier to review once the route is anchored.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TripPreviewSidebar;
