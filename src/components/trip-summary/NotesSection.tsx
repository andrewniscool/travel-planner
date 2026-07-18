import React from 'react';
import { CheckCircle2, StickyNote } from 'lucide-react';
import type { Note } from '../../types';
import DossierSection from './DossierSection';

interface NotesSectionProps {
  notes: Note[];
  checkedCount: number;
  checklistCount: number;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, checkedCount, checklistCount }) => {
  return (
    <DossierSection icon={<StickyNote className="h-4 w-4" />} title="Notes & checklist">
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.slice(0, 3).map((note) => (
            <div key={note.id}>
              <p className="text-sm font-semibold text-app-text-strong">{note.title}</p>
              <p className="mt-0.5 text-sm text-app-text-muted line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-app-text-subtle">No notes yet.</p>
      )}
      <p className="mt-4 flex items-center gap-2 border-t border-app-border-muted pt-3 text-sm text-app-text-muted">
        <CheckCircle2 className="h-4 w-4 text-success-600" />
        {checklistCount === 0
          ? 'No checklist items yet'
          : `${checkedCount} of ${checklistCount} checklist items done`}
      </p>
    </DossierSection>
  );
};

export default NotesSection;
