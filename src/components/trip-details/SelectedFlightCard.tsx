import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Plane } from 'lucide-react';
import Card from '../ui/Card';
import type { Flight } from '../../types';

interface SelectedFlightCardProps {
  flight?: Flight;
}

const SelectedFlightCard: React.FC<SelectedFlightCardProps> = ({ flight }) => (
  <Card hover={false} className="p-6">
    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
      Selected Flight
    </h2>
    {flight ? (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-neutral-900">{flight.airline}</p>
            <p className="text-sm text-neutral-500">
              {flight.departureAirportCode} - {flight.arrivalAirportCode}
            </p>
          </div>
          <p className="text-lg font-bold text-primary-600">${flight.price}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4 text-neutral-400" />
            {flight.departureTime} - {flight.arrivalTime}
          </span>
          <span>{flight.duration}</span>
          <span>
            {flight.stops === 0
              ? 'Nonstop'
              : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Plane className="w-10 h-10 text-neutral-300 mb-3" />
        <p className="text-neutral-600 font-medium mb-1">
          No flight selected yet
        </p>
        <Link
          to="flights"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Browse flights
        </Link>
      </div>
    )}
  </Card>
);

export default SelectedFlightCard;
