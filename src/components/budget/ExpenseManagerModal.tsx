import React from 'react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Sheet from '../ui/Sheet';
import { DatePicker } from '../ui/DatePicker';
import type { BudgetCategory, BudgetExpense, TransportSegment, TripStop } from '../../types';

export interface ExpenseFormState { title: string; amount: string; category: string; stopId: string; date: string; notes: string; }
interface ExpenseManagerModalProps {
  isOpen: boolean; selectedCategory: BudgetCategory | null; mode: 'list' | 'form'; expenseForm: ExpenseFormState;
  categories: BudgetCategory[]; orderedStops: TripStop[]; isMultiStop: boolean;
  selectedCategoryExpenses: BudgetExpense[]; selectedCategoryTravelSegments: TransportSegment[];
  editingExpenseId: string | null; isSavingExpense: boolean; formatMoney: (value: number) => string;
  getTravelSegmentTitle: (segment: TransportSegment) => string; onClose: () => void;
  onFormChange: (form: ExpenseFormState) => void; onSubmitExpense: () => void | Promise<void>;
  onCancelForm: () => void; onAddExpense: (category: BudgetCategory) => void;
  onEditExpense: (expense: BudgetExpense) => void; onDeleteExpense: (expenseId: string) => void | Promise<void>;
}

const ExpenseManagerModal: React.FC<ExpenseManagerModalProps> = ({ isOpen, selectedCategory, mode, expenseForm, categories, orderedStops, isMultiStop, selectedCategoryExpenses, selectedCategoryTravelSegments, editingExpenseId, isSavingExpense, formatMoney, getTravelSegmentTitle, onClose, onFormChange, onSubmitExpense, onCancelForm, onAddExpense, onEditExpense, onDeleteExpense }) => {
  const manualSpent = selectedCategoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const importedSpent = selectedCategoryTravelSegments.reduce((sum, segment) => sum + (segment.price ?? 0), 0);
  const spent = selectedCategory?.spent ?? manualSpent + importedSpent;
  const remaining = (selectedCategory?.allocated ?? 0) - spent;
  const formDirty = Boolean(expenseForm.title || expenseForm.amount || expenseForm.date || expenseForm.notes);
  const requestClose = () => {
    if (isSavingExpense) return;
    if (mode === 'form' && formDirty && !window.confirm('Discard your unsaved expense changes?')) return;
    onClose();
  };

  return <Sheet
    isOpen={isOpen} onClose={requestClose}
    title={mode === 'form' ? (editingExpenseId ? 'Edit expense' : 'Add expense') : `${selectedCategory?.name ?? 'Category'} expenses`}
    description={mode === 'form' ? `For ${selectedCategory?.name ?? 'this category'}` : 'Review imported costs and manage manual expenses.'}
    closeOnBackdrop={!isSavingExpense} closeOnEscape={!isSavingExpense}
    footer={mode === 'form' ? <div className="flex justify-end gap-3"><Button variant="ghost" onClick={onCancelForm} disabled={isSavingExpense}>Cancel</Button><Button type="submit" form="expense-form" disabled={isSavingExpense}>{isSavingExpense ? 'Saving…' : editingExpenseId ? 'Save changes' : 'Add expense'}</Button></div> : selectedCategory ? <Button className="w-full" size="lg" onClick={() => onAddExpense(selectedCategory)}><Plus className="mr-2 h-4 w-4" />Add expense</Button> : undefined}
  >
    <div className="space-y-5 p-5 sm:p-6">
      {mode === 'list' && selectedCategory && <div className="grid grid-cols-3 gap-2 rounded-2xl bg-app-surface-muted p-4 text-center"><div><p className="text-xs text-app-text-subtle">Allocated</p><p className="mt-1 text-sm font-semibold text-app-text-strong">{formatMoney(selectedCategory.allocated)}</p></div><div><p className="text-xs text-app-text-subtle">Spent</p><p className="mt-1 text-sm font-semibold text-app-text-strong">{formatMoney(spent)}</p></div><div><p className="text-xs text-app-text-subtle">Remaining</p><p className={`mt-1 text-sm font-semibold ${remaining < 0 ? 'text-error-500' : 'text-success-600'}`}>{formatMoney(remaining)}</p></div></div>}

      {mode === 'form' ? <>
        <button type="button" onClick={onCancelForm} disabled={isSavingExpense} className="inline-flex items-center gap-1.5 text-sm font-medium text-app-text-muted hover:text-app-text"><ArrowLeft className="h-4 w-4" />Back to expenses</button>
        <form id="expense-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSubmitExpense(); }}>
          <Input label="Expense name" value={expenseForm.title} onChange={(event) => onFormChange({ ...expenseForm, title: event.target.value })} placeholder="Train tickets, hotel deposit, dinner" required />
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Amount" type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(event) => onFormChange({ ...expenseForm, amount: event.target.value })} required /><Select label="Category" value={expenseForm.category} onChange={(value) => onFormChange({ ...expenseForm, category: value })} options={[...new Set(categories.map((category) => category.name))].map((name) => ({ value: name, label: name }))} /></div>
          <div className="grid gap-4 sm:grid-cols-2">{isMultiStop && <Select label="Stop" value={expenseForm.stopId} onChange={(value) => onFormChange({ ...expenseForm, stopId: value })} options={[{ value: '', label: 'Trip-wide' }, ...orderedStops.map((stop) => ({ value: stop.id, label: stop.name }))]} />}<DatePicker label="Date" value={expenseForm.date} onChange={(value) => onFormChange({ ...expenseForm, date: value })} /></div>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-app-text-muted">Notes</span><textarea value={expenseForm.notes} onChange={(event) => onFormChange({ ...expenseForm, notes: event.target.value })} rows={4} className="w-full resize-none rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-app-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional" /></label>
        </form>
      </> : selectedCategoryExpenses.length || selectedCategoryTravelSegments.length ? <div className="space-y-6">
        {selectedCategoryTravelSegments.length > 0 && <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Imported travel costs</h3><div className="space-y-3">{selectedCategoryTravelSegments.map((segment) => <div key={segment.id} className="rounded-xl border border-primary-100 bg-primary-50 p-4"><p className="text-sm font-semibold text-app-text-strong">{getTravelSegmentTitle(segment)}</p><p className="mt-1 text-sm text-app-text-muted">{formatMoney(segment.price ?? 0)}{segment.departureDateTime ? ` · ${segment.departureDateTime.slice(0, 10)}` : ''}</p><p className="mt-1 text-xs text-primary-700">Synced from Travel · read-only</p></div>)}</div></section>}
        {selectedCategoryExpenses.length > 0 && <section><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Manual expenses</h3><div className="space-y-3">{selectedCategoryExpenses.map((expense) => <div key={expense.id} className="rounded-xl border border-app-border-muted p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-app-text-strong">{expense.title}</p><p className="mt-1 text-sm text-app-text-muted">{formatMoney(expense.amount)}{expense.date ? ` · ${expense.date}` : ''}</p>{expense.notes && <p className="mt-1 text-xs text-app-text-muted">{expense.notes}</p>}</div><div className="flex gap-1"><button type="button" onClick={() => onEditExpense(expense)} aria-label={`Edit ${expense.title}`} className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-muted"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void onDeleteExpense(expense.id)} aria-label={`Delete ${expense.title}`} className="rounded-lg p-2 text-app-text-muted hover:bg-error-50 hover:text-error-500"><Trash2 className="h-4 w-4" /></button></div></div></div>)}</div></section>}
      </div> : <div className="py-12 text-center"><p className="text-sm font-medium text-app-text">No expenses in this category yet.</p><p className="mt-1 text-xs text-app-text-muted">Add your first manual expense below.</p></div>}
    </div>
  </Sheet>;
};

export default ExpenseManagerModal;
