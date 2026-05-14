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
  ClipboardCheck,
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
  { label: 'Summary', icon: ClipboardCheck, path: 'summary' },
];

const TripNav: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();

  if (!tripId) return null;

  const basePath = `/trip/${tripId}`;

  const tabClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 border-b-2',
      isActive
        ? 'text-primary-600 border-primary-600'
        : 'text-neutral-500 hover:text-neutral-700 border-transparent',
    ].join(' ');

  return (
    <nav
      className="bg-white border-b border-neutral-200"
      aria-label="Trip navigation"
    >
      <div className="overflow-x-auto scrollbar-hide">
        <ul className="flex min-w-max px-4 sm:px-6 lg:px-8">
          {TRIP_TABS.map((tab) => (
            <li key={tab.path}>
              <NavLink
                to={tab.path ? `${basePath}/${tab.path}` : basePath}
                end={tab.path === ''}
                className={tabClasses}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default TripNav;
