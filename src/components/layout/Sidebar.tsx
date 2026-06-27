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
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const basePath = tripId ? `/trip/${tripId}` : '';
  const displayName =
    typeof user?.user_metadata.full_name === 'string' &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user?.email ?? 'Local User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-[color,background-color,border-color,padding] duration-500 ease-in-out',
      isCollapsed ? 'pl-[18px] pr-[18px]' : 'px-3',
      isActive
        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
        : 'text-neutral-600 hover:bg-neutral-50',
    ].join(' ');

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 dark:bg-[var(--app-surface)] dark:border-[var(--app-border)]">
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-neutral-100 transition-[padding] duration-500 ease-in-out ${
        isCollapsed ? 'px-[1.125rem]' : 'px-6'
      }`}>
        <div
          className={`flex items-center gap-2 min-w-0 overflow-hidden transition-all duration-500 ease-in-out ${
            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-44 opacity-100'
          }`}
        >
          <Compass className="w-8 h-8 text-primary-600 flex-shrink-0" />
          <span className="overflow-hidden whitespace-nowrap text-xl font-bold text-primary-600">
            Travel Builder
          </span>
        </div>
        <button
          type="button"
          className="ml-auto hidden p-2 rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:flex"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <p className={`px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider transition-all duration-500 ease-in-out ${
            isCollapsed ? 'h-0 mb-0 overflow-hidden opacity-0' : 'h-4 opacity-100'
          }`}>
            Main
          </p>
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={linkClasses}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${
                      isCollapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Current Trip Section */}
        {tripId && (
          <div>
            <p className={`px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider transition-all duration-500 ease-in-out ${
              isCollapsed ? 'h-0 mb-0 overflow-hidden opacity-0' : 'h-4 opacity-100'
            }`}>
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
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${
                        isCollapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User Info */}
      <Link
        to="/profile"
        className={`block border-t border-neutral-100 py-4 hover:bg-neutral-50 transition-[background-color,padding] duration-500 ease-in-out ${
          isCollapsed ? 'pl-[1.375rem] pr-[1.375rem]' : 'px-4'
        }`}
        onClick={onClose}
        title={isCollapsed ? displayName : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-700">
              {initials}
            </span>
          </div>
          <div className={`min-w-0 overflow-hidden transition-all duration-500 ease-in-out ${
            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
          }`}>
            <p className="text-sm font-medium text-neutral-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-neutral-500">
              {user ? 'Signed in' : 'Local fallback'}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
