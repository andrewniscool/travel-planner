import React, { useState, useMemo } from 'react';
import { Plane, ChevronDown, GitCompare, X as XIcon } from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getFlightsByTripId } from '../data/flights';
import type { Flight } from '../types';
import FlightCard from '../components/flights/FlightCard';
import FlightFilters from '../components/flights/FlightFilters';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import PriceTag from '../components/ui/PriceTag';

type SortOption = 'cheapest' | 'shortest' | 'best';

const Flights: React.FC = () => {
  const trip = useTrip();
  const allFlights = trip ? getFlightsByTripId(trip.id) : [];

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('best');

  // Filter state
  const [maxPrice, setMaxPrice] = useState(3000);
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

  // Selection state
  const [savedFlights, setSavedFlights] = useState<Set<string>>(new Set());
  void savedFlights;
  const [comparedFlights, setComparedFlights] = useState<Set<string>>(new Set());

  // Compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Unique airlines for filter
  const uniqueAirlines = useMemo(
    () => [...new Set(allFlights.map((f) => f.airline))].sort(),
    [allFlights]
  );

  // Filtering logic
  const filteredFlights = useMemo(() => {
    return allFlights.filter((flight) => {
      if (flight.price > maxPrice) return false;
      if (nonstopOnly && flight.stops !== 0) return false;
      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(flight.airline)
      )
        return false;
      return true;
    });
  }, [allFlights, maxPrice, nonstopOnly, selectedAirlines]);

  // Sorting logic
  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    switch (sortBy) {
      case 'cheapest':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'shortest':
        sorted.sort((a, b) => a.duration.localeCompare(b.duration));
        break;
      case 'best':
      default:
        break;
    }
    return sorted;
  }, [filteredFlights, sortBy]);

  // Handlers
  const handleAirlineToggle = (airline: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline)
        ? prev.filter((a) => a !== airline)
        : [...prev, airline]
    );
  };

  const handleSave = (flightId: string) => {
    setSavedFlights((prev) => {
      const next = new Set(prev);
      if (next.has(flightId)) {
        next.delete(flightId);
      } else {
        next.add(flightId);
      }
      return next;
    });
  };

  const handleCompare = (flightId: string) => {
    setComparedFlights((prev) => {
      const next = new Set(prev);
      if (next.has(flightId)) {
        next.delete(flightId);
      } else {
        next.add(flightId);
      }
      return next;
    });
  };

  const handleSelect = (flight: Flight) => {
    // Selection logic - in a real app this would update the trip
    console.log('Selected flight:', flight.id);
  };

  // Compared flights data
  const comparedFlightList = useMemo(
    () => allFlights.filter((f) => comparedFlights.has(f.id)),
    [allFlights, comparedFlights]
  );

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<Plane className="w-8 h-8" />}
          title="Trip not found"
          description="Could not find the trip for these flights."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Flights</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Compare and book flights for your trip to {trip.destination}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Compare button */}
          {comparedFlights.size >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareModalOpen(true)}
            >
              <GitCompare className="w-4 h-4 mr-1.5" />
              Compare {comparedFlights.size} flights
            </Button>
          )}

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-neutral-200 rounded-xl px-4 py-2 pr-9 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="best">Best Overall</option>
              <option value="cheapest">Cheapest</option>
              <option value="shortest">Shortest</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content: Sidebar + List */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <FlightFilters
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            nonstopOnly={nonstopOnly}
            onNonstopOnlyChange={setNonstopOnly}
            airlines={uniqueAirlines}
            selectedAirlines={selectedAirlines}
            onAirlineToggle={handleAirlineToggle}
          />
        </aside>

        {/* Flight list */}
        <div className="flex-1 space-y-3">
          {sortedFlights.length === 0 ? (
            <EmptyState
              icon={<Plane className="w-8 h-8" />}
              title="No flights match your filters"
              description="Try adjusting the price range, removing airline filters, or turning off nonstop-only."
              actionLabel="Reset filters"
              onAction={() => {
                setMaxPrice(3000);
                setNonstopOnly(false);
                setSelectedAirlines([]);
              }}
            />
          ) : (
            sortedFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                isSelected={!!flight.isSelected}
                onSelect={() => handleSelect(flight)}
                onSave={() => handleSave(flight.id)}
                onCompare={() => handleCompare(flight.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Compare Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Compare Flights"
        size="lg"
      >
        {comparedFlightList.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-3 pr-4 font-medium text-neutral-500">
                    Attribute
                  </th>
                  {comparedFlightList.map((f) => (
                    <th
                      key={f.id}
                      className="text-left py-3 px-4 font-semibold text-neutral-900 min-w-[160px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{f.airline}</span>
                        <button
                          onClick={() => handleCompare(f.id)}
                          className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Price</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 font-semibold text-neutral-900">
                      <PriceTag amount={f.price} size="sm" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Route</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.departureAirportCode} - {f.arrivalAirportCode}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Departure</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.departureTime}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Arrival</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.arrivalTime}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Duration</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.duration}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Stops</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.stops === 0
                        ? 'Nonstop'
                        : f.stops === 1
                          ? `1 Stop${f.stopCity ? ` (${f.stopCity})` : ''}`
                          : `${f.stops} Stops`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Baggage</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.baggage}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-neutral-500">Book via</td>
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-neutral-700">
                      {f.bookingSource}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4" />
                  {comparedFlightList.map((f) => (
                    <td key={f.id} className="py-3 px-4">
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Book Flight
                        </Button>
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Flights;
