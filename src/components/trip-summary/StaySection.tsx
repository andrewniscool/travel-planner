import React from 'react';
import { Building2 } from 'lucide-react';
import type { Hotel } from '../../types';
import DossierSection from './DossierSection';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import RatingStars from '../ui/RatingStars';

interface StaySectionProps {
  hotel?: Hotel;
}

const StaySection: React.FC<StaySectionProps> = ({ hotel }) => {
  return (
    <DossierSection icon={<Building2 className="h-4 w-4" />} title="Stay">
      {hotel ? (
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
            <ImagePlaceholder
              src={hotel.image}
              alt={hotel.name}
              aspectRatio="square"
              className="h-full"
              fallbackText={hotel.name}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-app-text-strong">{hotel.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-app-text-muted">
              <RatingStars rating={hotel.rating} size="sm" />
              <span>
                {hotel.neighborhood} · {hotel.distanceToCenter}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-app-text-strong">
              ${hotel.pricePerNight}/night
            </p>
            <p className="text-xs text-app-text-subtle">
              ${hotel.totalCost.toLocaleString()} total
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-app-text-subtle">No hotel selected.</p>
      )}
    </DossierSection>
  );
};

export default StaySection;
