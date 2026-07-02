import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ChecklistItemRow from './ChecklistItemRow';
import type { ChecklistItem } from '../../types';

interface ChecklistCardProps {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  inputValue: string;
  placeholder: string;
  emptyLabel: string;
  progressLabel: string;
  addLabel: string;
  addingLabel: string;
  isSaving: boolean;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({
  title,
  icon,
  items,
  inputValue,
  placeholder,
  emptyLabel,
  progressLabel,
  addLabel,
  addingLabel,
  isSaving,
  onInputChange,
  onAdd,
  onToggle,
  onDelete,
}) => (
  <Card hover={false} className="p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <Button variant="ghost" size="sm" onClick={onAdd} disabled={isSaving}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        {isSaving ? addingLabel : addLabel}
      </Button>
    </div>
    <div className="mb-3">
      <input
        type="text"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onAdd();
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>
    <div className="divide-y divide-neutral-100">
      {items.map((item) => (
        <ChecklistItemRow
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
    {items.length === 0 && (
      <p className="text-xs text-neutral-400 py-3 text-center">{emptyLabel}</p>
    )}
    <div className="mt-2 pt-2 border-t border-neutral-100">
      <p className="text-xs text-neutral-400">
        {items.filter((item) => item.checked).length} of {items.length}{' '}
        {progressLabel}
      </p>
    </div>
  </Card>
);

export default ChecklistCard;
