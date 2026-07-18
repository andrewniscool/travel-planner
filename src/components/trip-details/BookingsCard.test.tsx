import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Flight, Hotel } from '../../types';
import BookingsCard from './BookingsCard';

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

const hotel = (websiteUri?: string): Hotel => ({
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
  locationRef: { id: 'location-1', name: 'Test Hotel', source: 'manual', websiteUri },
});

describe('BookingsCard', () => {
  afterEach(cleanup);

  it('renders safe booking links', () => {
    render(
      <BookingsCard
        tripId="trip-1"
        flight={flight('https://booking.example.com/flight')}
        hotel={hotel('http://hotels.example.com/reservation')}
      />,
    );

    expect(screen.getByRole('link', { name: /booking/i })).toHaveAttribute(
      'href',
      'https://booking.example.com/flight',
    );
    expect(screen.getByRole('link', { name: /reservation/i })).toHaveAttribute(
      'href',
      'http://hotels.example.com/reservation',
    );
  });

  it('suppresses unsafe booking links', () => {
    render(
      <BookingsCard
        tripId="trip-1"
        flight={flight('javascript:alert(1)')}
        hotel={hotel('data:text/html,<script>alert(1)</script>')}
      />,
    );

    expect(screen.queryByRole('link', { name: /booking|reservation/i })).not.toBeInTheDocument();
  });
});
