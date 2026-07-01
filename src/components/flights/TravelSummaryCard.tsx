import React from 'react';
import Card from '../ui/Card';

interface TravelSummaryStats {
  flights: number;
  ground: number;
  missing: number;
  totalCost: number;
}

interface TravelSummaryCardProps {
  orderedStops: { name: string }[];
  tripDisplayName: string;
  stats: TravelSummaryStats;
}

const TravelSummaryCard: React.FC<TravelSummaryCardProps> = ({
  orderedStops,
  tripDisplayName,
  stats,
}) => (
  <Card hover={false} className="p-5">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Travel plan
        </p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {orderedStops.length > 0
            ? orderedStops.map((stop) => stop.name).join(' → ')
            : tripDisplayName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-xs text-neutral-400">Flights</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {stats.flights}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-xs text-neutral-400">Train/Bus</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {stats.ground}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-xs text-neutral-400">Missing</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {stats.missing}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-xs text-neutral-400">Cost</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {stats.totalCost > 0 ? `$${stats.totalCost.toLocaleString()}` : '$0'}
          </p>
        </div>
      </div>
    </div>
  </Card>
);

export default TravelSummaryCard;
