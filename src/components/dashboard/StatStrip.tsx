import React from 'react';
import { Bookmark, Calendar, Wallet } from 'lucide-react';
import Card from '../ui/Card';
const StatStrip: React.FC<{ upcomingCount: number; plannedSpend: number; savedPlaces: number }> = ({
  upcomingCount,
  plannedSpend,
  savedPlaces,
}) => {
  const stats = [
    { icon: Calendar, value: upcomingCount, label: 'Upcoming trips' },
    {
      icon: Wallet,
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(plannedSpend),
      label: 'Planned spend',
    },
    { icon: Bookmark, value: savedPlaces, label: 'Saved places' },
  ];
  return (
    <Card
      hover={false}
      className="flex flex-col divide-y divide-app-border-muted sm:flex-row sm:divide-x sm:divide-y-0"
    >
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-1 items-center gap-3 px-5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-lg font-semibold text-app-text-strong">{value}</p>
            <p className="text-xs text-app-text-muted">{label}</p>
          </div>
        </div>
      ))}
    </Card>
  );
};
export default StatStrip;
