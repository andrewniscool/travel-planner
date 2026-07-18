import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Loader2, Plus, Search } from 'lucide-react';
import Button from '../ui/Button';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import Modal from '../ui/Modal';
import type { Place } from '../../types';

interface SavedPlacesModalProps {
  isOpen: boolean;
  places: Place[];
  onClose: () => void;
  onAddPlace: (place: Place) => void | Promise<void>;
}

const SavedPlacesModal: React.FC<SavedPlacesModalProps> = ({ isOpen, places, onClose, onAddPlace }) => {
  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setAddingId(null);
      setAddedIds(new Set());
    }
  }, [isOpen]);

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return places;
    return places.filter((place) =>
      [place.name, place.category, place.location].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [places, query]);

  const addPlace = async (place: Place) => {
    setAddingId(place.id);
    try {
      await onAddPlace(place);
      setAddedIds((current) => new Set(current).add(place.id));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add from saved places"
      description="Choose a place to add to your itinerary."
      size="md"
      closeOnBackdrop={!addingId}
      closeOnEscape={!addingId}
      bodyClassName="space-y-4"
      footer={<div className="flex justify-end"><Button variant="outline" onClick={onClose} disabled={Boolean(addingId)}>Done</Button></div>}
    >
      {places.length > 5 && (
        <label className="relative block">
          <span className="sr-only">Search saved places</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-subtle" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places" className="w-full rounded-xl border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-sm text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </label>
      )}

      {filteredPlaces.length > 0 ? (
        <div className="space-y-3">
          {filteredPlaces.map((place) => {
            const isAdding = addingId === place.id;
            const isAdded = addedIds.has(place.id);
            return (
              <div key={place.id} className="flex items-center gap-3 rounded-xl border border-app-border-muted p-3 transition-colors hover:border-app-border hover:bg-app-surface-subtle">
                <ImagePlaceholder src={place.image} alt={place.name} fallbackText={place.name} aspectRatio="square" className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-app-text-strong">{place.name}</p><p className="truncate text-xs text-app-text-muted">{place.category} · {place.location}</p></div>
                <button type="button" onClick={() => void addPlace(place)} disabled={isAdding || isAdded || Boolean(addingId)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60">
                  {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {isAdding ? 'Adding…' : isAdded ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <Bookmark className="mb-2 h-8 w-8 text-app-text-subtle" />
          <p className="text-sm font-medium text-app-text-muted">{places.length ? 'No matching places' : 'No saved places yet'}</p>
          <p className="mt-1 text-xs text-app-text-subtle">{places.length ? 'Try another search.' : 'Save places from Explore to add them here.'}</p>
        </div>
      )}
    </Modal>
  );
};

export default SavedPlacesModal;
