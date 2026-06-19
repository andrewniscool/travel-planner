import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  MapPin,
  Globe,
  Camera,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { getLocalTrips } from '../hooks/useTrip';
import {
  profileService,
  savedPlaceService,
  tripService,
} from '../services/travelDataService';
import type { ProfileRow } from '../services/supabaseTypes';

const LOCAL_PROFILE_KEY = 'travel-builder:profile';
const LOCAL_SAVED_PLACES_KEY = 'travel-builder:saved-places';

type ProfileNotifications = {
  tripReminders: boolean;
  priceAlerts: boolean;
  newsletter: boolean;
  bookingUpdates: boolean;
};

type ProfileState = {
  name: string;
  email: string;
  location: string;
  website: string;
  bio: string;
  notifications: ProfileNotifications;
};

type LoadedProfileState = {
  profile: ProfileState;
  hasStoredProfile: boolean;
};

type ProfileStats = {
  tripsPlanned: number;
  countries: number;
  placesSaved: number;
  daysTraveled: number;
};

const defaultProfile = {
  name: 'Alex Mitchell',
  email: 'alex.mitchell@email.com',
  location: 'San Francisco, CA',
  website: '',
  bio: 'Travel enthusiast and adventure seeker. Always planning the next trip.',
  notifications: {
    tripReminders: true,
    priceAlerts: true,
    newsletter: false,
    bookingUpdates: true,
  },
} satisfies ProfileState;

const mergeProfile = (profile: Partial<ProfileState> = {}): ProfileState => ({
  ...defaultProfile,
  ...profile,
  notifications: {
    ...defaultProfile.notifications,
    ...(profile.notifications ?? {}),
  },
});

const loadProfile = (): LoadedProfileState => {
  try {
    const rawProfile = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!rawProfile) {
      return { profile: defaultProfile, hasStoredProfile: false };
    }

    const stored = JSON.parse(rawProfile) as Partial<ProfileState>;
    return {
      profile: mergeProfile(stored),
      hasStoredProfile: true,
    };
  } catch {
    return { profile: defaultProfile, hasStoredProfile: false };
  }
};

const persistLocalProfile = (profile: ProfileState) => {
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
};

const countTripDays = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1,
  );
};

const getLocalSavedPlacesCount = (tripIds: string[]) => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(LOCAL_SAVED_PLACES_KEY) ?? '{}',
    ) as Record<string, string[]>;
    const scopedTripIds = tripIds.length > 0 ? tripIds : Object.keys(stored);

    return scopedTripIds.reduce(
      (total, tripId) => total + (stored[tripId]?.length ?? 0),
      0,
    );
  } catch {
    return 0;
  }
};

const getLocalProfileStats = (): ProfileStats => {
  const trips = getLocalTrips();
  const countries = new Set(
    trips
      .flatMap((trip) => [
        trip.country,
        ...trip.stops.map((stop) => stop.country),
      ])
      .filter(Boolean),
  );

  return {
    tripsPlanned: trips.length,
    countries: countries.size,
    placesSaved: getLocalSavedPlacesCount(trips.map((trip) => trip.id)),
    daysTraveled: trips.reduce(
      (total, trip) => total + countTripDays(trip.startDate, trip.endDate),
      0,
    ),
  };
};

const getSupabaseProfileStats = async (
  userId: string,
): Promise<ProfileStats> => {
  const trips = await tripService.listTripsWithRelations(userId);
  const savedPlaceRowsByTrip = await Promise.all(
    trips.map((trip) => savedPlaceService.listSavedPlaces(trip.id)),
  );
  const countries = new Set(
    trips
      .flatMap((trip) => [
        trip.country,
        ...trip.trip_stops.map((stop) => stop.country),
      ])
      .filter(Boolean),
  );

  return {
    tripsPlanned: trips.length,
    countries: countries.size,
    placesSaved: savedPlaceRowsByTrip.reduce(
      (total, rows) => total + rows.filter((row) => row.is_saved).length,
      0,
    ),
    daysTraveled: trips.reduce(
      (total, trip) => total + countTripDays(trip.start_date, trip.end_date),
      0,
    ),
  };
};

const normalizeNotifications = (
  value: unknown,
  fallback: ProfileNotifications = defaultProfile.notifications,
): ProfileNotifications => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const preferences = value as Partial<Record<keyof ProfileNotifications, unknown>>;

  return {
    tripReminders:
      typeof preferences.tripReminders === 'boolean'
        ? preferences.tripReminders
        : fallback.tripReminders,
    priceAlerts:
      typeof preferences.priceAlerts === 'boolean'
        ? preferences.priceAlerts
        : fallback.priceAlerts,
    newsletter:
      typeof preferences.newsletter === 'boolean'
        ? preferences.newsletter
        : fallback.newsletter,
    bookingUpdates:
      typeof preferences.bookingUpdates === 'boolean'
        ? preferences.bookingUpdates
        : fallback.bookingUpdates,
  };
};

const getAuthFullName = (user: ReturnType<typeof useAuth>['user']) =>
  typeof user?.user_metadata.full_name === 'string'
    ? user.user_metadata.full_name
    : '';

const createAuthenticatedFallbackProfile = (
  user: NonNullable<ReturnType<typeof useAuth>['user']>,
  storedProfile: ProfileState,
  hasStoredProfile: boolean,
): ProfileState => {
  const authName = getAuthFullName(user);

  if (hasStoredProfile) {
    return {
      ...storedProfile,
      name: authName || storedProfile.name,
      email: user.email ?? storedProfile.email,
    };
  }

  return {
    ...defaultProfile,
    name: authName,
    email: user.email ?? '',
    location: '',
    website: '',
    bio: '',
  };
};

const mapProfileRowToState = (
  row: ProfileRow | null,
  fallback: ProfileState,
  authEmail?: string,
  authName?: string,
): ProfileState => ({
  name: row?.full_name ?? authName ?? fallback.name,
  email: row?.email ?? authEmail ?? fallback.email,
  location: row?.location ?? fallback.location,
  website: row?.website ?? fallback.website,
  bio: row?.bio ?? fallback.bio,
  notifications: normalizeNotifications(
    row?.notification_preferences,
    fallback.notifications,
  ),
});

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile: storedProfile, hasStoredProfile } = useMemo(
    () => loadProfile(),
    [],
  );
  const authName = getAuthFullName(user);
  const [name, setName] = useState(authName || storedProfile.name);
  const [email, setEmail] = useState(user?.email ?? storedProfile.email);
  const [location, setLocation] = useState(storedProfile.location);
  const [website, setWebsite] = useState(storedProfile.website);
  const [bio, setBio] = useState(storedProfile.bio);
  const [saved, setSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(Boolean(user));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(Boolean(user));

  const [notifications, setNotifications] = useState(storedProfile.notifications);
  const [stats, setStats] = useState<ProfileStats>(() => getLocalProfileStats());

  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseProfile() {
      if (!user) {
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const row = await profileService.getProfile(user.id);
        if (!isMounted) return;

        const fallbackProfile = createAuthenticatedFallbackProfile(
          user,
          storedProfile,
          hasStoredProfile,
        );
        const nextProfile = mapProfileRowToState(
          row,
          fallbackProfile,
          user.email ?? undefined,
          getAuthFullName(user) || undefined,
        );

        setName(nextProfile.name);
        setEmail(nextProfile.email);
        setLocation(nextProfile.location);
        setWebsite(nextProfile.website);
        setBio(nextProfile.bio);
        setNotifications(nextProfile.notifications);
        persistLocalProfile(nextProfile);
      } catch {
        if (!isMounted) return;
        setProfileError('Supabase profile could not be loaded. Showing local profile instead.');
        const fallbackProfile = createAuthenticatedFallbackProfile(
          user,
          storedProfile,
          hasStoredProfile,
        );
        setName(fallbackProfile.name);
        setEmail(fallbackProfile.email);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    void loadSupabaseProfile();

    return () => {
      isMounted = false;
    };
  }, [hasStoredProfile, storedProfile, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!user) {
        setStats(getLocalProfileStats());
        setStatsError(null);
        setIsStatsLoading(false);
        return;
      }

      setIsStatsLoading(true);
      setStatsError(null);

      try {
        const nextStats = await getSupabaseProfileStats(user.id);
        if (!isMounted) return;
        setStats(nextStats);
      } catch {
        if (!isMounted) return;
        setStats(getLocalProfileStats());
        setStatsError('Supabase stats could not be loaded. Showing local stats instead.');
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async () => {
    const nextProfile = { name, email, location, website, bio, notifications };

    persistLocalProfile(nextProfile);
    setProfileError(null);
    setIsSavingProfile(true);

    try {
      if (user) {
        await profileService.upsertProfile({
          id: user.id,
          email: user.email ?? email,
          full_name: name.trim() || null,
          avatar_url:
            typeof user.user_metadata.avatar_url === 'string'
              ? user.user_metadata.avatar_url
              : null,
          location: location.trim() || null,
          website: website.trim() || null,
          bio: bio.trim() || null,
          notification_preferences: notifications,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setProfileError('Supabase profile save failed. Changes were saved locally instead.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveNotificationPreference = async (
    nextNotifications: ProfileNotifications,
  ) => {
    const nextProfile = {
      name,
      email,
      location,
      website,
      bio,
      notifications: nextNotifications,
    };

    persistLocalProfile(nextProfile);

    if (!user) return;

    try {
      await profileService.upsertProfile({
        id: user.id,
        email: user.email ?? email,
        full_name: name.trim() || null,
        avatar_url:
          typeof user.user_metadata.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : null,
        location: location.trim() || null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        notification_preferences: nextNotifications,
      });
      setProfileError(null);
    } catch {
      setProfileError('Supabase notification update failed. Changes were saved locally instead.');
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      void saveNotificationPreference(next);
      return next;
    });
  };

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  const handleSignOut = async () => {
    setAccountError(null);

    try {
      await signOut();
      navigate('/sign-in');
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : 'Unable to sign out.',
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="text-neutral-500 mt-1">Manage your account settings and preferences</p>
        {(profileError || isProfileLoading) && (
          <p
            className={[
              'mt-2 text-sm',
              profileError ? 'text-warning-700' : 'text-neutral-500',
            ].join(' ')}
          >
            {profileError || 'Loading your Supabase profile...'}
          </p>
        )}
      </div>

      {/* Profile Header Card */}
      <Card hover={false} className="overflow-hidden">
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500" />
          {/* Avatar + Name */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                  <span className="text-2xl font-bold text-primary-600">
                    {initials}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 sm:pb-1">
                <h2 className="text-xl font-bold text-neutral-900">{name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {location}
                  </span>
                </div>
              </div>
              <Badge variant="default">{user ? 'Signed In' : 'Local Mode'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card hover={false}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              icon={<User className="w-4 h-4 text-neutral-400" />}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(user)}
              placeholder="your@email.com"
              icon={<Mail className="w-4 h-4 text-neutral-400" />}
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              icon={<MapPin className="w-4 h-4 text-neutral-400" />}
            />
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              icon={<Globe className="w-4 h-4 text-neutral-400" />}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-success-600 animate-fade-in">
                <Check className="w-4 h-4" />
                Changes saved
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isProfileLoading || isSavingProfile}
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Travel Stats */}
      <Card hover={false}>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-neutral-900">Travel Stats</h3>
            {isStatsLoading && (
              <span className="text-xs font-medium text-neutral-500">Syncing...</span>
            )}
          </div>
          {statsError && (
            <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">
              {statsError}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">
                {stats.tripsPlanned}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Trips Planned</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-accent-600">
                {stats.countries}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Countries</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-success-600">
                {stats.placesSaved}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Places Saved</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-neutral-700">
                {stats.daysTraveled}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Days Traveled</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card hover={false}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'tripReminders' as const, label: 'Trip Reminders', desc: 'Get notified about upcoming trips and deadlines', icon: Bell },
              { key: 'priceAlerts' as const, label: 'Price Alerts', desc: 'Receive alerts when flight or hotel prices drop', icon: CreditCard },
              { key: 'newsletter' as const, label: 'Newsletter', desc: 'Weekly travel tips and destination inspiration', icon: Mail },
              { key: 'bookingUpdates' as const, label: 'Booking Updates', desc: 'Status changes for your saved bookings', icon: Shield },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    notifications[item.key] ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card hover={false}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Account</h3>
          <div className="space-y-1">
            {[
              { label: 'Change Password', desc: 'Update your account password', icon: Shield },
              { label: 'Billing & Plan', desc: 'Manage your subscription and payment methods', icon: CreditCard },
              { label: 'Export Data', desc: 'Download all your trip data', icon: Globe },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100">
            {accountError && (
              <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                {accountError}
              </p>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-error-500 hover:text-error-600 transition-colors px-3 py-2 rounded-lg hover:bg-error-50"
            >
              <LogOut className="w-4 h-4" />
              {user ? 'Sign Out' : 'Go to Sign In'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
