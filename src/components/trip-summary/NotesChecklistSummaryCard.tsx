import React from 'react';
import { CheckSquare, StickyNote } from 'lucide-react';
import Card from '../ui/Card';
import type { Note } from '../../types';

interface NotesChecklistSummaryCardProps {
  notes: Note[];
  checkedCount: number;
  checklistCount: number;
}

const NotesChecklistSummaryCard: React.FC<NotesChecklistSummaryCardProps> = ({
  notes,
  checkedCount,
  checklistCount,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <StickyNote className="w-5 h-5 text-accent-500" />
      Notes & Checklist
    </h2>
    <div className="space-y-4">
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.slice(0, 3).map((note) => (
            <div key={note.id} className="p-3 rounded-xl bg-neutral-50">
              <p className="text-sm font-medium text-neutral-800">
                {note.title}
              </p>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">No notes</p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
        <CheckSquare className="w-4 h-4 text-neutral-400" />
        <span className="text-sm text-neutral-600">
          Checklist: {checkedCount} of {checklistCount} items checked
        </span>
      </div>
    </div>
  </Card>
);

export default NotesChecklistSummaryCard;
