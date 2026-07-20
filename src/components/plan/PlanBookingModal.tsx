import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import LocationInput from '../ui/LocationInput';
import { DatePicker } from '../ui/DatePicker';
import type { BudgetCurrency, LocationRef, TransportMode, TransportRole, TripStop } from '../../types';

export interface PlanTransportDraft {
  mode: TransportMode; provider: string; from: LocationRef | null; to: LocationRef | null;
  departure: string; arrival: string; price: string; confirmationCode: string;
  role: TransportRole; fromStopId: string; toStopId: string;
  bookingUrl: string; notes: string; isPrimary: boolean;
}
export interface PlanStayDraft {
  location: LocationRef | null; stopId: string; checkIn: string; checkOut: string;
  pricePerNight: string; totalCost: string; confirmationCode: string; bookingUrl: string; notes: string;
}

interface Props {
  kind: 'transport' | 'stay' | null; transport: PlanTransportDraft; stay: PlanStayDraft;
  stops: TripStop[]; currency?: BudgetCurrency; saving: boolean;
  onTransportChange: (draft: PlanTransportDraft) => void; onStayChange: (draft: PlanStayDraft) => void;
  onClose: () => void; onSave: () => void;
  editing?: boolean;
  saveLabel?: string;
}

const PlanBookingModal: React.FC<Props> = ({ kind, transport, stay, stops, currency = 'USD', saving, onTransportChange, onStayChange, onClose, onSave, editing = false, saveLabel }) => (
  <Modal
    isOpen={kind !== null} onClose={onClose}
    title={editing ? 'Edit transportation' : kind === 'stay' ? 'Add stay' : 'Add flight or transportation'}
    description="Add the essential details now; you can keep the rest in notes."
    size="lg" closeOnBackdrop={!saving} closeOnEscape={!saving}
    footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : saveLabel || 'Add to Plan'}</Button></div>}
  >
    {kind === 'transport' ? <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><Select label="Type" value={transport.mode} onChange={(mode) => onTransportChange({ ...transport, mode: mode as TransportMode })} options={[{ value: 'flight', label: 'Flight' }, { value: 'train', label: 'Train' }, { value: 'bus', label: 'Bus' }, { value: 'car', label: 'Car or transfer' }, { value: 'ferry', label: 'Ferry' }, { value: 'other', label: 'Other' }]} /><Input label="Provider" value={transport.provider} onChange={(event) => onTransportChange({ ...transport, provider: event.target.value })} placeholder="Airline or operator" /></div>
      <Select label="Where it fits" value={transport.role} onChange={(role) => onTransportChange({ ...transport, role: role as TransportRole })} options={[{ value: 'arrival', label: 'Arriving at the first stop' }, { value: 'between-stops', label: 'Moving between trip stops' }, { value: 'departure', label: 'Leaving the final stop' }, { value: 'local', label: 'Local transportation within a day' }]} />
      <button type="button" onClick={() => onTransportChange({ ...transport, isPrimary: !transport.isPrimary })} aria-pressed={transport.isPrimary} className="flex w-full items-center gap-2 rounded-xl border border-app-border px-4 py-2.5 text-sm font-medium text-app-text"><span className={`h-4 w-4 rounded border ${transport.isPrimary ? 'border-primary-600 bg-primary-600' : 'border-app-border'}`} />{transport.isPrimary ? 'Primary travel segment' : 'Mark as primary travel'}</button>
      {stops.length > 1 && <div className="grid gap-4 sm:grid-cols-2"><Select label="From trip stop" value={transport.fromStopId} onChange={(fromStopId) => onTransportChange({ ...transport, fromStopId })} options={[{ value: '', label: 'Outside this trip' }, ...stops.map((stop) => ({ value: stop.id, label: stop.name }))]} /><Select label="To trip stop" value={transport.toStopId} onChange={(toStopId) => onTransportChange({ ...transport, toStopId })} options={[{ value: '', label: 'Outside this trip' }, ...stops.map((stop) => ({ value: stop.id, label: stop.name }))]} /></div>}
      <div className="grid gap-4 sm:grid-cols-2"><LocationInput label="From" value={transport.from} onChange={(from) => onTransportChange({ ...transport, from })} /><LocationInput label="To" value={transport.to} onChange={(to) => onTransportChange({ ...transport, to })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Departure" type="datetime-local" value={transport.departure} onChange={(event) => onTransportChange({ ...transport, departure: event.target.value })} /><Input label="Arrival" type="datetime-local" value={transport.arrival} onChange={(event) => onTransportChange({ ...transport, arrival: event.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label={`Cost (${currency})`} type="number" min={0} value={transport.price} onChange={(event) => onTransportChange({ ...transport, price: event.target.value })} /><Input label="Confirmation code" value={transport.confirmationCode} onChange={(event) => onTransportChange({ ...transport, confirmationCode: event.target.value })} /></div>
      <Input label="Booking URL" type="url" value={transport.bookingUrl} onChange={(event) => onTransportChange({ ...transport, bookingUrl: event.target.value })} placeholder="https://…" />
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-app-text-muted">Notes</span><textarea rows={3} value={transport.notes} onChange={(event) => onTransportChange({ ...transport, notes: event.target.value })} className="w-full resize-y rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
    </div> : kind === 'stay' ? <div className="space-y-4">
      <LocationInput label="Hotel or accommodation" value={stay.location} onChange={(location) => onStayChange({ ...stay, location })} placeholder="Search hotels or enter a place" />
      <Select label="Trip stop" value={stay.stopId} onChange={(stopId) => onStayChange({ ...stay, stopId })} options={stops.map((stop) => ({ value: stop.id, label: stop.name }))} />
      <div className="grid gap-4 sm:grid-cols-2"><DatePicker label="Check-in" value={stay.checkIn} onChange={(checkIn) => onStayChange({ ...stay, checkIn })} /><DatePicker label="Check-out" value={stay.checkOut} onChange={(checkOut) => onStayChange({ ...stay, checkOut })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label={`Price per night (${currency})`} type="number" min={0} value={stay.pricePerNight} onChange={(event) => onStayChange({ ...stay, pricePerNight: event.target.value })} /><Input label={`Total cost (${currency})`} type="number" min={0} value={stay.totalCost} onChange={(event) => onStayChange({ ...stay, totalCost: event.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Confirmation code" value={stay.confirmationCode} onChange={(event) => onStayChange({ ...stay, confirmationCode: event.target.value })} /><Input label="Booking URL" type="url" value={stay.bookingUrl} onChange={(event) => onStayChange({ ...stay, bookingUrl: event.target.value })} placeholder="https://…" /></div>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-app-text-muted">Notes</span><textarea rows={3} value={stay.notes} onChange={(event) => onStayChange({ ...stay, notes: event.target.value })} className="w-full resize-y rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
    </div> : null}
  </Modal>
);

export default PlanBookingModal;
