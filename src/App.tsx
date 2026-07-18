import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
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
const Flights = lazy(() => import('./pages/Flights'));
const Hotels = lazy(() => import('./pages/Hotels'));
const Explore = lazy(() => import('./pages/Explore'));
const Itinerary = lazy(() => import('./pages/Itinerary'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Budget = lazy(() => import('./pages/Budget'));
const Notes = lazy(() => import('./pages/Notes'));
const TripSummary = lazy(() => import('./pages/TripSummary'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
                <Route path="/trip/:tripId/flights" element={<Flights />} />
                <Route path="/trip/:tripId/hotels" element={<Hotels />} />
                <Route path="/trip/:tripId/explore" element={<Explore />} />
                <Route path="/trip/:tripId/itinerary" element={<Itinerary />} />
                <Route path="/trip/:tripId/map" element={<MapPage />} />
                <Route path="/trip/:tripId/budget" element={<Budget />} />
                <Route path="/trip/:tripId/notes" element={<Notes />} />
                <Route path="/trip/:tripId/summary" element={<TripSummary />} />
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
