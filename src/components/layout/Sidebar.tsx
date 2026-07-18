import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Plane,
  Building2,
  CalendarDays,
  Map,
  Wallet,
  StickyNote,
  ClipboardCheck,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTripWorkspace } from '../../hooks/useTripWorkspace';
import TripSwitcher from './TripSwitcher';

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

const Sidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed, onToggleCollapse }) => {
  const { activeTripId } = useTripWorkspace();
  const { user } = useAuth();
  const displayName =
    typeof user?.user_metadata.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : (user?.email ?? 'Local User');
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      'flex h-10 items-center gap-3 overflow-hidden rounded-xl px-[18px] text-sm font-medium transition-colors duration-200',
      isActive
        ? 'bg-primary-600/[0.08] text-primary-700 font-semibold'
        : 'text-app-text-muted hover:bg-app-surface-muted hover:text-app-text',
    ].join(' ');

  return (
    <div className="flex h-full flex-col border-r border-app-border-muted bg-app-surface">
      <div className="relative flex h-16 items-center overflow-hidden border-b border-app-border-muted px-[18px]">
        <Link
          to="/dashboard"
          onClick={onClose}
          className={`flex min-w-0 items-center gap-2 transition-[max-width,opacity] duration-300 ease-in-out ${
            isCollapsed ? 'pointer-events-none max-w-0 opacity-0' : 'max-w-48 opacity-100'
          }`}
          tabIndex={isCollapsed ? -1 : undefined}
        >
          <Compass className="h-8 w-8 shrink-0 text-primary-600" />
          <span className="truncate text-xl font-bold text-primary-600">Travel Builder</span>
        </Link>
        <button
          type="button"
          className={`absolute top-3.5 hidden rounded-xl p-2 text-app-text-muted transition-[right,color,background-color] duration-300 ease-in-out hover:bg-app-surface-muted hover:text-app-text lg:flex ${
            isCollapsed ? 'right-[22px]' : 'right-3'
          }`}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="py-3">
        <div className="px-3">
          <NavLink
            to="/dashboard"
            className={linkClasses}
            onClick={onClose}
            title={isCollapsed ? 'My Trips' : undefined}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
              }`}
            >
              My Trips
            </span>
          </NavLink>
        </div>
      </div>

      <div className="border-y border-app-border-muted py-3">
        <p
          className={`overflow-hidden px-6 text-[11px] font-semibold uppercase tracking-wider text-app-text-subtle transition-[height,margin,opacity] duration-300 ease-in-out ${
            isCollapsed ? 'mb-0 h-0 opacity-0' : 'mb-2 h-4 opacity-100'
          }`}
        >
          Active trip
        </p>
        <TripSwitcher isCollapsed={isCollapsed} onNavigate={onClose} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Trip planning">
        {activeTripId && (
          <ul className="space-y-0.5">
            {TRIP_NAV.map((item) => {
              const path = item.to ? `/trip/${activeTripId}/${item.to}` : `/trip/${activeTripId}`;
              return (
                <li key={item.to}>
                  <NavLink
                    to={path}
                    end={item.to === ''}
                    className={linkClasses}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
                        isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <Link
        to="/profile"
        className="block border-t border-app-border-muted px-3 py-3 transition-colors hover:bg-app-surface-muted"
        onClick={onClose}
        title={isCollapsed ? displayName : undefined}
      >
        <div className="flex items-center gap-3 px-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <span className="text-sm font-semibold text-primary-700">{initials}</span>
          </div>
          <div
            className={`min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
            }`}
          >
            <p className="truncate text-sm font-medium text-app-text-strong">{displayName}</p>
            <p className="text-xs text-app-text-muted">{user ? 'Signed in' : 'Local fallback'}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
