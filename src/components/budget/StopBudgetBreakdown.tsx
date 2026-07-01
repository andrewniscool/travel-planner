import React from 'react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import type { BudgetCategory, TripStop } from '../../types';

interface StopBudgetItem {
  stop: TripStop;
  categories: BudgetCategory[];
  allocated: number;
  spent: number;
}

interface StopBudgetBreakdownProps {
  tripLevelCategories: BudgetCategory[];
  stopBudgetBreakdown: StopBudgetItem[];
  formatMoney: (value: number) => string;
  sumAllocated: (categories: BudgetCategory[]) => number;
  sumSpent: (categories: BudgetCategory[]) => number;
  getProgressColor: (
    spent: number,
    allocated: number,
  ) => 'primary' | 'success' | 'warning' | 'error' | 'accent';
}

const StopBudgetBreakdown: React.FC<StopBudgetBreakdownProps> = ({
  tripLevelCategories,
  stopBudgetBreakdown,
  formatMoney,
  sumAllocated,
  sumSpent,
  getProgressColor,
}) => (
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
              {formatMoney(sumSpent(tripLevelCategories))} /{' '}
              {formatMoney(sumAllocated(tripLevelCategories))}
            </span>
          </div>
          <ProgressBar
            value={
              sumAllocated(tripLevelCategories) > 0
                ? (sumSpent(tripLevelCategories) /
                    sumAllocated(tripLevelCategories)) *
                  100
                : 0
            }
            color={getProgressColor(
              sumSpent(tripLevelCategories),
              sumAllocated(tripLevelCategories),
            )}
            size="sm"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stopBudgetBreakdown.map(({ stop, categories, allocated, spent }) => (
          <div
            key={stop.id}
            className="rounded-xl bg-neutral-50 border border-neutral-100 p-4"
          >
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
                {formatMoney(spent)} / {formatMoney(allocated)}
              </span>
            </div>
            <ProgressBar
              value={allocated > 0 ? (spent / allocated) * 100 : 0}
              color={getProgressColor(spent, allocated)}
              size="sm"
            />
            {categories.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {categories.map((category) => (
                  <div
                    key={`${stop.id}-${category.name}`}
                    className="flex items-center justify-between text-xs text-neutral-500"
                  >
                    <span>
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </span>
                    <span>
                      {formatMoney(category.spent)} /{' '}
                      {formatMoney(category.allocated)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export default StopBudgetBreakdown;
