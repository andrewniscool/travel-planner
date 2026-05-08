import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Bell, User } from 'lucide-react';

interface TopNavProps {
  onMenuClick: () => void;
}

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  trip: 'Trip',
  'create-trip': 'Create Trip',
  flights: 'Flights',
  hotels: 'Hotels',
  explore: 'Explore',
  itinerary: 'Itinerary',
  map: 'Map',
  budget: 'Budget',
  notes: 'Notes',
  summary: 'Summary',
  settings: 'Settings',
  profile: 'Profile',
};

const buildBreadcrumbs = (pathname: string): { label: string; path: string }[] => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const segment = segments[i];

    // Skip trip ID segments (like trip-1, trip-2, or UUIDs)
    const isTripId = segment.startsWith('trip-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    if (isTripId) {
      crumbs.push({ label: 'Trip Details', path: currentPath });
      continue;
    }

    const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path: currentPath });
  }

  return crumbs;
};

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && (
                  <span className="text-neutral-300 mx-1">/</span>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-neutral-900 truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-neutral-500 hover:text-neutral-700 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Mobile: show only current page title */}
          <span className="sm:hidden text-sm font-medium text-neutral-900 truncate">
            {breadcrumbs.length > 0
              ? breadcrumbs[breadcrumbs.length - 1].label
              : 'Dashboard'}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-48 pl-9 pr-3 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-neutral-400 transition-colors"
            />
          </div>

          {/* Mobile Search Toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Avatar */}
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center hover:ring-2 hover:ring-primary-300 transition-all"
            aria-label="User menu"
          >
            <User className="w-4 h-4 text-primary-700" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
