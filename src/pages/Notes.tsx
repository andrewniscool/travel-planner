import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { useServiceTrip } from '../hooks/useServiceTrips';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import { getWeatherByTripId } from '../data/weather';
import {
  getAuthenticatedUserId,
  notesService,
} from '../services/travelDataService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { ChecklistItem, Note, WeatherData } from '../types';

const LOCAL_NOTES_KEY = 'travel-builder:notes';
const LOCAL_CHECKLIST_KEY = 'travel-builder:checklist';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const loadStoredNotes = (tripId: string, fallbackNotes: Note[]): Note[] => {
  try {
    const stored = window.localStorage.getItem(LOCAL_NOTES_KEY);
    if (!stored) return fallbackNotes;
    const parsed = JSON.parse(stored) as Record<string, Note[]>;
    return parsed[tripId] ?? fallbackNotes;
  } catch {
    return fallbackNotes;
  }
};

const persistStoredNotes = (tripId: string, nextNotes: Note[]) => {
  try {
    const stored = window.localStorage.getItem(LOCAL_NOTES_KEY);
    const parsed = stored ? (JSON.parse(stored) as Record<string, Note[]>) : {};
    window.localStorage.setItem(
      LOCAL_NOTES_KEY,
      JSON.stringify({ ...parsed, [tripId]: nextNotes }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_NOTES_KEY,
      JSON.stringify({ [tripId]: nextNotes }),
    );
  }
};

const loadStoredChecklist = (
  tripId: string,
  fallbackItems: ChecklistItem[],
): ChecklistItem[] => {
  try {
    const stored = window.localStorage.getItem(LOCAL_CHECKLIST_KEY);
    if (!stored) return fallbackItems;
    const parsed = JSON.parse(stored) as Record<string, ChecklistItem[]>;
    return parsed[tripId] ?? fallbackItems;
  } catch {
    return fallbackItems;
  }
};

const persistStoredChecklist = (
  tripId: string,
  nextItems: ChecklistItem[],
) => {
  try {
    const stored = window.localStorage.getItem(LOCAL_CHECKLIST_KEY);
    const parsed = stored
      ? (JSON.parse(stored) as Record<string, ChecklistItem[]>)
      : {};
    window.localStorage.setItem(
      LOCAL_CHECKLIST_KEY,
      JSON.stringify({ ...parsed, [tripId]: nextItems }),
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_CHECKLIST_KEY,
      JSON.stringify({ [tripId]: nextItems }),
    );
  }
};

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

type ChecklistCategory = ChecklistItem['category'];

const Notes: React.FC = () => {
  const { tripId: routeTripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(routeTripId);
  const trip = serviceTrip ?? fallbackTrip;
  const tripId = trip?.id;
  const fallbackNotes = useMemo(
    () => (trip ? getNotesByTripId(trip.id) : []),
    [trip],
  );
  const fallbackChecklist = useMemo(
    () => (trip ? getChecklistByTripId(trip.id) : []),
    [trip],
  );
  const weather = trip ? getWeatherByTripId(trip.id) : [];

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<Note[]>(fallbackNotes);
  const [localChecklist, setLocalChecklist] =
    useState<ChecklistItem[]>(fallbackChecklist);
  const [notesSource, setNotesSource] = useState<'supabase' | 'fallback'>(
    'fallback',
  );
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState<
    Record<ChecklistCategory, string>
  >({
    packing: '',
    documents: '',
    reminders: '',
  });
  const [savingChecklistCategory, setSavingChecklistCategory] =
    useState<ChecklistCategory | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    const storedNotes = loadStoredNotes(tripId, fallbackNotes);
    const storedChecklist = loadStoredChecklist(tripId, fallbackChecklist);

    setLocalNotes(storedNotes);
    setLocalChecklist(storedChecklist);
    setNotesSource('fallback');
    setNotesError(null);

    async function loadSupabaseNotes() {
      if (!tripId || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const [supabaseNotes, supabaseChecklist] = await Promise.all([
          notesService.listNotes(tripId),
          notesService.listChecklistItems(tripId),
        ]);
        if (cancelled) return;

        const nextNotes = supabaseNotes.length > 0 ? supabaseNotes : storedNotes;
        const nextChecklist =
          supabaseChecklist.length > 0 ? supabaseChecklist : storedChecklist;

        setLocalNotes(nextNotes);
        setLocalChecklist(nextChecklist);
        persistStoredNotes(tripId, nextNotes);
        persistStoredChecklist(tripId, nextChecklist);
        setNotesSource('supabase');
      } catch {
        if (cancelled) return;
        setNotesError(
          'Supabase notes could not be loaded. Showing local notes instead.',
        );
      }
    }

    void loadSupabaseNotes();

    return () => {
      cancelled = true;
    };
  }, [fallbackChecklist, fallbackNotes, tripId, tripSource]);

  const packingItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'packing'),
    [localChecklist],
  );
  const documentItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'documents'),
    [localChecklist],
  );
  const reminderItems = useMemo(
    () => localChecklist.filter((c) => c.category === 'reminders'),
    [localChecklist],
  );

  const updateNotes = (nextNotes: Note[]) => {
    if (!tripId) return;
    setLocalNotes(nextNotes);
    persistStoredNotes(tripId, nextNotes);
  };

  const updateChecklist = (nextChecklist: ChecklistItem[]) => {
    if (!tripId) return;
    setLocalChecklist(nextChecklist);
    persistStoredChecklist(tripId, nextChecklist);
  };

  const handleToggleCheck = async (id: string) => {
    const toggledItem = localChecklist.find((item) => item.id === id);
    if (!toggledItem) return;

    const nextItem = { ...toggledItem, checked: !toggledItem.checked };
    const nextChecklist = localChecklist.map((item) =>
      item.id === id ? nextItem : item,
    );
    updateChecklist(nextChecklist);

    if (notesSource !== 'supabase' || !isUuid(id)) return;

    try {
      await notesService.updateChecklistItem(nextItem);
      setNotesError(null);
    } catch {
      setNotesSource('fallback');
      setNotesError(
        'Supabase checklist update failed. Saved the change locally instead.',
      );
    }
  };

  const handleDeleteCheck = async (id: string) => {
    const nextChecklist = localChecklist.filter((item) => item.id !== id);
    updateChecklist(nextChecklist);

    if (notesSource !== 'supabase' || !isUuid(id)) return;

    try {
      await notesService.deleteChecklistItem(id);
      setNotesError(null);
    } catch {
      setNotesSource('fallback');
      setNotesError(
        'Supabase checklist delete failed. Removed the item locally instead.',
      );
    }
  };

  const handleSaveChecklistItem = async (category: ChecklistCategory) => {
    if (!trip) return;
    const text = newChecklistText[category].trim();
    if (!text) return;

    const nextItem: ChecklistItem = {
      id: `checklist-${trip.id}-${Date.now()}`,
      tripId: trip.id,
      stopId: trip.stops[0]?.id,
      text,
      checked: false,
      category,
    };
    const orderIndex = localChecklist.filter(
      (item) => item.category === category,
    ).length;

    const saveLocally = (item: ChecklistItem) => {
      updateChecklist([...localChecklist, item]);
    };

    setSavingChecklistCategory(category);

    try {
      const userId = await getAuthenticatedUserId();

      if (userId && notesSource === 'supabase') {
        const savedItem = await notesService.createChecklistItem(
          nextItem,
          orderIndex,
        );
        saveLocally(savedItem);
        setNotesError(null);
      } else {
        saveLocally(nextItem);
        if (!userId) {
          setNotesError('Saved locally. Sign-in is not connected yet.');
        }
      }

      setNewChecklistText((current) => ({ ...current, [category]: '' }));
    } catch {
      saveLocally(nextItem);
      setNotesSource('fallback');
      setNotesError(
        'Supabase checklist save failed. Saved the item locally instead.',
      );
      setNewChecklistText((current) => ({ ...current, [category]: '' }));
    } finally {
      setSavingChecklistCategory(null);
    }
  };

  const handleSaveNote = async () => {
    if (!trip || !newNoteTitle.trim() || !newNoteContent.trim()) return;
    const existingNote = editingNoteId
      ? localNotes.find((note) => note.id === editingNoteId)
      : undefined;

    const nextNote: Note = {
      id: existingNote?.id ?? `note-${trip.id}-${Date.now()}`,
      tripId: trip.id,
      stopId: existingNote?.stopId ?? trip.stops[0]?.id,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      createdAt: existingNote?.createdAt ?? new Date().toISOString(),
    };

    const saveLocally = (note: Note) => {
      updateNotes(
        editingNoteId
          ? localNotes.map((currentNote) =>
              currentNote.id === editingNoteId ? note : currentNote,
            )
          : [note, ...localNotes],
      );
    };

    setIsSavingNote(true);

    try {
      const userId = await getAuthenticatedUserId();

      if (userId && notesSource === 'supabase') {
        const savedNote =
          editingNoteId && isUuid(editingNoteId)
            ? await notesService.updateNote(nextNote)
            : await notesService.createNote(nextNote);
        saveLocally(savedNote);
        setNotesError(null);
      } else {
        saveLocally(nextNote);
        if (!userId) {
          setNotesError('Saved locally. Sign-in is not connected yet.');
        }
      }

      setNewNoteTitle('');
      setNewNoteContent('');
      setEditingNoteId(null);
      setShowAddNote(false);
    } catch {
      saveLocally(nextNote);
      setNotesSource('fallback');
      setNotesError(
        'Supabase note save failed. Saved the note locally instead.',
      );
      setNewNoteTitle('');
      setNewNoteContent('');
      setEditingNoteId(null);
      setShowAddNote(false);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setShowAddNote(true);
  };

  const resetNoteForm = () => {
    setShowAddNote(false);
    setEditingNoteId(null);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleDeleteNote = async (id: string) => {
    const nextNotes = localNotes.filter((note) => note.id !== id);
    updateNotes(nextNotes);

    if (notesSource !== 'supabase' || !isUuid(id)) return;

    try {
      await notesService.deleteNote(id);
      setNotesError(null);
    } catch {
      setNotesSource('fallback');
      setNotesError(
        'Supabase note delete failed. Removed the note locally instead.',
      );
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
    <div className="space-y-4">
      {(serviceTripError || notesError) && (
        <Card hover={false} className="p-4 border-warning-100 bg-warning-50">
          <p className="text-sm text-warning-700">
            {notesError ||
              'Supabase trip data could not be loaded. Showing local notes instead.'}
          </p>
        </Card>
      )}

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
              onClick={() => {
                if (showAddNote && !editingNoteId) {
                  resetNoteForm();
                } else {
                  setShowAddNote(true);
                  setEditingNoteId(null);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                }
              }}
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
                    onClick={resetNoteForm}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {isSavingNote
                      ? 'Saving...'
                      : editingNoteId
                        ? 'Update Note'
                        : 'Save Note'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notes list */}
          <div className="space-y-3">
            {localNotes.map((note) => (
              <Card hover={false} key={note.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-150"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-neutral-400 hover:text-error-500 rounded-lg hover:bg-error-50 transition-colors duration-150"
                    >
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

            {localNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
                  <StickyNote className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-neutral-600">
                  No notes yet
                </p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSaveChecklistItem('packing')}
                disabled={savingChecklistCategory === 'packing'}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {savingChecklistCategory === 'packing' ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={newChecklistText.packing}
                onChange={(event) =>
                  setNewChecklistText((current) => ({
                    ...current,
                    packing: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSaveChecklistItem('packing');
                  }
                }}
                placeholder="Add packing item"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSaveChecklistItem('documents')}
                disabled={savingChecklistCategory === 'documents'}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {savingChecklistCategory === 'documents' ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={newChecklistText.documents}
                onChange={(event) =>
                  setNewChecklistText((current) => ({
                    ...current,
                    documents: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSaveChecklistItem('documents');
                  }
                }}
                placeholder="Add document"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSaveChecklistItem('reminders')}
                disabled={savingChecklistCategory === 'reminders'}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {savingChecklistCategory === 'reminders'
                  ? 'Adding...'
                  : 'Add Reminder'}
              </Button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={newChecklistText.reminders}
                onChange={(event) =>
                  setNewChecklistText((current) => ({
                    ...current,
                    reminders: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSaveChecklistItem('reminders');
                  }
                }}
                placeholder="Add reminder"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
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
    </div>
  );
};

export default Notes;
