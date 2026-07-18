import React from 'react';
import { Bookmark, CalendarDays, CheckCircle2, Wallet } from 'lucide-react';
import Card from '../ui/Card';
import IconChip from '../ui/IconChip';
import type { BudgetCurrency } from '../../types';
import { formatBudgetAmount } from '../../utils/budget';

interface TripStatStripProps {
  tripLengthDays: number;
  totalBudget: number;
  savedPlacesCount: number;
  progress: number;
  currency?: BudgetCurrency;
}

const TripStatStrip: React.FC<TripStatStripProps> = ({
  tripLengthDays,
  totalBudget,
  savedPlacesCount,
  progress,
  currency,
}) => {
  const stats = [
    {
      icon: CalendarDays,
      value: tripLengthDays > 0 ? `${tripLengthDays} days` : 'Dates TBD',
      label: 'Trip length',
    },
    { icon: Wallet, value: formatBudgetAmount(totalBudget, currency), label: 'Est. total cost' },
    { icon: Bookmark, value: savedPlacesCount, label: 'Saved places' },
    { icon: CheckCircle2, value: `${progress}%`, label: 'Planning progress' },
  ];

  return (
    <Card
      hover={false}
      className="flex flex-col divide-y divide-app-border-muted sm:flex-row sm:divide-x sm:divide-y-0"
    >
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-1 items-center gap-3 px-5 py-3">
          <IconChip icon={<Icon className="h-4 w-4" />} />
          <div>
            <p className="text-lg font-semibold text-app-text-strong">{value}</p>
            <p className="text-xs text-app-text-muted">{label}</p>
          </div>
        </div>
      ))}
    </Card>
  );
};

export default TripStatStrip;
