import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { ChecklistItem } from '../../types';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  onToggle,
  onDelete,
}) => (
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
        item.checked ? 'text-neutral-400 line-through' : 'text-neutral-700',
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

export default ChecklistItemRow;
