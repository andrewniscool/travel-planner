import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import type { BudgetCategory, TripStop } from '../../types';

const COLORS: Record<string, string> = {
  Flights: '#7c6ee6',
  Hotel: '#31b98a',
  Food: '#efb84c',
  Activities: '#ef7f62',
  Transportation: '#45a6c7',
  Miscellaneous: '#9b91a7',
};

interface Props {
  categories: BudgetCategory[];
  stops: TripStop[];
  totalAllocated: number;
  totalSpent: number;
  formatMoney: (value: number) => string;
  onManage: (category: BudgetCategory) => void;
  onSaveAllocation: (category: BudgetCategory, allocated: number) => void | Promise<void>;
}

const CategoryRow = ({ category, stopName, totalAllocated, formatMoney, onManage, onSaveAllocation }: {
  category: BudgetCategory; stopName?: string; totalAllocated: number;
  formatMoney: (value: number) => string; onManage: () => void;
  onSaveAllocation: (value: number) => void | Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(category.allocated));
  const amount = Number(value);
  const valid = Number.isFinite(amount) && amount >= 0;
  const used = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
  const share = totalAllocated > 0 ? (category.allocated / totalAllocated) * 100 : 0;

  return <div className="border-t border-app-border-muted py-3 first:border-t-0 first:pt-0">
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[category.name] || '#9b91a7' }} />
      <button type="button" onClick={onManage} className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-app-text-strong">{category.name}</span><span className="shrink-0 text-sm font-semibold text-app-text-strong">{formatMoney(category.allocated)}</span></div>
        <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-app-text-muted"><span className="truncate">{stopName || `${Math.round(share)}% of budget`}</span><span>{formatMoney(category.spent)} spent</span></div>
      </button>
      <button type="button" onClick={() => { setValue(String(category.allocated)); setEditing((current) => !current); }} className="rounded-lg p-1.5 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text" aria-label={`Edit ${category.name} allocation`}>{editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}</button>
    </div>
    <ProgressBar className="mt-2 ml-5" value={used} size="sm" color={used > 100 ? 'error' : used >= 80 ? 'warning' : 'primary'} />
    {editing && <div className="mt-3 ml-5 flex gap-2"><input type="number" min="0" value={value} onChange={(event) => setValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-text focus:border-primary-500 focus:outline-none" aria-label={`${category.name} allocated amount`} /><Button size="sm" disabled={!valid || amount === category.allocated} onClick={() => { void onSaveAllocation(amount); setEditing(false); }}>Save</Button></div>}
  </div>;
};

const BudgetDonutRail: React.FC<Props> = ({ categories, stops, totalAllocated, totalSpent, formatMoney, onManage, onSaveAllocation }) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => [...categories].sort((a, b) => b.allocated - a.allocated), [categories]);
  const visible = expanded ? sorted : sorted.slice(0, 4);
  const grouped = useMemo(() => {
    const values = new Map<string, number>();
    categories.forEach((category) => values.set(category.name, (values.get(category.name) || 0) + category.allocated));
    return [...values.entries()].sort((a, b) => b[1] - a[1]);
  }, [categories]);
  let cursor = 0;
  const gradient = grouped.map(([name, value]) => {
    const start = cursor;
    cursor += totalAllocated > 0 ? (value / totalAllocated) * 100 : 0;
    return `${COLORS[name] || '#9b91a7'} ${start}% ${cursor}%`;
  }).join(', ');
  const remaining = totalAllocated - totalSpent;

  return <aside className="space-y-4 lg:sticky lg:top-24">
    <Card hover={false} className="p-5">
      <div><p className="text-xs font-semibold uppercase tracking-eyebrow text-app-text-subtle">Budget allocation</p><h2 className="mt-1 text-lg font-semibold text-app-text-strong">Where the money goes</h2></div>
      <div className="mx-auto mt-6 flex h-52 w-52 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient || '#e5e7eb 0 100%'})` }}>
        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-app-surface text-center shadow-sm">
          <p className="text-xs text-app-text-muted">Remaining</p>
          <p className={`mt-1 text-2xl font-semibold ${remaining < 0 ? 'text-error-500' : 'text-app-text-strong'}`}>{formatMoney(Math.abs(remaining))}</p>
          <p className="mt-1 text-[11px] text-app-text-subtle">{formatMoney(totalSpent)} spent</p>
        </div>
      </div>
      <div className="mt-6">
        {visible.map((category) => <CategoryRow key={`${category.stopId ?? 'trip'}-${category.name}`} category={category} stopName={stops.find((stop) => stop.id === category.stopId)?.name} totalAllocated={totalAllocated} formatMoney={formatMoney} onManage={() => onManage(category)} onSaveAllocation={(value) => onSaveAllocation(category, value)} />)}
      </div>
      {sorted.length > 4 && <button type="button" onClick={() => setExpanded((current) => !current)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">{expanded ? <><ChevronUp className="h-4 w-4" />Show fewer categories</> : <><ChevronDown className="h-4 w-4" />Show all {sorted.length} categories</>}</button>}
    </Card>
  </aside>;
};

export default BudgetDonutRail;
