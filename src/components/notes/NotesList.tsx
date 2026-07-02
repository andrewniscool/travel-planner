import React from 'react';
import { StickyNote } from 'lucide-react';
import NoteCard from './NoteCard';
import type { Note } from '../../types';

interface NotesListProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
}) => (
  <div className="space-y-3">
    {notes.map((note) => (
      <NoteCard
        key={note.id}
        note={note}
        onEdit={onEditNote}
        onDelete={onDeleteNote}
      />
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
);

export default NotesList;
