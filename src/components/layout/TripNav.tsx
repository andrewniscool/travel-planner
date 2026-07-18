import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Building2,
  Compass,
  CalendarDays,
  Map,
  Wallet,
  StickyNote,
} from 'lucide-react';

interface TripTab {
  label: string;
  icon: React.ElementType;
  path: string;
}

const TRIP_TABS: TripTab[] = [
  { label: 'Overview', icon: LayoutDashboard, path: '' },
  { label: 'Travel', icon: Plane, path: 'flights' },
  { label: 'Hotels', icon: Building2, path: 'hotels' },
  { label: 'Explore', icon: Compass, path: 'explore' },
  { label: 'Itinerary', icon: CalendarDays, path: 'itinerary' },
  { label: 'Map', icon: Map, path: 'map' },
  { label: 'Budget', icon: Wallet, path: 'budget' },
  { label: 'Notes', icon: StickyNote, path: 'notes' },
];

const TripNav: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { tripId } = useParams<{ tripId: string }>();

  if (!tripId) return null;

  const basePath = `/trip/${tripId}`;

  const tabClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg',
      isActive
        ? 'bg-primary-600 text-white'
        : 'bg-app-surface-muted text-app-text-muted hover:bg-neutral-200 hover:text-app-text',
    ].join(' ');

  return (
    <nav aria-label="Trip navigation" className={['print:hidden', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TRIP_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path ? `${basePath}/${tab.path}` : basePath}
            end={tab.path === ''}
            className={tabClasses}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default TripNav;
