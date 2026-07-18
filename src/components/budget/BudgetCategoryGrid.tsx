import React, { useState } from 'react';
import {
  Building2,
  Car,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plane,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import type { BudgetCategory, TripStop } from '../../types';

const categoryIconMap: Record<string, React.ReactNode> = {
  Flights: <Plane className="w-5 h-5" />,
  Hotel: <Building2 className="w-5 h-5" />,
  Food: <UtensilsCrossed className="w-5 h-5" />,
  Activities: <MapPin className="w-5 h-5" />,
  Transportation: <Car className="w-5 h-5" />,
  Miscellaneous: <MoreHorizontal className="w-5 h-5" />,
};

const categoryColorMap: Record<string, string> = {
  Flights: 'text-primary-600 bg-primary-50',
  Hotel: 'text-accent-600 bg-accent-50',
  Food: 'text-warning-600 bg-warning-50',
  Activities: 'text-success-600 bg-success-50',
  Transportation: 'text-error-500 bg-error-50',
  Miscellaneous: 'text-neutral-500 bg-neutral-100',
};

interface BudgetCategoryGridProps {
  categories: BudgetCategory[];
  orderedStops: TripStop[];
  isMultiStop: boolean;
  formatMoney: (value: number) => string;
  getStatus: (spent: number, allocated: number) => 'green' | 'yellow' | 'red';
  getProgressColor: (
    spent: number,
    allocated: number,
  ) => 'primary' | 'success' | 'warning' | 'error' | 'accent';
  getDetailsPath: (categoryName: string) => string | null;
  onManageExpenses: (category: BudgetCategory) => void;
  onSaveBudget: (category: BudgetCategory, allocated: number) => void | Promise<void>;
  onViewDetails: (path: string) => void;
}

const statusColors = {
  green: 'text-success-600',
  yellow: 'text-warning-500',
  red: 'text-error-500',
};

interface CategoryCardProps extends Omit<BudgetCategoryGridProps, 'categories'> {
  category: BudgetCategory;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, orderedStops, isMultiStop, formatMoney, getStatus, getProgressColor, getDetailsPath, onManageExpenses, onSaveBudget, onViewDetails }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [allocation, setAllocation] = useState(String(category.allocated));
  const [isSaving, setIsSaving] = useState(false);
  const status = getStatus(category.spent, category.allocated);
  const progressColor = getProgressColor(category.spent, category.allocated);
  const progressValue = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
  const iconClass = categoryColorMap[category.name] || 'text-neutral-500 bg-neutral-100';
  const icon = categoryIconMap[category.name] || <MoreHorizontal className="w-5 h-5" />;
  const detailsPath = getDetailsPath(category.name);
  const nextAllocation = Number(allocation);
  const isValid = Number.isFinite(nextAllocation) && nextAllocation >= 0;
  const isChanged = isValid && nextAllocation !== category.allocated;

  const cancel = () => { setAllocation(String(category.allocated)); setIsEditing(false); };
  const save = async () => {
    if (!isChanged) return;
    setIsSaving(true);
    try { await onSaveBudget(category, nextAllocation); setIsEditing(false); } finally { setIsSaving(false); }
  };

  return <Card hover={false} className="p-5">
    <div className="mb-4 flex items-start justify-between">
      <div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div><div><h3 className="text-sm font-semibold text-app-text-strong">{category.name}</h3>{isMultiStop && category.stopId && <p className="mt-0.5 text-xs text-app-text-subtle">{orderedStops.find((stop) => stop.id === category.stopId)?.name}</p>}<p className="mt-0.5 text-xs text-app-text-subtle">Spent: {formatMoney(category.spent)}</p></div></div>
      <span className={`text-sm font-semibold ${statusColors[status]}`}>{formatMoney(category.allocated - category.spent)} left</span>
    </div>
    {isEditing ? <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/50 p-3"><label className="text-xs font-medium text-app-text-muted">Allocated amount<input autoFocus type="number" min="0" step="1" value={allocation} onChange={(event) => setAllocation(event.target.value)} className="mt-1.5 w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>{!isValid && <p className="mt-1 text-xs text-error-500">Enter an amount of zero or more.</p>}<div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={cancel} disabled={isSaving}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button><Button size="sm" onClick={() => void save()} disabled={!isChanged || isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></div></div> : <button type="button" onClick={() => { setAllocation(String(category.allocated)); setIsEditing(true); }} className="mb-4 text-left text-xs text-app-text-muted hover:text-primary-700">Allocated: <span className="font-semibold text-app-text">{formatMoney(category.allocated)}</span> · Edit</button>}
    <ProgressBar value={progressValue} color={progressColor} size="sm" showLabel />
    <div className="mt-1 flex items-center justify-between"><span className="text-xs text-app-text-subtle">{category.allocated > 0 ? `${Math.round(progressValue)}% used` : 'No budget allocated'}</span>{status === 'red' && category.allocated > 0 && <span className="text-xs font-medium text-error-500">Over budget</span>}</div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-app-border-muted pt-3"><Button variant="ghost" size="sm" onClick={() => onManageExpenses(category)}><Pencil className="mr-1 h-3.5 w-3.5" />Manage expenses</Button>{detailsPath && <Button variant="ghost" size="sm" onClick={() => onViewDetails(detailsPath)}><Eye className="mr-1 h-3.5 w-3.5" />View details</Button>}</div>
  </Card>;
};

const BudgetCategoryGrid: React.FC<BudgetCategoryGridProps> = ({
  categories,
  orderedStops,
  isMultiStop,
  formatMoney,
  getStatus,
  getProgressColor,
  getDetailsPath,
  onManageExpenses,
  onSaveBudget,
  onViewDetails,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {categories.map((category) => <CategoryCard key={`${category.stopId ?? 'trip'}-${category.name}`} category={category} orderedStops={orderedStops} isMultiStop={isMultiStop} formatMoney={formatMoney} getStatus={getStatus} getProgressColor={getProgressColor} getDetailsPath={getDetailsPath} onManageExpenses={onManageExpenses} onSaveBudget={onSaveBudget} onViewDetails={onViewDetails} />)}
  </div>
);

export default BudgetCategoryGrid;
