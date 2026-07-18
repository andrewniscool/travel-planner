import React from 'react';
import { Plane } from 'lucide-react';
import type { Flight } from '../../types';
import DossierSection from './DossierSection';

interface FlightSectionProps {
  flight?: Flight;
}

const FlightSection: React.FC<FlightSectionProps> = ({ flight }) => {
  const stopsLabel = flight
    ? flight.stops === 0
      ? 'Nonstop'
      : `${flight.stops} stop${flight.stops === 1 ? '' : 's'}${flight.stopCity ? ` in ${flight.stopCity}` : ''}`
    : '';

  return (
    <DossierSection icon={<Plane className="h-4 w-4" />} tone="accent" title="Flight">
      {flight ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-app-text-strong">{flight.airline}</p>
            <p className="mt-0.5 text-sm text-app-text-muted">
              {flight.departureAirportCode} → {flight.arrivalAirportCode} · {flight.departureTime}{' '}
              – {flight.arrivalTime}
            </p>
            <p className="mt-0.5 text-xs text-app-text-subtle">
              {flight.duration} · {stopsLabel} · {flight.baggage} · via {flight.bookingSource}
            </p>
          </div>
          <p className="shrink-0 text-base font-semibold text-app-text-strong">
            ${flight.price.toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-app-text-subtle">No flight selected.</p>
      )}
    </DossierSection>
  );
};

export default FlightSection;
