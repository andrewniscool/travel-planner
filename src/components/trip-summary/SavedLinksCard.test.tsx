import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Flight, Hotel } from '../../types';
import SavedLinksCard from './SavedLinksCard';

const flight = (bookingUrl?: string): Flight => ({
  id: 'flight-1',
  tripId: 'trip-1',
  airline: 'Test Air',
  airlineLogo: 'TA',
  price: 100,
  departureAirport: 'Departure',
  departureAirportCode: 'DEP',
  arrivalAirport: 'Arrival',
  arrivalAirportCode: 'ARR',
  departureTime: '09:00',
  arrivalTime: '12:00',
  duration: '3h',
  stops: 0,
  baggage: 'Included',
  bookingSource: 'Test',
  bookingUrl,
});

const hotel: Hotel = {
  id: 'hotel-1',
  tripId: 'trip-1',
  name: 'Test Hotel',
  image: 'https://example.com/hotel.jpg',
  rating: 4.5,
  reviewCount: 12,
  pricePerNight: 200,
  totalCost: 600,
  amenities: [],
  neighborhood: 'Center',
  distanceToCenter: '1 mile',
  description: 'A hotel',
};

describe('SavedLinksCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders safe external booking links', () => {
    render(
      <SavedLinksCard
        selectedFlight={flight('https://booking.example.com/flight')}
        selectedHotel={hotel}
        hotelLink="http://hotels.example.com/reservation"
      />,
    );

    expect(screen.getByRole('link', { name: /flight booking/i })).toHaveAttribute(
      'href',
      'https://booking.example.com/flight',
    );
    expect(screen.getByRole('link', { name: /hotel reservation/i })).toHaveAttribute(
      'href',
      'http://hotels.example.com/reservation',
    );
  });

  it('suppresses unsafe external booking links', () => {
    render(
      <SavedLinksCard
        selectedFlight={flight('javascript:alert(1)')}
        selectedHotel={hotel}
        hotelLink="data:text/html,<script>alert(1)</script>"
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('No booking links yet')).toBeInTheDocument();
  });
});
