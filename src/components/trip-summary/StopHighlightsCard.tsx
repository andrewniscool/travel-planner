import React from 'react';
import { Building2 } from 'lucide-react';
import Card from '../ui/Card';
import type { Hotel, ItineraryDay, Place, TripStop } from '../../types';

interface StopHighlight {
  stop: TripStop;
  hotels: Hotel[];
  places: Place[];
  days: ItineraryDay[];
}

interface StopHighlightsCardProps {
  highlights: StopHighlight[];
}

const StopHighlightsCard: React.FC<StopHighlightsCardProps> = ({
  highlights,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <Building2 className="w-5 h-5 text-accent-500" />
      Stop Highlights
    </h2>
    <div className="space-y-4">
      {highlights.map(({ stop, hotels, places, days }) => (
        <div key={stop.id} className="bg-neutral-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-800 mb-2">
            {stop.name}
          </h3>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>
              {hotels.find((hotel) => hotel.isSelected)?.name ||
                hotels[0]?.name ||
                'No hotel selected'}
            </p>
            <p>
              {places.length > 0
                ? places.map((place) => place.name).join(', ')
                : 'No saved places'}
            </p>
            <p>
              {days.length} itinerary day{days.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default StopHighlightsCard;
