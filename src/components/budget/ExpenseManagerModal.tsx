import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import type { BudgetCategory, BudgetExpense, TransportSegment, TripStop } from '../../types';

export interface ExpenseFormState {
  title: string;
  amount: string;
  category: string;
  stopId: string;
  date: string;
  notes: string;
}

interface ExpenseManagerModalProps {
  isOpen: boolean;
  selectedCategory: BudgetCategory | null;
  mode: 'list' | 'form';
  expenseForm: ExpenseFormState;
  categories: BudgetCategory[];
  orderedStops: TripStop[];
  isMultiStop: boolean;
  selectedCategoryExpenses: BudgetExpense[];
  selectedCategoryTravelSegments: TransportSegment[];
  editingExpenseId: string | null;
  isSavingExpense: boolean;
  formatMoney: (value: number) => string;
  getTravelSegmentTitle: (segment: TransportSegment) => string;
  onClose: () => void;
  onFormChange: (form: ExpenseFormState) => void;
  onSubmitExpense: () => void | Promise<void>;
  onCancelForm: () => void;
  onAddExpense: (category: BudgetCategory) => void;
  onEditExpense: (expense: BudgetExpense) => void;
  onDeleteExpense: (expenseId: string) => void | Promise<void>;
}

const ExpenseManagerModal: React.FC<ExpenseManagerModalProps> = ({
  isOpen,
  selectedCategory,
  mode,
  expenseForm,
  categories,
  orderedStops,
  isMultiStop,
  selectedCategoryExpenses,
  selectedCategoryTravelSegments,
  editingExpenseId,
  isSavingExpense,
  formatMoney,
  getTravelSegmentTitle,
  onClose,
  onFormChange,
  onSubmitExpense,
  onCancelForm,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Manage ${selectedCategory?.name ?? 'Category'} Expenses`}
    size="lg"
  >
    {mode === 'form' ? (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmitExpense();
        }}
      >
        <Input
          label="Expense name"
          value={expenseForm.title}
          onChange={(event) =>
            onFormChange({ ...expenseForm, title: event.target.value })
          }
          placeholder="Train tickets, hotel deposit, dinner"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={expenseForm.amount}
            onChange={(event) =>
              onFormChange({ ...expenseForm, amount: event.target.value })
            }
            required
          />
          <Select
            label="Category"
            value={expenseForm.category}
            onChange={(value) =>
              onFormChange({ ...expenseForm, category: value })
            }
            options={[...new Set(categories.map((category) => category.name))].map(
              (categoryName) => ({
                value: categoryName,
                label: categoryName,
              }),
            )}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isMultiStop && (
            <Select
              label="Stop"
              value={expenseForm.stopId}
              onChange={(value) =>
                onFormChange({ ...expenseForm, stopId: value })
              }
              options={[
                { value: '', label: 'Trip-wide' },
                ...orderedStops.map((stop) => ({
                  value: stop.id,
                  label: stop.name,
                })),
              ]}
            />
          )}
          <DatePicker
            label="Date"
            value={expenseForm.date}
            onChange={(value) => onFormChange({ ...expenseForm, date: value })}
          />
        </div>
        <label>
          <span className="block text-sm font-medium text-neutral-700 mb-1.5">
            Notes
          </span>
          <textarea
            value={expenseForm.notes}
            onChange={(event) =>
              onFormChange({ ...expenseForm, notes: event.target.value })
            }
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Optional"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancelForm} disabled={isSavingExpense}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSavingExpense}>
            {isSavingExpense
              ? 'Saving...'
              : editingExpenseId
                ? 'Save changes'
                : 'Add expense'}
          </Button>
        </div>
      </form>
    ) : (
      <div className="space-y-4">
        {selectedCategory && (
          <div className="flex justify-end">
            <Button onClick={() => onAddExpense(selectedCategory)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Expense
            </Button>
          </div>
        )}
        {selectedCategoryExpenses.length > 0 ||
        selectedCategoryTravelSegments.length > 0 ? (
          <div className="space-y-3">
            {selectedCategoryTravelSegments.map((segment) => (
              <div
                key={`segment-${segment.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {getTravelSegmentTitle(segment)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatMoney(segment.price ?? 0)}
                    {segment.departureDateTime
                      ? ` · ${segment.departureDateTime.slice(0, 10)}`
                      : ''}
                  </p>
                  <p className="text-xs text-primary-700 mt-1">
                    Imported from travel data · read-only
                  </p>
                </div>
              </div>
            ))}
            {selectedCategoryExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {expense.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatMoney(expense.amount)}
                    {expense.date ? ` · ${expense.date}` : ''}
                  </p>
                  {expense.notes && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {expense.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditExpense(expense)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void onDeleteExpense(expense.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-neutral-700">
              No expenses in this category yet.
            </p>
          </div>
        )}
      </div>
    )}
  </Modal>
);

export default ExpenseManagerModal;
