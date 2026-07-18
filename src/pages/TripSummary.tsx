import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass, Download, Printer, Share2 } from 'lucide-react';
import { useTripData } from '../hooks/useTripData';
import { buildTripSummaryText, downloadTextFile, safeFilename } from '../utils/tripExport';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import InlineNotice from '../components/ui/InlineNotice';
import PageHeader from '../components/ui/PageHeader';
import TripNav from '../components/layout/TripNav';
import DossierCover from '../components/trip-summary/DossierCover';
import RouteSection from '../components/trip-summary/RouteSection';
import FlightSection from '../components/trip-summary/FlightSection';
import StaySection from '../components/trip-summary/StaySection';
import StopHighlightsSection from '../components/trip-summary/StopHighlightsSection';
import ItinerarySection from '../components/trip-summary/ItinerarySection';
import BudgetSection from '../components/trip-summary/BudgetSection';
import SavedLinksCard from '../components/trip-summary/SavedLinksCard';
import NotesSection from '../components/trip-summary/NotesSection';

const TripSummary: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const data = useTripData(tripId);
  const { trip } = data;
  const [actionStatus, setActionStatus] = useState<string | null>(null);

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

  const handleExport = () => {
    downloadTextFile(`${safeFilename(data.tripName)}-summary.txt`, buildTripSummaryText(data));
    setActionStatus('Itinerary exported.');
  };

  const handleShare = async () => {
    const shareData = {
      title: data.tripName,
      text: `${data.tripName} - ${data.isMultiStop ? data.routeLabel : trip.country}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionStatus('Share sheet opened.');
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setActionStatus('Trip link copied.');
    } catch {
      setActionStatus('Unable to share this trip right now.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const actionButtons = (variant: 'primary' | 'outline') => (
    <>
      <Button variant={variant === 'primary' ? 'primary' : 'outline'} size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => void handleShare()}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        className="print:hidden"
        title={data.tripName}
        subtitle={`Trip summary · ${data.locationLabel}`}
        actions={actionButtons('primary')}
      />

      <TripNav />

      {data.serviceError && (
        <InlineNotice variant="warning" className="print:hidden">
          Supabase trip details could not be loaded. Showing local trip data instead.
        </InlineNotice>
      )}

      {actionStatus && (
        <p role="status" aria-live="polite" className="print:hidden text-xs text-app-text-muted">
          {actionStatus}
        </p>
      )}

      <Card hover={false} className="mx-auto w-full max-w-3xl print:border-0 print:shadow-none">
        <DossierCover trip={trip} tripName={data.tripName} locationLabel={data.locationLabel} />
        <div className="divide-y divide-app-border-muted">
          {data.isMultiStop && (
            <RouteSection
              stops={data.orderedStops}
              segments={trip.transportSegments}
              getStopName={data.getStopName}
            />
          )}
          <FlightSection flight={data.selectedFlight} />
          {data.isMultiStop ? (
            <StopHighlightsSection highlights={data.stopHighlights} />
          ) : (
            <StaySection hotel={data.selectedHotel} />
          )}
          <ItinerarySection
            itinerary={data.itinerary}
            isMultiStop={data.isMultiStop}
            getStopForDay={data.getStopForDay}
          />
          <BudgetSection
            budget={data.budget}
            totalAllocated={data.totalAllocated}
            totalSpent={data.totalSpent}
          />
          <SavedLinksCard
            selectedFlight={data.selectedFlight}
            selectedHotel={data.selectedHotel}
            hotelLink={data.hotelLink}
          />
          <NotesSection
            notes={data.notes}
            checkedCount={data.checkedCount}
            checklistCount={data.checklist.length}
          />
          <div className="print:hidden flex flex-wrap items-center gap-2 px-6 py-4 sm:px-7">
            {actionButtons('outline')}
            {actionStatus && <span className="text-xs text-app-text-muted">{actionStatus}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TripSummary;
