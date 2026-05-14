import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  PiggyBank,
  User,
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
  Car,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getBudgetByTripId } from '../data/budget';
import { isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  budgetService,
  getAuthenticatedUserId,
} from '../services/travelDataService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import type { BudgetCategory, BudgetExpense } from '../types';

const LOCAL_BUDGET_EXPENSES_KEY = 'travel-builder:budget-expenses';

interface ExpenseFormState {
  title: string;
  amount: string;
  category: string;
  stopId: string;
  date: string;
  notes: string;
}

const emptyExpenseForm = (category = '', stopId = ''): ExpenseFormState => ({
  title: '',
  amount: '',
  category,
  stopId,
  date: '',
  notes: '',
});

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

const categoryBarColorMap: Record<string, string> = {
  Flights: 'bg-primary-500',
  Hotel: 'bg-accent-500',
  Food: 'bg-warning-500',
  Activities: 'bg-success-500',
  Transportation: 'bg-error-500',
  Miscellaneous: 'bg-neutral-400',
};

function getBudgetStatus(
  spent: number,
  allocated: number
): 'green' | 'yellow' | 'red' {
  if (allocated === 0) return 'red';
  const ratio = spent / allocated;
  if (ratio < 0.8) return 'green';
  if (ratio <= 1.0) return 'yellow';
  return 'red';
}

function getBudgetProgressBarColor(
  spent: number,
  allocated: number
): 'primary' | 'success' | 'warning' | 'error' | 'accent' {
  if (allocated === 0) return 'error';
  const ratio = spent / allocated;
  if (ratio < 0.8) return 'success';
  if (ratio <= 1.0) return 'warning';
  return 'error';
}

const sumAllocated = (categories: BudgetCategory[]) =>
  categories.reduce((sum, category) => sum + category.allocated, 0);

const sumSpent = (categories: BudgetCategory[]) =>
  categories.reduce((sum, category) => sum + category.spent, 0);

const loadStoredExpenses = (tripId: string): BudgetExpense[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUDGET_EXPENSES_KEY) ?? '{}') as Record<string, BudgetExpense[]>;
    return stored[tripId] ?? [];
  } catch {
    return [];
  }
};

const persistStoredExpenses = (tripId: string, expenses: BudgetExpense[]) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_BUDGET_EXPENSES_KEY) ?? '{}') as Record<string, BudgetExpense[]>;
    window.localStorage.setItem(
      LOCAL_BUDGET_EXPENSES_KEY,
      JSON.stringify({ ...stored, [tripId]: expenses })
    );
  } catch {
    window.localStorage.setItem(
      LOCAL_BUDGET_EXPENSES_KEY,
      JSON.stringify({ [tripId]: expenses })
    );
  }
};

const Budget: React.FC = () => {
  const { tripId: routeTripId } = useParams<{ tripId: string }>();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(routeTripId);
  const trip = serviceTrip ?? fallbackTrip;
  const tripId = trip?.id;
  const budget = trip ? getBudgetByTripId(trip.id) : undefined;
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const [expenses, setExpenses] = useState<BudgetExpense[]>(() =>
    trip ? loadStoredExpenses(trip.id) : []
  );
  const [expenseSource, setExpenseSource] = useState<'supabase' | 'fallback'>('fallback');
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseListModalOpen, setExpenseListModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpenseForm());

  useEffect(() => {
    if (!tripId) return;
    const localExpenses = loadStoredExpenses(tripId);
    let cancelled = false;

    setExpenses(localExpenses);
    setExpenseSource('fallback');
    setExpenseError(null);

    async function loadSupabaseExpenses() {
      if (!tripId || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const rows = await budgetService.listBudgetExpenses(tripId);
        if (cancelled) return;

        setExpenses(rows);
        persistStoredExpenses(tripId, rows);
        setExpenseSource('supabase');
      } catch {
        if (cancelled) return;
        setExpenseError('Supabase budget expenses could not be loaded. Showing local expenses instead.');
      }
    }

    void loadSupabaseExpenses();

    return () => {
      cancelled = true;
    };
  }, [tripId, tripSource]);

  const categoriesWithExpenses = useMemo(() => {
    if (!budget) return [];
    return budget.categories.map((category) => {
      const expenseTotal = expenses
        .filter(
          (expense) =>
            expense.category === category.name &&
            (expense.stopId ?? '') === (category.stopId ?? '')
        )
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        ...category,
        spent: category.spent + expenseTotal,
      };
    });
  }, [budget, expenses]);

  const totalSpent = useMemo(() => {
    return sumSpent(categoriesWithExpenses);
  }, [categoriesWithExpenses]);

  const totalAllocated = useMemo(() => {
    return sumAllocated(categoriesWithExpenses);
  }, [categoriesWithExpenses]);

  const tripLevelCategories = useMemo(
    () => categoriesWithExpenses.filter((category) => !category.stopId),
    [categoriesWithExpenses]
  );

  const stopBudgetBreakdown = useMemo(
    () =>
      orderedStops.map((stop) => {
        const categories = categoriesWithExpenses.filter((category) => category.stopId === stop.id);
        return {
          stop,
          categories,
          allocated: sumAllocated(categories),
          spent: sumSpent(categories),
        };
      }),
    [categoriesWithExpenses, orderedStops]
  );

  const remaining = (trip?.budget ?? 0) - totalSpent;
  const costPerTraveler = trip ? totalSpent / trip.travelers : 0;
  const overallProgress =
    trip && trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;

  const selectedCategoryExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return expenses.filter(
      (expense) =>
        expense.category === selectedCategory.name &&
        (expense.stopId ?? '') === (selectedCategory.stopId ?? '')
    );
  }, [expenses, selectedCategory]);

  const updateExpenses = (nextExpenses: BudgetExpense[]) => {
    if (!trip) return;
    setExpenses(nextExpenses);
    persistStoredExpenses(trip.id, nextExpenses);
  };

  const openAddExpenseModal = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(category.name, category.stopId ?? ''));
    setExpenseModalOpen(true);
  };

  const openExpenseListModal = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setExpenseListModalOpen(true);
  };

  const openEditExpenseModal = (expense: BudgetExpense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      stopId: expense.stopId ?? '',
      date: expense.date ?? '',
      notes: expense.notes ?? '',
    });
    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(selectedCategory?.name, selectedCategory?.stopId ?? ''));
  };

  const handleSaveExpense = async () => {
    if (!trip || !expenseForm.title.trim() || !expenseForm.amount) return;
    const amount = Number(expenseForm.amount);
    if (!Number.isFinite(amount) || amount < 0) return;

    const nextExpense: BudgetExpense = {
      id: editingExpenseId ?? `expense-${trip.id}-${Date.now()}`,
      tripId: trip.id,
      category: expenseForm.category,
      stopId: expenseForm.stopId || undefined,
      title: expenseForm.title.trim(),
      amount,
      date: expenseForm.date || undefined,
      notes: expenseForm.notes.trim() || undefined,
    };

    const saveLocally = (expense: BudgetExpense) => {
      updateExpenses(
        editingExpenseId
          ? expenses.map((currentExpense) =>
              currentExpense.id === editingExpenseId ? expense : currentExpense,
            )
          : [expense, ...expenses],
      );
    };

    setIsSavingExpense(true);

    try {
      const userId = await getAuthenticatedUserId();

      if (userId && expenseSource === 'supabase') {
        const savedExpense = editingExpenseId
          ? await budgetService.updateBudgetExpense(nextExpense)
          : await budgetService.createBudgetExpense(nextExpense);
        saveLocally(savedExpense);
        setExpenseError(null);
      } else {
        saveLocally(nextExpense);
        if (!userId) {
          setExpenseError('Saved locally. Sign-in is not connected yet.');
        }
      }

      closeExpenseModal();
    } catch {
      saveLocally(nextExpense);
      setExpenseSource('fallback');
      setExpenseError('Supabase budget save failed. Saved the expense locally instead.');
      closeExpenseModal();
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const nextExpenses = expenses.filter((expense) => expense.id !== expenseId);

    if (expenseSource !== 'supabase') {
      updateExpenses(nextExpenses);
      return;
    }

    try {
      await budgetService.deleteBudgetExpense(expenseId);
      updateExpenses(nextExpenses);
      setExpenseError(null);
    } catch {
      updateExpenses(nextExpenses);
      setExpenseSource('fallback');
      setExpenseError('Supabase budget delete failed. Removed the expense locally instead.');
    }
  };

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(serviceTripError || expenseError) && (
        <Card hover={false} className="p-4 border-warning-100 bg-warning-50">
          <p className="text-sm text-warning-700">
            {expenseError || 'Supabase trip data could not be loaded. Showing local budget data instead.'}
          </p>
        </Card>
      )}

      {/* Overall budget progress */}
      <Card hover={false} className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800">
            Overall Budget
          </h2>
          <span className="text-sm text-neutral-500">
            ${totalSpent.toLocaleString()} of ${trip.budget.toLocaleString()}
          </span>
        </div>
        <ProgressBar
          value={overallProgress}
          color={getBudgetProgressBarColor(totalSpent, trip.budget)}
          showLabel
          size="md"
        />
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover={false} className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                ${trip.budget.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Total Budget</p>
            </div>
          </div>
        </Card>

        <Card hover={false} className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-50 text-accent-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                ${totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Estimated Cost</p>
            </div>
          </div>
        </Card>

        <Card hover={false} className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-success-50 text-success-600">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <p
                className={`text-xl font-bold ${remaining >= 0 ? 'text-success-600' : 'text-error-500'}`}
              >
                ${Math.abs(remaining).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
            </div>
          </div>
        </Card>

        <Card hover={false} className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 text-neutral-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                ${Math.round(costPerTraveler).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Per Traveler
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget category cards */}
      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categoriesWithExpenses.map((category) => {
            const status = getBudgetStatus(category.spent, category.allocated);
            const progressColor = getBudgetProgressBarColor(
              category.spent,
              category.allocated
            );
            const progressValue =
              category.allocated > 0
                ? (category.spent / category.allocated) * 100
                : 0;
            const iconClass = categoryColorMap[category.name] || 'text-neutral-500 bg-neutral-100';
            const icon = categoryIconMap[category.name] || (
              <MoreHorizontal className="w-5 h-5" />
            );

            const statusColors = {
              green: 'text-success-600',
              yellow: 'text-warning-500',
              red: 'text-error-500',
            };

            return (
              <Card hover={false} key={`${category.stopId ?? 'trip'}-${category.name}`} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconClass}`}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-800">
                        {category.name}
                      </h3>
                      {isMultiStop && category.stopId && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {orderedStops.find((stop) => stop.id === category.stopId)?.name}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Allocated: ${category.allocated.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${statusColors[status]}`}
                  >
                    ${category.spent.toLocaleString()}
                  </span>
                </div>

                <ProgressBar
                  value={progressValue}
                  color={progressColor}
                  size="sm"
                  showLabel
                />

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-neutral-400">
                    {category.allocated > 0
                      ? `${Math.round(progressValue)}% used`
                      : 'No budget allocated'}
                  </span>
                  {status === 'red' && category.allocated > 0 && (
                    <span className="text-xs text-error-500 font-medium">
                      Over budget
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
                  <Button variant="ghost" size="sm" onClick={() => openAddExpenseModal(category)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Expense
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openExpenseListModal(category)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stop-level breakdown */}
      {budget && isMultiStop && (
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">
            Budget by Stop
          </h2>
          <div className="space-y-5">
            {tripLevelCategories.length > 0 && (
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Trip-wide
                  </h3>
                  <span className="text-sm text-neutral-500">
                    ${sumSpent(tripLevelCategories).toLocaleString()} / ${sumAllocated(tripLevelCategories).toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  value={sumAllocated(tripLevelCategories) > 0 ? (sumSpent(tripLevelCategories) / sumAllocated(tripLevelCategories)) * 100 : 0}
                  color={getBudgetProgressBarColor(sumSpent(tripLevelCategories), sumAllocated(tripLevelCategories))}
                  size="sm"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stopBudgetBreakdown.map(({ stop, categories, allocated, spent }) => (
                <div key={stop.id} className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-800">
                        {stop.order}. {stop.name}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
                      </p>
                    </div>
                    <span className="text-sm text-neutral-500">
                      ${spent.toLocaleString()} / ${allocated.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar
                    value={allocated > 0 ? (spent / allocated) * 100 : 0}
                    color={getBudgetProgressBarColor(spent, allocated)}
                    size="sm"
                  />
                  {categories.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {categories.map((category) => (
                        <div key={`${stop.id}-${category.name}`} className="flex items-center justify-between text-xs text-neutral-500">
                          <span>
                            <span className="mr-1">{category.icon}</span>
                            {category.name}
                          </span>
                          <span>${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Visual breakdown section */}
      {budget && (
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">
            Budget Breakdown
          </h2>
          <div className="space-y-4">
            {categoriesWithExpenses.map((category) => {
              const maxAllocated = Math.max(
                ...categoriesWithExpenses.map((c) => c.allocated)
              );
              const barWidth =
                maxAllocated > 0
                  ? (category.allocated / maxAllocated) * 100
                  : 0;
              const spentWidth =
                maxAllocated > 0
                  ? (category.spent / maxAllocated) * 100
                  : 0;
              const barColor =
                categoryBarColorMap[category.name] || 'bg-neutral-400';

              return (
                <div key={`${category.stopId ?? 'trip'}-${category.name}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-sm font-medium text-neutral-700">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm text-neutral-500">
                      ${category.spent.toLocaleString()} / $
                      {category.allocated.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-3 bg-neutral-100 rounded-full overflow-hidden">
                    {/* Allocated bar */}
                    <div
                      className="absolute top-0 left-0 h-full bg-neutral-200 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* Spent bar */}
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${spentWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">
                Total
              </span>
              <span className="text-sm font-semibold text-neutral-800">
                ${totalSpent.toLocaleString()} / $
                {totalAllocated.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Modal
        isOpen={expenseModalOpen}
        onClose={closeExpenseModal}
        title={editingExpenseId ? 'Edit Expense' : 'Add Expense'}
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveExpense();
          }}
        >
          <Input
            label="Expense name"
            value={expenseForm.title}
            onChange={(event) => setExpenseForm({ ...expenseForm, title: event.target.value })}
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
              onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
              required
            />
            <label>
              <span className="block text-sm font-medium text-neutral-700 mb-1.5">Category</span>
              <select
                value={expenseForm.category}
                onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {[...new Set(categoriesWithExpenses.map((category) => category.name))].map((categoryName) => (
                  <option key={categoryName} value={categoryName}>{categoryName}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isMultiStop && (
              <label>
                <span className="block text-sm font-medium text-neutral-700 mb-1.5">Stop</span>
                <select
                  value={expenseForm.stopId}
                  onChange={(event) => setExpenseForm({ ...expenseForm, stopId: event.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Trip-wide</option>
                  {orderedStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                  ))}
                </select>
              </label>
            )}
            <Input
              label="Date"
              type="date"
              value={expenseForm.date}
              onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })}
            />
          </div>
          <label>
            <span className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</span>
            <textarea
              value={expenseForm.notes}
              onChange={(event) => setExpenseForm({ ...expenseForm, notes: event.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Optional"
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeExpenseModal} disabled={isSavingExpense}>Cancel</Button>
            <Button type="submit" disabled={isSavingExpense}>
              {isSavingExpense
                ? 'Saving...'
                : editingExpenseId
                  ? 'Save changes'
                  : 'Add expense'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={expenseListModalOpen}
        onClose={() => setExpenseListModalOpen(false)}
        title={`Edit ${selectedCategory?.name ?? 'Category'} Expenses`}
        size="lg"
      >
        {selectedCategoryExpenses.length > 0 ? (
          <div className="space-y-3">
            {selectedCategoryExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{expense.title}</p>
                  <p className="text-sm text-neutral-500">
                    ${expense.amount.toLocaleString()}
                    {expense.date ? ` · ${expense.date}` : ''}
                  </p>
                  {expense.notes && <p className="text-xs text-neutral-500 mt-1">{expense.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditExpenseModal(expense)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteExpense(expense.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-neutral-700 mb-3">No local expenses in this category yet.</p>
            {selectedCategory && (
              <Button onClick={() => openAddExpenseModal(selectedCategory)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Expense
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Budget;
