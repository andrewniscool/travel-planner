import React from 'react';
import { Clock, Plane } from 'lucide-react';
import Card from '../ui/Card';
import type { Flight } from '../../types';

interface SelectedFlightSummaryCardProps {
  flight?: Flight;
}

const SelectedFlightSummaryCard: React.FC<SelectedFlightSummaryCardProps> = ({
  flight,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <Plane className="w-5 h-5 text-primary-500" />
      Selected Flight
    </h2>
    {flight ? (
      <div className="bg-neutral-50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {flight.airline}
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              {flight.departureAirportCode}{' '}
              <span className="text-neutral-400">&rarr;</span>{' '}
              {flight.arrivalAirportCode}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {flight.departureTime} - {flight.arrivalTime}
              </span>
              <span>{flight.duration}</span>
              {flight.stops > 0 && (
                <span>
                  {flight.stops} stop{flight.stops > 1 ? 's' : ''}{' '}
                  ({flight.stopCity})
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-neutral-900">
              ${flight.price.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              via {flight.bookingSource}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Plane className="w-8 h-8 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-500">No flight selected</p>
      </div>
    )}
  </Card>
);

export default SelectedFlightSummaryCard;
