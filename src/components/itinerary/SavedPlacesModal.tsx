import React from 'react';
import { Bookmark, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import { GOOGLE_PLACE_IMAGE } from '../../services/locationDisplayMappers';
import type { Place } from '../../types';

interface SavedPlacesModalProps {
  isOpen: boolean;
  places: Place[];
  onClose: () => void;
  onAddPlace: (place: Place) => void | Promise<void>;
}

const SavedPlacesModal: React.FC<SavedPlacesModalProps> = ({
  isOpen,
  places,
  onClose,
  onAddPlace,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Add from Saved Places" size="md">
    <div className="space-y-3">
      {places.length > 0 ? (
        places.map((place) => (
          <div
            key={place.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <img
              src={place.image}
              alt={place.name}
              loading="lazy"
              decoding="async"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              onError={(event) => {
                if (event.currentTarget.src !== GOOGLE_PLACE_IMAGE) {
                  event.currentTarget.src = GOOGLE_PLACE_IMAGE;
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {place.name}
              </p>
              <p className="text-xs text-neutral-500">
                {place.category} - {place.location}
              </p>
            </div>
            <button
              onClick={() => void onAddPlace(place)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <Bookmark className="w-8 h-8 text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">No saved places yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Save places from the Explore page to add them here
          </p>
        </div>
      )}
    </div>
  </Modal>
);

export default SavedPlacesModal;
