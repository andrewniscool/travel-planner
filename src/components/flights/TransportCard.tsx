import React from 'react';
import {
  AlertCircle,
  Bus,
  Car,
  ExternalLink,
  MapPin,
  Pencil,
  Plane,
  Ship,
  Train,
  Trash2,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import {
  formatCurrency,
  formatDateTime,
  getLocationName,
  getMissingDetails,
} from '../../utils/transportSegments';
import type { TransportMode, TransportSegment } from '../../types';

const modeIconMap: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  train: <Train className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  ferry: <Ship className="w-4 h-4" />,
  walk: <MapPin className="w-4 h-4" />,
  other: <MapPin className="w-4 h-4" />,
};

const formatMode = (mode: TransportMode) =>
  mode.charAt(0).toUpperCase() + mode.slice(1);

const formatRole = (role?: TransportSegment['role']) =>
  role
    ? role
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Travel';

interface TransportCardProps {
  segment: TransportSegment;
  getStopName: (stopId?: string) => string;
  onEdit: (segment: TransportSegment) => void;
  onDelete: (segmentId: string) => void;
}

const TransportCard: React.FC<TransportCardProps> = ({
  segment,
  getStopName,
  onEdit,
  onDelete,
}) => {
  const fromLabel = segment.fromStopId
    ? getStopName(segment.fromStopId)
    : getLocationName(segment.fromLocation, segment.departureLocation) || 'From';
  const toLabel = segment.toStopId
    ? getStopName(segment.toStopId)
    : getLocationName(segment.toLocation, segment.arrivalLocation) || 'To';
  const departureLabel =
    formatDateTime(segment.departureDateTime) || 'Departure not set';
  const arrivalLabel = formatDateTime(segment.arrivalDateTime) || 'Arrival not set';
  const priceLabel = formatCurrency(segment.price, segment.currency);
  const missingDetails = getMissingDetails(segment);

  return (
    <Card hover={false} className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            {modeIconMap[segment.mode]}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{formatMode(segment.mode)}</Badge>
              <Badge variant="warning">{formatRole(segment.role)}</Badge>
              {segment.isPrimary && <Badge variant="success">Primary</Badge>}
            </div>

            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              {fromLabel} <span className="text-neutral-300">→</span> {toLabel}
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              {[
                segment.provider || formatMode(segment.mode),
                segment.confirmationCode
                  ? `Confirmation ${segment.confirmationCode}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {missingDetails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {missingDetails.slice(0, 4).map((field) => (
                  <Badge key={field} variant="warning" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {field}
                  </Badge>
                ))}
                {missingDetails.length > 4 && (
                  <Badge variant="warning">
                    +{missingDetails.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {segment.notes && (
              <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                {segment.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-3 text-sm lg:w-72">
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">
              Depart
            </p>
            <p className="mt-1 font-semibold text-neutral-900">
              {departureLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">
              Arrive
            </p>
            <p className="mt-1 font-semibold text-neutral-900">{arrivalLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">
              Duration
            </p>
            <p className="mt-1 font-semibold text-neutral-900">
              {segment.duration || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-neutral-400">
              Cost
            </p>
            <p className="mt-1 font-semibold text-neutral-900">
              {priceLabel || 'Not set'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:w-36">
          {segment.bookingUrl && (
            <a
              href={segment.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-600 transition-colors hover:bg-primary-50"
              aria-label="Open booking details"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(segment)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Edit travel segment"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(segment.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-600"
            aria-label="Delete travel segment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default TransportCard;
