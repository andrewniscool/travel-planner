import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import type { Note } from '../../types';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => (
  <Card hover={false} className="p-4">
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-sm font-semibold text-neutral-800">{note.title}</h3>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          onClick={() => onEdit(note)}
          className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-150"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="p-1.5 text-neutral-400 hover:text-error-500 rounded-lg hover:bg-error-50 transition-colors duration-150"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
      {note.content}
    </p>
    <p className="text-xs text-neutral-400 mt-2">{formatDate(note.createdAt)}</p>
  </Card>
);

export default NoteCard;
