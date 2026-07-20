import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import LandingLayout from './components/layout/LandingLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Itinerary = lazy(() => import('./pages/Itinerary'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Budget = lazy(() => import('./pages/Budget'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LegacyTripRedirect = ({ intent }: { intent?: string }) => {
  const { tripId } = useParams<{ tripId: string }>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (intent) params.set('add', intent);
  const search = params.toString();
  return <Navigate to={`/trip/${tripId}/plan${search ? `?${search}` : ''}`} replace />;
};

declare const __LANDING_PAGE_ENABLED__: boolean;
declare const __DEV_AUTH_BYPASS_ENABLED__: boolean;

const RouteFallback = () => (
  <div className="flex min-h-64 items-center justify-center text-sm text-app-text-muted">
    Loading...
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {__LANDING_PAGE_ENABLED__ ? (
                <Route element={<LandingLayout />}>
                  <Route path="/" element={<Landing />} />
                </Route>
              ) : (
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              )}
              <Route
                path="/sign-in"
                element={
                  __DEV_AUTH_BYPASS_ENABLED__ ? <Navigate to="/dashboard" replace /> : <SignIn />
                }
              />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-trip" element={<CreateTrip />} />
                <Route path="/trip/:tripId" element={<TripDetails />} />
                <Route path="/trip/:tripId/edit" element={<CreateTrip />} />
                <Route path="/trip/:tripId/plan" element={<Itinerary />} />
                <Route path="/trip/:tripId/bookings" element={<Bookings />} />
                <Route path="/trip/:tripId/flights" element={<LegacyTripRedirect intent="transport" />} />
                <Route path="/trip/:tripId/hotels" element={<LegacyTripRedirect intent="stay" />} />
                <Route path="/trip/:tripId/explore" element={<LegacyTripRedirect intent="place" />} />
                <Route path="/trip/:tripId/itinerary" element={<LegacyTripRedirect />} />
                <Route path="/trip/:tripId/map" element={<MapPage />} />
                <Route path="/trip/:tripId/budget" element={<Budget />} />
                <Route path="/trip/:tripId/notes" element={<LegacyTripRedirect intent="note" />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
