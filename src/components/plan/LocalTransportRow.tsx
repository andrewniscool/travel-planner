import React, { useState } from 'react';
import { ArrowRight, Bus, Car, ChevronDown, ExternalLink, Footprints, MapPin, Pencil, Plane, Ship, Train, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/transportSegments';
import { formatLocalDateTime } from '../../utils/planTimeline';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { TransportMode, TransportSegment } from '../../types';

const icons: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />, train: <Train className="h-4 w-4" />,
  bus: <Bus className="h-4 w-4" />, car: <Car className="h-4 w-4" />,
  ferry: <Ship className="h-4 w-4" />, walk: <Footprints className="h-4 w-4" />,
  other: <MapPin className="h-4 w-4" />,
};

interface Props { segment: TransportSegment; onEdit: (segment: TransportSegment) => void; onDelete: (segment: TransportSegment) => void; }

const LocalTransportRow: React.FC<Props> = ({ segment, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const bookingUrl = getSafeExternalUrl(segment.bookingUrl);
  const hasDetails = Boolean(segment.confirmationCode || segment.price || segment.notes || bookingUrl);
  return <div id={`travel-${segment.id}`} className="scroll-mt-24">
    <Card hover={false} className="p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700">{icons[segment.mode]}</span>
        <button type="button" disabled={!hasDetails} onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left disabled:cursor-default" aria-expanded={hasDetails ? expanded : undefined}>
          <p className="flex items-center gap-2 text-sm font-semibold text-app-text-strong"><span className="truncate">{segment.departureLocation || 'Origin'}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-500" /><span className="truncate">{segment.arrivalLocation || 'Destination'}</span></p>
          <p className="mt-0.5 text-xs text-app-text-muted">{formatLocalDateTime(segment.departureDateTime) || 'Time not set'} · {segment.provider || segment.mode}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onEdit(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Edit local transportation"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label="Delete local transportation"><Trash2 className="h-4 w-4" /></button>
          {hasDetails && <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-app-text-subtle" aria-label={expanded ? 'Collapse details' : 'Expand details'}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>}
        </div>
      </div>
      {expanded && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-app-border-muted pt-3 text-xs text-app-text-muted">
        {segment.confirmationCode && <span>Confirmation <strong className="text-app-text">{segment.confirmationCode}</strong></span>}
        {typeof segment.price === 'number' && <span>{formatCurrency(segment.price, segment.currency)}</span>}
        {segment.notes && <span className="w-full">{segment.notes}</span>}
        {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-700">Booking <ExternalLink className="h-3 w-3" /></a>}
      </div>}
    </Card>
  </div>;
};

export default LocalTransportRow;
