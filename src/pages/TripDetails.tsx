import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass, Download, Printer, Share2 } from 'lucide-react';
import { useTripData } from '../hooks/useTripData';
import { getNextTripAction } from '../utils/nextTripAction';
import { buildTripSummaryText, downloadTextFile, safeFilename } from '../utils/tripExport';
import EmptyState from '../components/ui/EmptyState';
import InlineNotice from '../components/ui/InlineNotice';
import TripHeroCard from '../components/trip-details/TripHeroCard';
import ItineraryPreviewCard from '../components/trip-details/ItineraryPreviewCard';
import NextActionCard from '../components/trip-details/NextActionCard';
import BudgetSnapshotCard from '../components/trip-details/BudgetSnapshotCard';
import OverflowMenu from '../components/ui/OverflowMenu';

const TripDetails: React.FC = () => {
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

  const nextAction = getNextTripAction(data);

  const handleExport = () => {
    downloadTextFile(`${safeFilename(data.tripName)}-summary.txt`, buildTripSummaryText(data));
    setActionStatus('Trip exported.');
  };

  const handleShare = async () => {
    const shareData = {
      title: data.tripName,
      text: `${data.tripName} - ${data.locationLabel}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionStatus('Trip shared.');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setActionStatus('Trip link copied.');
      }
    } catch {
      setActionStatus('Unable to share this trip right now.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <TripHeroCard
        trip={trip}
        tripName={data.tripName}
        locationLabel={data.locationLabel}
        actions={
          <OverflowMenu
            label="Export, share, or print trip"
            items={[
              { label: 'Export', icon: <Download className="h-4 w-4" />, onSelect: handleExport },
              {
                label: 'Share',
                icon: <Share2 className="h-4 w-4" />,
                onSelect: () => void handleShare(),
              },
              {
                label: 'Print',
                icon: <Printer className="h-4 w-4" />,
                onSelect: () => window.print(),
              },
            ]}
            buttonClassName="h-8 w-8 border border-app-border"
            menuClassName="!bottom-full !top-auto !mb-1 !mt-0"
          />
        }
      />

      {actionStatus && (
        <p role="status" aria-live="polite" className="text-xs text-app-text-muted">
          {actionStatus}
        </p>
      )}

      {data.serviceError && (
        <InlineNotice variant="warning">
          Supabase trip details could not be loaded. Showing local trip data instead.
        </InlineNotice>
      )}

      <NextActionCard tripId={trip.id} action={nextAction} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ItineraryPreviewCard tripId={trip.id} itinerary={data.itinerary} />
        </div>
        <div className="space-y-4">
          <BudgetSnapshotCard
            tripId={trip.id}
            budget={data.budget}
            totalAllocated={data.totalAllocated}
            totalSpent={data.totalSpent}
            currency={trip.budgetCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
