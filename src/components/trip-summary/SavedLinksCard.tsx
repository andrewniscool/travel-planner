import React from 'react';
import { Building2, ExternalLink, Plane } from 'lucide-react';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Flight, Hotel } from '../../types';
import DossierSection from './DossierSection';

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
    <DossierSection icon={<ExternalLink className="h-4 w-4" />} title="Links">
      <div className="space-y-2">
        {selectedFlight && safeFlightUrl && (
          <a
            href={safeFlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-app-surface-subtle p-3 transition-colors hover:bg-app-surface-muted"
          >
            <Plane className="h-4 w-4 text-app-text-subtle" />
            <span className="flex-1 text-sm font-medium text-primary-600 underline decoration-primary-200 underline-offset-2">
              Flight booking - {selectedFlight.airline}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-app-text-subtle" />
          </a>
        )}
        {selectedHotel && safeHotelUrl && (
          <a
            href={safeHotelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-app-surface-subtle p-3 transition-colors hover:bg-app-surface-muted"
          >
            <Building2 className="h-4 w-4 text-app-text-subtle" />
            <span className="flex-1 text-sm font-medium text-primary-600 underline decoration-primary-200 underline-offset-2">
              Hotel reservation - {selectedHotel.name}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-app-text-subtle" />
          </a>
        )}
        {!safeFlightUrl && !safeHotelUrl && (
          <p className="py-1 text-sm text-app-text-subtle">No booking links yet</p>
        )}
      </div>
    </DossierSection>
  );
};

export default SavedLinksCard;
