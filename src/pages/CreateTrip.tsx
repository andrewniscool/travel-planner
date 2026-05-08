import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, FileText, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ImagePlaceholder from '../components/ui/ImagePlaceholder';
import Badge from '../components/ui/Badge';
import type { TripVibe } from '../types';

const VIBE_OPTIONS: TripVibe[] = [
  'Relaxing',
  'Adventure',
  'Food-focused',
  'Romantic',
  'Family',
  'Budget-friendly',
  'Luxury',
  'Cultural',
];

const PREVIEW_IMAGE =
  'https://images.pexels.com/photos/317855/pexels-photo-317855.jpeg?auto=compress&cs=tinysrgb&w=800';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(+year, +month - 1, +day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [budget, setBudget] = useState<number | ''>('');
  const [vibe, setVibe] = useState<TripVibe | ''>('');
  const [notes, setNotes] = useState('');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleContinue = () => {
    setTimeout(() => navigate('/trip/trip-1'), 400);
  };

  const dateDisplay = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : startDate
      ? formatDate(startDate)
      : '';

  const notesPreview = notes.length > 100 ? notes.slice(0, 100) + '...' : notes;

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Create a New Trip
          </h1>
          <p className="mt-1 text-neutral-500">
            Start planning your next adventure
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form - Left side */}
          <div className="w-full lg:w-[60%] space-y-6">
            {/* Destination */}
            <Input
              label="Destination"
              placeholder="Where are you going?"
              icon={<MapPin className="w-4 h-4" />}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />

            {/* Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Travelers & Budget row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Number of Travelers"
                type="number"
                min={1}
                placeholder="1"
                icon={<Users className="w-4 h-4" />}
                value={travelers}
                onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Budget
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="absolute inset-y-0 left-9 flex items-center text-neutral-500 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-14 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Trip Vibe */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                Trip Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVibe(vibe === option ? '' : option)}
                    className={[
                      'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150',
                      vibe === option
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                    ].join(' ')}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Notes
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none text-neutral-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  rows={4}
                  placeholder="Any special plans or ideas?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-neutral-200">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="order-3 sm:order-1"
              >
                Cancel
              </Button>

              <div className="flex-1" />

              <Button
                variant="primary"
                onClick={handleSave}
                className="order-2 sm:order-2"
              >
                {saved ? 'Saved!' : 'Save Trip'}
              </Button>

              <Button
                variant="primary"
                onClick={handleContinue}
                className="order-1 sm:order-3 inline-flex items-center gap-2"
              >
                Continue to Planning
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Live Preview - Right side */}
          <div className="w-full lg:w-[40%]">
            <div className="lg:sticky lg:top-8">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Live Preview
              </p>
              <Card hover={false} className="overflow-hidden">
                {/* Image */}
                <div className="relative">
                  <ImagePlaceholder
                    src={PREVIEW_IMAGE}
                    alt="Trip destination"
                    aspectRatio="video"
                  />
                  {destination && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-5">
                      <h3 className="text-xl font-bold text-white drop-shadow-md">
                        {destination}
                      </h3>
                    </div>
                  )}
                </div>

                {/* Trip summary */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {destination || 'Your Destination'}
                  </h3>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span>{dateDisplay || 'Select dates'}</span>
                  </div>

                  {/* Travelers */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span>
                      {travelers} traveler{travelers !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    <span>
                      {budget ? `$${budget.toLocaleString()}` : 'Set a budget'}
                    </span>
                  </div>

                  {/* Vibe badge */}
                  {vibe && (
                    <div className="pt-1">
                      <Badge variant="default">{vibe}</Badge>
                    </div>
                  )}

                  {/* Notes preview */}
                  {notesPreview && (
                    <div className="pt-2 border-t border-neutral-100">
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {notesPreview}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
