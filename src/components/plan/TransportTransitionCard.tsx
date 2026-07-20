import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Bus, Car, ChevronDown, ExternalLink, MapPin, Pencil, Plane, Ship, Train, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatCurrency, getMissingDetails } from '../../utils/transportSegments';
import { formatLocalDateTime } from '../../utils/planTimeline';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { TransportMode, TransportSegment } from '../../types';

const icons: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="h-5 w-5" />, train: <Train className="h-5 w-5" />,
  bus: <Bus className="h-5 w-5" />, car: <Car className="h-5 w-5" />,
  ferry: <Ship className="h-5 w-5" />, walk: <MapPin className="h-5 w-5" />,
  other: <MapPin className="h-5 w-5" />,
};

interface Props {
  segment: TransportSegment;
  fromLabel?: string;
  toLabel?: string;
  onEdit: (segment: TransportSegment) => void;
  onDelete: (segment: TransportSegment) => void;
}

const TransportTransitionCard: React.FC<Props> = ({ segment, fromLabel, toLabel, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const from = fromLabel || segment.fromLocation?.displayName || segment.fromLocation?.name || segment.departureLocation || 'Origin';
  const to = toLabel || segment.toLocation?.displayName || segment.toLocation?.name || segment.arrivalLocation || 'Destination';
  const bookingUrl = getSafeExternalUrl(segment.bookingUrl);
  const missing = getMissingDetails(segment);

  return (
    <div id={`travel-${segment.id}`} className="scroll-mt-24">
    <Card hover={false} className="overflow-hidden border-accent-200">
      <div className="border-l-4 border-accent-500 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">{icons[segment.mode]}</span>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-expanded={expanded} aria-controls={`travel-details-${segment.id}`}>
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-eyebrow text-accent-700">Travel to {to}</p><Badge>{segment.mode}</Badge>{missing.length > 0 && <Badge variant="warning" className="gap-1"><AlertCircle className="h-3 w-3" />{missing.length} missing</Badge>}</div>
            <div className="mt-2 flex min-w-0 items-center gap-2 text-base font-semibold text-app-text-strong"><span className="truncate">{from}</span><ArrowRight className="h-4 w-4 shrink-0 text-accent-500" /><span className="truncate">{to}</span></div>
            <p className="mt-1 text-sm text-app-text-muted">{formatLocalDateTime(segment.departureDateTime) || 'Departure not set'} · {segment.provider || `${segment.mode[0].toUpperCase()}${segment.mode.slice(1)}`}{segment.duration ? ` · ${segment.duration}` : ''}</p>
          </button>
          <div className="flex shrink-0 gap-1">
            {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Open booking"><ExternalLink className="h-4 w-4" /></a>}
            <button type="button" onClick={() => onEdit(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label="Edit transportation"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDelete(segment)} className="rounded-lg p-2 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label="Delete transportation"><Trash2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={expanded ? 'Collapse travel details' : 'Expand travel details'}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
          </div>
        </div>
        {expanded && <div id={`travel-details-${segment.id}`} className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-app-surface-muted p-3 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-app-text-subtle">Depart</p><p className="mt-0.5 font-medium text-app-text">{formatLocalDateTime(segment.departureDateTime) || 'Not set'}</p></div>
          <div><p className="text-xs text-app-text-subtle">Arrive</p><p className="mt-0.5 font-medium text-app-text">{formatLocalDateTime(segment.arrivalDateTime) || 'Not set'}</p></div>
          <div><p className="text-xs text-app-text-subtle">Confirmation</p><p className="mt-0.5 font-medium text-app-text">{segment.confirmationCode || 'Not added'}</p></div>
          <div><p className="text-xs text-app-text-subtle">Cost</p><p className="mt-0.5 font-medium text-app-text">{formatCurrency(segment.price, segment.currency) || 'Not added'}</p></div>
          {segment.notes && <p className="col-span-2 text-sm text-app-text-muted sm:col-span-4">{segment.notes}</p>}
        </div>}
      </div>
    </Card>
    </div>
  );
};

export default TransportTransitionCard;
