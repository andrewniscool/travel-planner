import React from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import Button from '../ui/Button';

interface SummaryActionsProps {
  actionStatus: string | null;
  onExport: () => void;
  onShare: () => void;
  onPrint: () => void;
}

const SummaryActions: React.FC<SummaryActionsProps> = ({
  actionStatus,
  onExport,
  onShare,
  onPrint,
}) => (
  <div className="flex flex-wrap items-center gap-3 pb-6">
    <Button variant="outline" size="md" onClick={onExport}>
      <Download className="w-4 h-4 mr-2" />
      Export Itinerary
    </Button>
    <Button variant="outline" size="md" onClick={onShare}>
      <Share2 className="w-4 h-4 mr-2" />
      Share Trip
    </Button>
    <Button variant="outline" size="md" onClick={onPrint}>
      <Printer className="w-4 h-4 mr-2" />
      Print
    </Button>
    {actionStatus && (
      <span className="text-sm text-neutral-500">{actionStatus}</span>
    )}
  </div>
);

export default SummaryActions;
