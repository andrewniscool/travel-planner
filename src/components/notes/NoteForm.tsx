import React from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface NoteFormProps {
  title: string;
  content: string;
  isEditing: boolean;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({
  title,
  content,
  isEditing,
  isSaving,
  onTitleChange,
  onContentChange,
  onCancel,
  onSave,
}) => (
  <Card hover={false} className="p-4 border-primary-200">
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        rows={4}
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving}>
          <Check className="w-3.5 h-3.5 mr-1" />
          {isSaving ? 'Saving...' : isEditing ? 'Update Note' : 'Save Note'}
        </Button>
      </div>
    </div>
  </Card>
);

export default NoteForm;
