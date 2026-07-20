import React, { useState } from 'react';
import { Building2, CalendarDays, ChevronDown, ExternalLink, MapPin, Pencil, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getStayNightCount } from '../../utils/planTimeline';
import { formatCurrency } from '../../utils/transportSegments';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Hotel } from '../../types';

const formatDate = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not set';

interface Props { hotel: Hotel; currency?: string; onEdit: (hotel: Hotel) => void; onDelete: (hotel: Hotel) => void; }

const StayCard: React.FC<Props> = ({ hotel, currency = 'USD', onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const nights = getStayNightCount(hotel);
  const bookingUrl = getSafeExternalUrl(hotel.bookingUrl || hotel.locationRef?.websiteUri);
  const location = hotel.neighborhood || hotel.locationRef?.formattedAddress || 'Location not added';
  return <div id={`stay-${hotel.id}`} className="scroll-mt-24">
    <Card hover={false} className="overflow-hidden border-primary-200">
      <div className="border-l-4 border-primary-500 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><Building2 className="h-5 w-5" /></span>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left" aria-expanded={expanded} aria-controls={`stay-details-${hotel.id}`}>
            <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700">Stay</p>{(!hotel.checkIn || !hotel.checkOut) && <Badge variant="warning">Dates needed</Badge>}</div>
            <h3 className="mt-1 truncate text-base font-semibold text-app-text-strong">{hotel.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-app-text-muted"><CalendarDays className="h-3.5 w-3.5" />{formatDate(hotel.checkIn)} → {formatDate(hotel.checkOut)}{nights ? ` · ${nights} night${nights === 1 ? '' : 's'}` : ''}</p>
            <p className="mt-1 truncate text-xs text-app-text-subtle">{location}{hotel.totalCost > 0 ? ` · ${formatCurrency(hotel.totalCost, currency)}` : ''}</p>
          </button>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onEdit(hotel)} className="rounded-lg p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={`Edit ${hotel.name}`}><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDelete(hotel)} className="rounded-lg p-2 text-app-text-subtle hover:bg-error-50 hover:text-error-600" aria-label={`Remove ${hotel.name}`}><Trash2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-app-text-subtle" aria-label={expanded ? 'Collapse stay details' : 'Expand stay details'}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
          </div>
        </div>
        {expanded && <div id={`stay-details-${hotel.id}`} className="mt-4 grid gap-3 rounded-xl bg-app-surface-muted p-3 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-app-text-subtle">Check-in</p><p className="font-medium text-app-text">{formatDate(hotel.checkIn)}</p></div>
          <div><p className="text-xs text-app-text-subtle">Check-out</p><p className="font-medium text-app-text">{formatDate(hotel.checkOut)}</p></div>
          <div><p className="text-xs text-app-text-subtle">Cost</p><p className="font-medium text-app-text">{hotel.totalCost > 0 ? formatCurrency(hotel.totalCost, currency) : 'Not added'}{hotel.pricePerNight > 0 ? ` · ${formatCurrency(hotel.pricePerNight, currency)}/night` : ''}</p></div>
          <div><p className="text-xs text-app-text-subtle">Confirmation</p><p className="font-medium text-app-text">{hotel.confirmationCode || 'Not added'}</p></div>
          <p className="flex items-start gap-1.5 text-app-text-muted sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{location}</p>
          {hotel.description && <p className="text-app-text-muted sm:col-span-2">{hotel.description}</p>}
          {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-700">Open booking <ExternalLink className="h-3.5 w-3.5" /></a>}
        </div>}
      </div>
    </Card>
  </div>;
};

export default StayCard;
