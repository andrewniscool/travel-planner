import React from 'react';
import { Building2, ExternalLink, Plane } from 'lucide-react';
import Card from '../ui/Card';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Flight, Hotel } from '../../types';

interface SavedLinksCardProps {
  selectedFlight?: Flight;
  selectedHotel?: Hotel;
  hotelLink?: string;
}

const SavedLinksCard: React.FC<SavedLinksCardProps> = ({
  selectedFlight,
  selectedHotel,
  hotelLink,
}) => {
  const safeFlightUrl = getSafeExternalUrl(selectedFlight?.bookingUrl);
  const safeHotelUrl = getSafeExternalUrl(hotelLink);

  return (
    <Card hover={false} className="p-6">
      <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
        <ExternalLink className="w-5 h-5 text-primary-500" />
        Saved Links
      </h2>
      <div className="space-y-2">
        {selectedFlight && safeFlightUrl && (
          <a
            href={safeFlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
          >
            <Plane className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-primary-600 underline flex-1">
              Flight booking - {selectedFlight.airline}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        )}
        {selectedHotel && safeHotelUrl && (
          <a
            href={safeHotelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors duration-150"
          >
            <Building2 className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-primary-600 underline flex-1">
              Hotel reservation - {selectedHotel.name}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        )}
        {!safeFlightUrl && !safeHotelUrl && (
          <p className="text-sm text-neutral-400 py-2">No booking links yet</p>
        )}
      </div>
    </Card>
  );
};

export default SavedLinksCard;
