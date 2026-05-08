import React from 'react';
import { NavLink, useParams, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  Plane,
  Building2,
  CalendarDays,
  Map,
  Wallet,
  StickyNote,
  ClipboardCheck,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Create Trip', icon: PlusCircle, to: '/create-trip' },
  { label: 'Profile', icon: User, to: '/profile' },
];

const TRIP_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, to: '' },
  { label: 'Flights', icon: Plane, to: 'flights' },
  { label: 'Hotels', icon: Building2, to: 'hotels' },
  { label: 'Explore', icon: Compass, to: 'explore' },
  { label: 'Itinerary', icon: CalendarDays, to: 'itinerary' },
  { label: 'Map', icon: Map, to: 'map' },
  { label: 'Budget', icon: Wallet, to: 'budget' },
  { label: 'Notes', icon: StickyNote, to: 'notes' },
  { label: 'Summary', icon: ClipboardCheck, to: 'summary' },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { tripId } = useParams<{ tripId: string }>();
  const basePath = tripId ? `/trip/${tripId}` : '';

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
      isActive
        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
        : 'text-neutral-600 hover:bg-neutral-50',
    ].join(' ');

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-neutral-100">
        <Compass className="w-8 h-8 text-primary-600" />
        <span className="text-xl font-bold text-primary-600">Travel Builder</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Main
          </p>
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClasses} onClick={onClose}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Current Trip Section */}
        {tripId && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Current Trip
            </p>
            <ul className="space-y-1">
              {TRIP_NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to ? `${basePath}/${item.to}` : basePath}
                    end={item.to === ''}
                    className={linkClasses}
                    onClick={onClose}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User Info */}
      <Link to="/profile" className="border-t border-neutral-100 px-4 py-4 block hover:bg-neutral-50 transition-colors" onClick={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-700">AM</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">Alex M.</p>
            <p className="text-xs text-neutral-500">Free Plan</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
