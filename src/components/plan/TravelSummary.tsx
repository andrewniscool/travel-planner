import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Plane, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrency, formatDateTime } from '../../utils/transportSegments';
import { sortPlanTransport } from '../../utils/planTransport';
import type { TransportSegment, TripStop } from '../../types';

interface MissingConnection { fromStop: TripStop; toStop: TripStop; }
interface Props { segments: TransportSegment[]; missing: MissingConnection[]; onAdd: () => void; }

const TravelSummary: React.FC<Props> = ({ segments, missing, onAdd }) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortPlanTransport(segments);
  const next = sorted.find((segment) => {
    const time = segment.departureDateTime ? new Date(segment.departureDateTime).getTime() : 0;
    return time >= Date.now();
  }) ?? sorted[0];
  const totals = new Map<string, number>();
  segments.forEach((segment) => {
    if (typeof segment.price !== 'number') return;
    const currency = segment.currency || 'USD';
    totals.set(currency, (totals.get(currency) || 0) + segment.price);
  });
  const cost = [...totals.entries()].map(([currency, amount]) => formatCurrency(amount, currency)).join(' + ') || 'No costs yet';

  return (
    <Card hover={false} className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => setExpanded((value) => !value)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700"><Plane className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-semibold text-app-text-strong">Travel</h2>{missing.length > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700"><AlertCircle className="h-3.5 w-3.5" />{missing.length} missing</span>}</div><p className="truncate text-sm text-app-text-muted">{next ? `Next: ${next.departureLocation} → ${next.arrivalLocation} · ${formatDateTime(next.departureDateTime) || 'date needed'}` : 'No transportation added yet'}</p></div>
          {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-app-text-subtle" /> : <ChevronDown className="h-4 w-4 shrink-0 text-app-text-subtle" />}
        </button>
        <div className="flex items-center gap-4 sm:shrink-0"><div className="text-right"><p className="text-sm font-semibold text-app-text-strong">{segments.length} leg{segments.length === 1 ? '' : 's'}</p><p className="text-xs text-app-text-muted">{cost}</p></div><Button size="sm" variant="outline" onClick={onAdd}><Plus className="mr-1.5 h-4 w-4" />Add</Button></div>
      </div>
      {expanded && <div className="mt-4 space-y-2 border-t border-app-border-muted pt-4">{sorted.map((segment) => <a key={segment.id} href={`#travel-${segment.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm hover:bg-app-surface-muted"><span className="min-w-0 truncate font-medium text-app-text">{segment.departureLocation} → {segment.arrivalLocation}</span><span className="shrink-0 text-xs text-app-text-muted">{formatDateTime(segment.departureDateTime) || 'Unscheduled'}</span></a>)}{sorted.length === 0 && <p className="text-sm text-app-text-subtle">Add a flight, train, drive, or other travel leg.</p>}</div>}
    </Card>
  );
};

export default TravelSummary;
