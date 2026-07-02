import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  StickyNote,
  Luggage,
  FileText,
  Bell,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { useServiceTrip } from '../hooks/useServiceTrips';
import { getNotesByTripId, getChecklistByTripId } from '../data/notes';
import { getWeatherByTripId } from '../data/weather';
import {
  getAuthenticatedUserId,
  notesService,
} from '../services/travelDataService';
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import NoteForm from '../components/notes/NoteForm';
import NotesList from '../components/notes/NotesList';
import ChecklistCard from '../components/notes/ChecklistCard';
import WeatherPreview from '../components/notes/WeatherPreview';
import type { ChecklistItem, Note } from '../types';

const LOCAL_NOTES_KEY = 'travel-builder:notes';
const LOCAL_CHECKLIST_KEY = 'travel-builder:checklist';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const loadStoredNotes = (tripId: string, fallbackNotes: Note[]): Note[] => {
  return loadTripScopedValue(LOCAL_NOTES_KEY, tripId, fallbackNotes);
};

const persistStoredNotes = (tripId: string, nextNotes: Note[]) => {
  persistTripScopedValue(LOCAL_NOTES_KEY, tripId, nextNotes);
};

const loadStoredChecklist = (
  tripId: string,
  fallbackItems: ChecklistItem[],
): ChecklistItem[] => {
  return loadTripScopedValue(LOCAL_CHECKLIST_KEY, tripId, fallbackItems);
};

const persistStoredChecklist = (
  tripId: string,
  nextItems: ChecklistItem[],
) => {
  persistTripScopedValue(LOCAL_CHECKLIST_KEY, tripId, nextItems);
};

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

          {showAddNote && (
            <NoteForm
              title={newNoteTitle}
              content={newNoteContent}
              isEditing={Boolean(editingNoteId)}
              isSaving={isSavingNote}
              onTitleChange={setNewNoteTitle}
              onContentChange={setNewNoteContent}
              onCancel={resetNoteForm}
              onSave={handleSaveNote}
            />
          )}

          <NotesList
            notes={localNotes}
            onEditNote={handleEditNote}
            onDeleteNote={(id) => void handleDeleteNote(id)}
          />
        </div>

        {/* Right Column - Checklists + Weather */}
        <div className="lg:w-[40%] w-full space-y-4">
          <ChecklistCard
            title="Packing List"
            icon={<Luggage className="w-4 h-4 text-primary-500" />}
            items={packingItems}
            inputValue={newChecklistText.packing}
            placeholder="Add packing item"
            emptyLabel="No packing items"
            progressLabel="packed"
            addLabel="Add Item"
            addingLabel="Adding..."
            isSaving={savingChecklistCategory === 'packing'}
            onInputChange={(value) =>
              setNewChecklistText((current) => ({ ...current, packing: value }))
            }
            onAdd={() => void handleSaveChecklistItem('packing')}
            onToggle={handleToggleCheck}
            onDelete={(id) => void handleDeleteCheck(id)}
          />

          <ChecklistCard
            title="Travel Documents"
            icon={<FileText className="w-4 h-4 text-accent-500" />}
            items={documentItems}
            inputValue={newChecklistText.documents}
            placeholder="Add document"
            emptyLabel="No documents"
            progressLabel="ready"
            addLabel="Add Item"
            addingLabel="Adding..."
            isSaving={savingChecklistCategory === 'documents'}
            onInputChange={(value) =>
              setNewChecklistText((current) => ({ ...current, documents: value }))
            }
            onAdd={() => void handleSaveChecklistItem('documents')}
            onToggle={handleToggleCheck}
            onDelete={(id) => void handleDeleteCheck(id)}
          />

          <ChecklistCard
            title="Reminders"
            icon={<Bell className="w-4 h-4 text-warning-500" />}
            items={reminderItems}
            inputValue={newChecklistText.reminders}
            placeholder="Add reminder"
            emptyLabel="No reminders"
            progressLabel="done"
            addLabel="Add Reminder"
            addingLabel="Adding..."
            isSaving={savingChecklistCategory === 'reminders'}
            onInputChange={(value) =>
              setNewChecklistText((current) => ({ ...current, reminders: value }))
            }
            onAdd={() => void handleSaveChecklistItem('reminders')}
            onToggle={handleToggleCheck}
            onDelete={(id) => void handleDeleteCheck(id)}
          />

          <WeatherPreview weather={weather} />
        </div>
      </div>
    </div>
  );
};

export default Notes;
