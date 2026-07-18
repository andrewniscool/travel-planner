import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Plane } from 'lucide-react';
import type { Flight, Hotel } from '../../types';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { BudgetCurrency } from '../../types';
import { formatBudgetAmount } from '../../utils/budget';
import Card from '../ui/Card';
import IconChip from '../ui/IconChip';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import RatingStars from '../ui/RatingStars';
import SectionHeader from '../ui/SectionHeader';

interface BookingsCardProps {
  tripId: string;
  flight?: Flight;
  hotel?: Hotel;
  currency?: BudgetCurrency;
}

const emptyRow = (label: string, linkLabel: string, to: string) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-app-border bg-app-surface-subtle px-3 py-3">
    <p className="text-sm text-app-text-subtle">{label}</p>
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
    >
      {linkLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

const BookingsCard: React.FC<BookingsCardProps> = ({ tripId, flight, hotel, currency }) => {
  const flightUrl = getSafeExternalUrl(flight?.bookingUrl);
  const hotelUrl = getSafeExternalUrl(
    hotel?.locationRef?.websiteUri ?? hotel?.locationRef?.googleMapsUri,
  );

  return (
    <Card hover={false} className="p-5">
      <SectionHeader title="Bookings" />
      <div className="space-y-2.5">
        {flight ? (
          <div className="flex items-start gap-3 rounded-xl border border-app-border-muted bg-app-surface p-3">
            <IconChip tone="accent" icon={<Plane className="h-4 w-4" />} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-app-text-strong">
                {flight.airline} · {flight.departureAirportCode} → {flight.arrivalAirportCode}
              </p>
              <p className="mt-0.5 text-xs text-app-text-muted">
                {flight.departureTime} – {flight.arrivalTime} · {flight.duration} ·{' '}
                {flight.stops === 0
                  ? 'Nonstop'
                  : `${flight.stops} stop${flight.stops === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-app-text-strong">
                {formatBudgetAmount(flight.price, currency)}
              </p>
              <p className="text-xs text-app-text-subtle">{flight.bookingSource}</p>
              {flightUrl && (
                <a
                  href={flightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600"
                >
                  Booking <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          emptyRow('No flight selected yet', 'Browse flights', `/trip/${tripId}/flights`)
        )}
        {hotel ? (
          <div className="flex items-start gap-3 rounded-xl border border-app-border-muted bg-app-surface p-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <ImagePlaceholder
                src={hotel.image}
                alt={hotel.name}
                aspectRatio="square"
                className="h-full"
                fallbackText={hotel.name}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-app-text-strong">{hotel.name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-app-text-muted">
                <RatingStars rating={hotel.rating} size="sm" />
                <span>{hotel.neighborhood}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-app-text-strong">
                {formatBudgetAmount(hotel.pricePerNight, currency)}/night
              </p>
              <p className="text-xs text-app-text-subtle">
                {formatBudgetAmount(hotel.totalCost, currency)} total
              </p>
              {hotelUrl && (
                <a
                  href={hotelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600"
                >
                  Reservation <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          emptyRow('No hotel selected yet', 'Browse hotels', `/trip/${tripId}/hotels`)
        )}
      </div>
    </Card>
  );
};

export default BookingsCard;
