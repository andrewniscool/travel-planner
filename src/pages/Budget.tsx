import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip';
import { getBudgetByTripId } from '../data/budget';
import type { TripBudget } from '../data/budget';
import { isMultiStopTrip } from '../data/trips';
import { useServiceTrip } from '../hooks/useServiceTrips';
import {
  budgetService,
  getAuthenticatedUserId,
  tripService,
} from '../services/travelDataService';
import {
  loadTripScopedValue,
  persistTripScopedValue,
} from '../utils/tripStorage';
import {
  DEFAULT_BUDGET_CATEGORIES,
  DEFAULT_BUDGET_CURRENCY,
  getBudgetCategoryKey as getCategoryAllocationKey,
  isBudgetCurrency,
} from '../utils/budget';
import Card from '../components/ui/Card';
import BudgetOverview from '../components/budget/BudgetOverview';
import BudgetCategoryGrid from '../components/budget/BudgetCategoryGrid';
import StopBudgetBreakdown from '../components/budget/StopBudgetBreakdown';
import BudgetBreakdownCard from '../components/budget/BudgetBreakdownCard';
import ExpenseManagerModal, {
  type ExpenseFormState,
} from '../components/budget/ExpenseManagerModal';
import BudgetAllocationModal from '../components/budget/BudgetAllocationModal';
import type {
  BudgetCategory,
  BudgetCurrency,
  BudgetExpense,
  TransportSegment,
} from '../types';

const LOCAL_BUDGET_EXPENSES_KEY = 'travel-builder:budget-expenses';
const LOCAL_BUDGET_ALLOCATIONS_KEY = 'travel-builder:budget-allocations';
const LOCAL_BUDGET_CURRENCIES_KEY = 'travel-builder:budget-currencies';
const LOCAL_TRAVEL_SEGMENTS_KEY = 'travel-builder:travel-segments';

const emptyExpenseForm = (category = '', stopId = ''): ExpenseFormState => ({
  title: '',
  amount: '',
  category,
  stopId,
  date: '',
  notes: '',
});

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

const loadStoredAllocations = (tripId: string): Record<string, number> => {
  return loadTripScopedValue(LOCAL_BUDGET_ALLOCATIONS_KEY, tripId, {});
};

const persistStoredAllocations = (
  tripId: string,
  allocations: Record<string, number>,
) => {
  persistTripScopedValue(LOCAL_BUDGET_ALLOCATIONS_KEY, tripId, allocations);
};

const loadStoredCurrency = (tripId: string): BudgetCurrency => {
  const currency = loadTripScopedValue<string | undefined>(
    LOCAL_BUDGET_CURRENCIES_KEY,
    tripId,
    undefined,
  );
  return currency && isBudgetCurrency(currency)
      ? currency
      : DEFAULT_BUDGET_CURRENCY;
};

const persistStoredCurrency = (tripId: string, currency: BudgetCurrency) => {
  persistTripScopedValue(LOCAL_BUDGET_CURRENCIES_KEY, tripId, currency);
};

const loadStoredExpenses = (tripId: string): BudgetExpense[] => {
  return loadTripScopedValue(LOCAL_BUDGET_EXPENSES_KEY, tripId, []);
};

const persistStoredExpenses = (tripId: string, expenses: BudgetExpense[]) => {
  persistTripScopedValue(LOCAL_BUDGET_EXPENSES_KEY, tripId, expenses);
};

const buildFallbackBudget = (tripId: string, totalBudget: number): TripBudget => ({
  tripId,
  categories: DEFAULT_BUDGET_CATEGORIES.map((category) => ({
    name: category.name,
    icon: category.icon,
    allocated: totalBudget > 0 ? Math.round(totalBudget * category.share) : 0,
    spent: 0,
  })),
});

const loadStoredTravelSegments = (
  tripId: string,
  fallbackSegments: TransportSegment[],
): TransportSegment[] => {
  return loadTripScopedValue(
    LOCAL_TRAVEL_SEGMENTS_KEY,
    tripId,
    fallbackSegments,
  );
};

const getTravelSegmentCategoryName = (segment: TransportSegment) =>
  segment.mode === 'flight' ? 'Flights' : 'Transportation';

const getTravelSegmentStopId = (segment: TransportSegment) =>
  segment.role === 'local' ? segment.fromStopId || segment.toStopId : undefined;

const getMatchingTravelSegments = (
  category: Pick<BudgetCategory, 'name' | 'stopId'>,
  segments: TransportSegment[],
  excludedSegmentIds: Set<string>,
) =>
  segments.filter(
    (segment) =>
      !excludedSegmentIds.has(segment.id) &&
      getTravelSegmentCategoryName(segment) === category.name &&
      (getTravelSegmentStopId(segment) ?? '') === (category.stopId ?? '') &&
      typeof segment.price === 'number',
  );

const getTravelSegmentTitle = (segment: TransportSegment) => {
  const label = segment.mode === 'flight'
    ? 'Flight'
    : segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1);
  return `${label}: ${segment.departureLocation} → ${segment.arrivalLocation}`;
};

const getCategoryDetailsPath = (tripId: string, categoryName: string) => {
  if (categoryName === 'Flights') return `/trip/${tripId}/flights`;
  if (categoryName === 'Hotel') return `/trip/${tripId}/hotels`;
  if (categoryName === 'Activities' || categoryName === 'Transportation') {
    return `/trip/${tripId}/itinerary`;
  }
  return null;
};

const Budget: React.FC = () => {
  const { tripId: routeTripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const fallbackTrip = useTrip();
  const {
    trip: serviceTrip,
    error: serviceTripError,
    source: tripSource,
  } = useServiceTrip(routeTripId);
  const trip = serviceTrip ?? fallbackTrip;
  const tripId = trip?.id;
  const mockBudget = trip ? getBudgetByTripId(trip.id) : undefined;
  const budget = trip
    ? mockBudget ?? buildFallbackBudget(trip.id, trip.budget || 0)
    : undefined;
  const travelSegments = useMemo(
    () => (trip ? loadStoredTravelSegments(trip.id, trip.transportSegments) : []),
    [trip]
  );
  const isMultiStop = trip ? isMultiStopTrip(trip) : false;
  const orderedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []),
    [trip]
  );
  const [expenses, setExpenses] = useState<BudgetExpense[]>(() =>
    trip ? loadStoredExpenses(trip.id) : []
  );
  const [allocationOverrides, setAllocationOverrides] = useState<Record<string, number>>(
    () => (trip ? loadStoredAllocations(trip.id) : {})
  );
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>(
    () => (trip ? trip.budgetCurrency ?? loadStoredCurrency(trip.id) : DEFAULT_BUDGET_CURRENCY)
  );
  const [expenseSource, setExpenseSource] = useState<'supabase' | 'fallback'>('fallback');
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [categorySource, setCategorySource] = useState<'supabase' | 'fallback'>('fallback');
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseListModalOpen, setExpenseListModalOpen] = useState(false);
  const [expenseManagerMode, setExpenseManagerMode] = useState<'list' | 'form'>('list');
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpenseForm());
  const [allocationForm, setAllocationForm] = useState('');
  const [currencyForm, setCurrencyForm] = useState<BudgetCurrency>(DEFAULT_BUDGET_CURRENCY);

  useEffect(() => {
    if (!tripId) return;
    const localExpenses = loadStoredExpenses(tripId);
    const localAllocations = loadStoredAllocations(tripId);
    let cancelled = false;

    setExpenses(localExpenses);
    setAllocationOverrides(localAllocations);
    setExpenseSource('fallback');
    setCategorySource('fallback');
    setExpenseError(null);

    async function loadSupabaseBudgetData() {
      if (!tripId || tripSource !== 'supabase') return;

      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) return;

        const [rows, categories] = await Promise.all([
          budgetService.listBudgetExpenses(tripId),
          budgetService.listBudgetCategories(tripId),
        ]);
        if (cancelled) return;

        const nextAllocations = categories.reduce<Record<string, number>>(
          (allocations, category) => ({
            ...allocations,
            [getCategoryAllocationKey(category)]: category.allocated,
          }),
          {},
        );

        setExpenses(rows);
        setAllocationOverrides(nextAllocations);
        persistStoredExpenses(tripId, rows);
        persistStoredAllocations(tripId, nextAllocations);
        setExpenseSource('supabase');
        setCategorySource('supabase');
      } catch {
        if (cancelled) return;
        setExpenseError('Supabase budget data could not be loaded. Showing local budget data instead.');
      }
    }

    void loadSupabaseBudgetData();

    return () => {
      cancelled = true;
    };
  }, [tripId, tripSource]);

  useEffect(() => {
    if (!tripId) return;
    if (categorySource !== 'supabase') {
      setAllocationOverrides(loadStoredAllocations(tripId));
    }
    setBudgetCurrency(trip?.budgetCurrency ?? loadStoredCurrency(tripId));
  }, [categorySource, trip?.budgetCurrency, tripId]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: budgetCurrency,
        maximumFractionDigits: budgetCurrency === 'JPY' ? 0 : 0,
      }).format,
    [budgetCurrency],
  );

  const budgetWithAllocationOverrides = useMemo(() => {
    if (!budget) return undefined;

    return {
      ...budget,
      categories: budget.categories.map((category) => {
        const allocationOverride = allocationOverrides[getCategoryAllocationKey(category)];
        return {
          ...category,
          allocated:
            typeof allocationOverride === 'number'
              ? allocationOverride
              : category.allocated,
        };
      }),
    };
  }, [allocationOverrides, budget]);

  const baseTravelSegmentIds = useMemo(
    () => new Set(mockBudget ? (trip?.transportSegments ?? []).map((segment) => segment.id) : []),
    [mockBudget, trip?.transportSegments],
  );

  const categoriesWithExpenses = useMemo(() => {
    if (!budgetWithAllocationOverrides) return [];

    return budgetWithAllocationOverrides.categories.map((category) => {
      const expenseTotal = expenses
        .filter(
          (expense) =>
            expense.category === category.name &&
            (expense.stopId ?? '') === (category.stopId ?? '')
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
      const travelTotal = getMatchingTravelSegments(
        category,
        travelSegments,
        baseTravelSegmentIds,
      )
        .reduce((sum, segment) => sum + (segment.price ?? 0), 0);

      return {
        ...category,
        spent: category.spent + expenseTotal + travelTotal,
      };
    });
  }, [baseTravelSegmentIds, budgetWithAllocationOverrides, expenses, travelSegments]);

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

  const remaining = totalAllocated - totalSpent;
  const costPerTraveler = trip ? totalSpent / trip.travelers : 0;
  const overallProgress =
    totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const selectedCategoryExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return expenses.filter(
      (expense) =>
        expense.category === selectedCategory.name &&
        (expense.stopId ?? '') === (selectedCategory.stopId ?? '')
    );
  }, [expenses, selectedCategory]);

  const selectedCategoryTravelSegments = useMemo(() => {
    if (!selectedCategory) return [];
    return getMatchingTravelSegments(
      selectedCategory,
      travelSegments,
      new Set<string>(),
    );
  }, [selectedCategory, travelSegments]);

  const updateExpenses = (nextExpenses: BudgetExpense[]) => {
    if (!trip) return;
    setExpenses(nextExpenses);
    persistStoredExpenses(trip.id, nextExpenses);
  };

  const updateAllocationOverrides = (nextOverrides: Record<string, number>) => {
    if (!trip) return;
    setAllocationOverrides(nextOverrides);
    persistStoredAllocations(trip.id, nextOverrides);
  };

  const updateBudgetCurrency = (currency: BudgetCurrency) => {
    if (!trip) return;
    setBudgetCurrency(currency);
    persistStoredCurrency(trip.id, currency);
  };

  const openAddExpenseForm = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(category.name, category.stopId ?? ''));
    setExpenseManagerMode('form');
    setExpenseListModalOpen(true);
  };

  const openExpenseListModal = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(category.name, category.stopId ?? ''));
    setExpenseManagerMode('list');
    setExpenseListModalOpen(true);
  };

  const openEditBudgetModal = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setAllocationForm(String(category.allocated));
    setCurrencyForm(budgetCurrency);
    setBudgetModalOpen(true);
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
    setExpenseManagerMode('form');
  };

  const returnToExpenseList = () => {
    setExpenseManagerMode('list');
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(selectedCategory?.name, selectedCategory?.stopId ?? ''));
  };

  const closeExpenseListModal = () => {
    setExpenseListModalOpen(false);
    setExpenseManagerMode('list');
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(selectedCategory?.name, selectedCategory?.stopId ?? ''));
  };

  const closeBudgetModal = () => {
    setBudgetModalOpen(false);
    setAllocationForm('');
    setCurrencyForm(budgetCurrency);
  };

  const handleSaveBudgetAllocation = async () => {
    if (!trip || !selectedCategory) return;
    const allocated = Number(allocationForm);
    if (!Number.isFinite(allocated) || allocated < 0) return;

    const nextOverrides = {
      ...allocationOverrides,
      [getCategoryAllocationKey(selectedCategory)]: allocated,
    };
    updateAllocationOverrides(nextOverrides);
    updateBudgetCurrency(currencyForm);

    if (categorySource === 'supabase' || tripSource === 'supabase') {
      try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
          setExpenseError('Saved locally. Sign-in is not connected yet.');
          setCategorySource('fallback');
        } else {
          const updates: Promise<unknown>[] = [];

          if (categorySource === 'supabase') {
            updates.push(
              budgetService.upsertBudgetCategory(
                trip.id,
                { ...selectedCategory, allocated },
                Math.max(0, categoriesWithExpenses.findIndex(
                  (category) =>
                    getCategoryAllocationKey(category) ===
                    getCategoryAllocationKey(selectedCategory),
                )),
              ),
            );
          }

          if (tripSource === 'supabase') {
            updates.push(
              tripService.updateTrip(trip.id, {
                budget_currency: currencyForm,
              }),
            );
          }

          await Promise.all(updates);
          setExpenseError(null);
        }
      } catch {
        setCategorySource('fallback');
        setExpenseError('Supabase budget save failed. Saved the change locally instead.');
      }
    }

    closeBudgetModal();
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

      returnToExpenseList();
    } catch {
      saveLocally(nextExpense);
      setExpenseSource('fallback');
      setExpenseError('Supabase budget save failed. Saved the expense locally instead.');
      returnToExpenseList();
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

      <BudgetOverview
        totalSpent={totalSpent}
        totalAllocated={totalAllocated}
        remaining={remaining}
        costPerTraveler={costPerTraveler}
        overallProgress={overallProgress}
        formatMoney={formatMoney}
        getProgressColor={getBudgetProgressBarColor}
      />

      {/* Budget category cards */}
      {budget && (
        <BudgetCategoryGrid
          categories={categoriesWithExpenses}
          orderedStops={orderedStops}
          isMultiStop={isMultiStop}
          formatMoney={formatMoney}
          getStatus={getBudgetStatus}
          getProgressColor={getBudgetProgressBarColor}
          getDetailsPath={(categoryName) =>
            getCategoryDetailsPath(trip.id, categoryName)
          }
          onManageExpenses={openExpenseListModal}
          onEditBudget={openEditBudgetModal}
          onViewDetails={navigate}
        />
      )}

      {/* Stop-level breakdown */}
      {budget && isMultiStop && (
        <StopBudgetBreakdown
          tripLevelCategories={tripLevelCategories}
          stopBudgetBreakdown={stopBudgetBreakdown}
          formatMoney={formatMoney}
          sumAllocated={sumAllocated}
          sumSpent={sumSpent}
          getProgressColor={getBudgetProgressBarColor}
        />
      )}

      {/* Visual breakdown section */}
      {budget && (
        <BudgetBreakdownCard
          categories={categoriesWithExpenses}
          totalSpent={totalSpent}
          totalAllocated={totalAllocated}
          formatMoney={formatMoney}
        />
      )}

      <ExpenseManagerModal
        isOpen={expenseListModalOpen}
        selectedCategory={selectedCategory}
        mode={expenseManagerMode}
        expenseForm={expenseForm}
        categories={categoriesWithExpenses}
        orderedStops={orderedStops}
        isMultiStop={isMultiStop}
        selectedCategoryExpenses={selectedCategoryExpenses}
        selectedCategoryTravelSegments={selectedCategoryTravelSegments}
        editingExpenseId={editingExpenseId}
        isSavingExpense={isSavingExpense}
        formatMoney={formatMoney}
        getTravelSegmentTitle={getTravelSegmentTitle}
        onClose={closeExpenseListModal}
        onFormChange={setExpenseForm}
        onSubmitExpense={handleSaveExpense}
        onCancelForm={returnToExpenseList}
        onAddExpense={openAddExpenseForm}
        onEditExpense={openEditExpenseModal}
        onDeleteExpense={handleDeleteExpense}
      />

      <BudgetAllocationModal
        isOpen={budgetModalOpen}
        selectedCategory={selectedCategory}
        allocationForm={allocationForm}
        currencyForm={currencyForm}
        orderedStops={orderedStops}
        onClose={closeBudgetModal}
        onAllocationChange={setAllocationForm}
        onCurrencyChange={setCurrencyForm}
        onSubmit={handleSaveBudgetAllocation}
      />
    </div>
  );
};

export default Budget;
