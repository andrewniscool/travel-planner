import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTripData } from '../hooks/useTripData';
import { getUnfinishedSteps } from '../utils/planningChecklist';
import EmptyState from '../components/ui/EmptyState';
import InlineNotice from '../components/ui/InlineNotice';
import TripNav from '../components/layout/TripNav';
import TripHeroCard from '../components/trip-details/TripHeroCard';
import TripStatStrip from '../components/trip-details/TripStatStrip';
import RouteCard from '../components/trip-details/RouteCard';
import BookingsCard from '../components/trip-details/BookingsCard';
import ItineraryPreviewCard from '../components/trip-details/ItineraryPreviewCard';
import NextStepsCard from '../components/trip-details/NextStepsCard';
import BudgetSnapshotCard from '../components/trip-details/BudgetSnapshotCard';
import SavedPlacesCard from '../components/trip-details/SavedPlacesCard';

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const data = useTripData(tripId);
  const { trip } = data;

  if (data.isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <InlineNotice variant="loading">Loading trip...</InlineNotice>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-6 animate-fade-in">
        <EmptyState
          icon={<Compass className="h-8 w-8" />}
          title="Trip not found"
          description="The trip you are looking for does not exist or may have been removed."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const nextStepRoute = getUnfinishedSteps(trip.planningProgress)[0]?.route ?? 'itinerary';

  return (
    <div className="space-y-6 animate-fade-in">
      <TripHeroCard
        trip={trip}
        tripName={data.tripName}
        locationLabel={data.locationLabel}
        nextStepRoute={nextStepRoute}
      />

      <TripNav />

      {data.serviceError && (
        <InlineNotice variant="warning">
          Supabase trip details could not be loaded. Showing local trip data instead.
        </InlineNotice>
      )}

      <TripStatStrip
        tripLengthDays={data.tripLengthDays}
        totalBudget={data.totalAllocated}
        savedPlacesCount={data.savedPlaces.length}
        progress={trip.planningProgress}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {data.isMultiStop && (
            <RouteCard
              stops={data.orderedStops}
              segments={trip.transportSegments}
              getStopName={data.getStopName}
            />
          )}
          <BookingsCard
            tripId={trip.id}
            flight={data.selectedFlight}
            hotel={data.selectedHotel}
          />
          <ItineraryPreviewCard tripId={trip.id} itinerary={data.itinerary} />
        </div>
        <div className="space-y-4">
          <NextStepsCard tripId={trip.id} progress={trip.planningProgress} />
          <BudgetSnapshotCard
            tripId={trip.id}
            budget={data.budget}
            totalAllocated={data.totalAllocated}
            totalSpent={data.totalSpent}
          />
          <SavedPlacesCard tripId={trip.id} places={data.savedPlaces} />
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
