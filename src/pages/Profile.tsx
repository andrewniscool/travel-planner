import React, { useEffect, useState } from 'react';
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

const LOCAL_PROFILE_KEY = 'travel-builder:profile';

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

const loadProfile = (): ProfileState => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_PROFILE_KEY) ?? '{}') as Partial<ProfileState>;
    return {
      ...defaultProfile,
      ...stored,
      notifications: {
        ...defaultProfile.notifications,
        ...(stored.notifications ?? {}),
      },
    };
  } catch {
    return defaultProfile;
  }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const storedProfile = loadProfile();
  const authName =
    typeof user?.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : '';
  const [name, setName] = useState(authName || storedProfile.name);
  const [email, setEmail] = useState(user?.email ?? storedProfile.email);
  const [location, setLocation] = useState(storedProfile.location);
  const [website, setWebsite] = useState(storedProfile.website);
  const [bio, setBio] = useState(storedProfile.bio);
  const [saved, setSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState(storedProfile.notifications);

  useEffect(() => {
    if (!user) return;
    const nextName =
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : '';
    setName(nextName || storedProfile.name);
    setEmail(user.email ?? storedProfile.email);
  }, [storedProfile.email, storedProfile.name, user]);

  const handleSave = () => {
    window.localStorage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({ name, email, location, website, bio, notifications })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      window.localStorage.setItem(
        LOCAL_PROFILE_KEY,
        JSON.stringify({ name, email, location, website, bio, notifications: next })
      );
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
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Travel Stats */}
      <Card hover={false}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Travel Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">5</p>
              <p className="text-sm text-neutral-500 mt-1">Trips Planned</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-accent-600">8</p>
              <p className="text-sm text-neutral-500 mt-1">Countries</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-success-600">24</p>
              <p className="text-sm text-neutral-500 mt-1">Places Saved</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <p className="text-2xl font-bold text-neutral-700">42</p>
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
