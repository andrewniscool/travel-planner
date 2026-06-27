import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import LandingLayout from './components/layout/LandingLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import Flights from './pages/Flights';
import Hotels from './pages/Hotels';
import Explore from './pages/Explore';
import Itinerary from './pages/Itinerary';
import MapPage from './pages/MapPage';
import Budget from './pages/Budget';
import Notes from './pages/Notes';
import TripSummary from './pages/TripSummary';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route element={<LandingLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>
          <Route path="/sign-in" element={<SignIn />} />
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
