import React from 'react';
import { Building2 } from 'lucide-react';
import type { StopHighlight } from '../../hooks/useTripData';
import DossierSection from './DossierSection';

interface StopHighlightsSectionProps {
  highlights: StopHighlight[];
}

const StopHighlightsSection: React.FC<StopHighlightsSectionProps> = ({ highlights }) => {
  return (
    <DossierSection icon={<Building2 className="h-4 w-4" />} title="Stops">
      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div key={highlight.stop.id} className="rounded-xl bg-app-surface-subtle p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-app-text-strong">
                {highlight.stop.order}. {highlight.stop.name}
              </p>
              <span className="text-xs text-app-text-subtle">
                {highlight.dayCount} itinerary day{highlight.dayCount === 1 ? '' : 's'}
              </span>
            </div>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 pt-0.5 text-xs uppercase tracking-eyebrow text-app-text-subtle">
                  Hotel
                </dt>
                <dd className="text-app-text-muted">
                  {highlight.hotel?.name ?? 'No hotel selected'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 pt-0.5 text-xs uppercase tracking-eyebrow text-app-text-subtle">
                  Places
                </dt>
                <dd className="text-app-text-muted">
                  {highlight.places.length > 0
                    ? highlight.places.map((place) => place.name).join(', ')
                    : 'No saved places'}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </DossierSection>
  );
};

export default StopHighlightsSection;
