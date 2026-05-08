import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { useTrip } from '../hooks/useTrip';
import { getBudgetByTripId } from '../data/budget';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';

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

const Budget: React.FC = () => {
  const trip = useTrip();
  const budget = trip ? getBudgetByTripId(trip.id) : undefined;

  const totalSpent = useMemo(() => {
    if (!budget) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
  }, [budget]);

  const totalAllocated = useMemo(() => {
    if (!budget) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  }, [budget]);

  const remaining = (trip?.budget ?? 0) - totalSpent;
  const costPerTraveler = trip ? totalSpent / trip.travelers : 0;
  const overallProgress =
    trip && trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          {budget.categories.map((category) => {
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
              <Card hover={false} key={category.name} className="p-5">
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
                  <Button variant="ghost" size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Expense
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Visual breakdown section */}
      {budget && (
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">
            Budget Breakdown
          </h2>
          <div className="space-y-4">
            {budget.categories.map((category) => {
              const maxAllocated = Math.max(
                ...budget.categories.map((c) => c.allocated)
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
                <div key={category.name}>
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
    </div>
  );
};

export default Budget;
