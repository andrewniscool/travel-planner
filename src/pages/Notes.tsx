import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  StickyNote,
  Luggage,
  FileText,
  Bell,
  CloudSun,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import { getWeatherByTripId } from '../data/weather';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { ChecklistItem, WeatherData } from '../types';

const ChecklistItemRow: React.FC<{
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ item, onToggle, onDelete }) => (
  <div className="flex items-center gap-3 py-2 group">
    <button
      onClick={() => onToggle(item.id)}
      className={[
        'flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150 shrink-0',
        item.checked
          ? 'bg-primary-500 border-primary-500 text-white'
          : 'border-neutral-300 hover:border-primary-400 bg-white',
      ].join(' ')}
    >
      {item.checked && <Check className="w-3 h-3" />}
    </button>
    <span
      className={[
        'flex-1 text-sm transition-all duration-150',
        item.checked
          ? 'text-neutral-400 line-through'
          : 'text-neutral-700',
      ].join(' ')}
    >
      {item.text}
    </span>
    <button
      onClick={() => onDelete(item.id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-neutral-400 hover:text-error-500 p-1"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

const WeatherDay: React.FC<{ day: WeatherData }> = ({ day }) => (
  <div className="flex flex-col items-center gap-1.5 min-w-[72px] p-2">
    <span className="text-xs font-medium text-neutral-500">{day.day}</span>
    <span className="text-2xl">{day.icon}</span>
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold text-neutral-800">
        {day.high}&deg;
      </span>
      <span className="text-sm text-neutral-400">{day.low}&deg;</span>
    </div>
  </div>
);

const Notes: React.FC = () => {
  const trip = useTrip();
  const notes = trip ? getNotesByTripId(trip.id) : [];
  const checklist = trip ? getChecklistByTripId(trip.id) : [];
  const weather = trip ? getWeatherByTripId(trip.id) : [];

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Local state for checklist toggle/delete (demo only)
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(checklist);

  const packingItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'packing'),
    [localChecklist]
  );
  const documentItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'documents'),
    [localChecklist]
  );
  const reminderItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'reminders'),
    [localChecklist]
  );

  const handleToggleCheck = (id: string) => {
    setLocalChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleDeleteCheck = (id: string) => {
    setLocalChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      // In a real app, this would persist to data
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Notes */}
      <div className="lg:w-[60%] w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary-500" />
            Notes
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        </div>

        {/* Add note form */}
        {showAddNote && (
          <Card hover={false} className="p-4 border-primary-200">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <textarea
                placeholder="Write your note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveNote}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save Note
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Notes list */}
        <div className="space-y-3">
          {notes.map((note) => (
            <Card hover={false} key={note.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-800">
                  {note.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-150">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-neutral-400 hover:text-error-500 rounded-lg hover:bg-error-50 transition-colors duration-150">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                {note.content}
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                {formatDate(note.createdAt)}
              </p>
            </Card>
          ))}

          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
                <StickyNote className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No notes yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Add notes to keep track of important details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Checklists + Weather */}
      <div className="lg:w-[40%] w-full space-y-4">
        {/* Packing List */}
        <Card hover={false} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <Luggage className="w-4 h-4 text-primary-500" />
              Packing List
            </h3>
            <Button variant="ghost" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Item
            </Button>
          </div>
          <div className="divide-y divide-neutral-100">
            {packingItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggleCheck}
                onDelete={handleDeleteCheck}
              />
            ))}
          </div>
          {packingItems.length === 0 && (
            <p className="text-xs text-neutral-400 py-3 text-center">
              No packing items
            </p>
          )}
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              {packingItems.filter((i) => i.checked).length} of{' '}
              {packingItems.length} packed
            </p>
          </div>
        </Card>

        {/* Travel Documents */}
        <Card hover={false} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-500" />
              Travel Documents
            </h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {documentItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggleCheck}
                onDelete={handleDeleteCheck}
              />
            ))}
          </div>
          {documentItems.length === 0 && (
            <p className="text-xs text-neutral-400 py-3 text-center">
              No documents
            </p>
          )}
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              {documentItems.filter((i) => i.checked).length} of{' '}
              {documentItems.length} ready
            </p>
          </div>
        </Card>

        {/* Reminders */}
        <Card hover={false} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning-500" />
              Reminders
            </h3>
            <Button variant="ghost" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Reminder
            </Button>
          </div>
          <div className="divide-y divide-neutral-100">
            {reminderItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggleCheck}
                onDelete={handleDeleteCheck}
              />
            ))}
          </div>
          {reminderItems.length === 0 && (
            <p className="text-xs text-neutral-400 py-3 text-center">
              No reminders
            </p>
          )}
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              {reminderItems.filter((i) => i.checked).length} of{' '}
              {reminderItems.length} done
            </p>
          </div>
        </Card>

        {/* Weather Preview */}
        {weather.length > 0 && (
          <Card hover={false} className="p-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-3">
              <CloudSun className="w-4 h-4 text-warning-500" />
              Weather Forecast
            </h3>
            <div className="flex overflow-x-auto scrollbar-thin gap-1 pb-1 -mx-1 px-1">
              {weather.map((day) => (
                <WeatherDay key={day.date} day={day} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notes;
