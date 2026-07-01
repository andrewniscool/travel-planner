import React from 'react';
import Card from '../ui/Card';
import type { BudgetCategory } from '../../types';

const categoryBarColorMap: Record<string, string> = {
  Flights: 'bg-primary-500',
  Hotel: 'bg-accent-500',
  Food: 'bg-warning-500',
  Activities: 'bg-success-500',
  Transportation: 'bg-error-500',
  Miscellaneous: 'bg-neutral-400',
};

interface BudgetBreakdownCardProps {
  categories: BudgetCategory[];
  totalSpent: number;
  totalAllocated: number;
  formatMoney: (value: number) => string;
}

const BudgetBreakdownCard: React.FC<BudgetBreakdownCardProps> = ({
  categories,
  totalSpent,
  totalAllocated,
  formatMoney,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-lg font-semibold text-neutral-800 mb-4">
      Budget Breakdown
    </h2>
    <div className="space-y-4">
      {categories.map((category) => {
        const maxAllocated = Math.max(
          ...categories.map((currentCategory) => currentCategory.allocated),
        );
        const barWidth =
          maxAllocated > 0 ? (category.allocated / maxAllocated) * 100 : 0;
        const spentWidth =
          maxAllocated > 0 ? (category.spent / maxAllocated) * 100 : 0;
        const barColor = categoryBarColorMap[category.name] || 'bg-neutral-400';

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
                {formatMoney(category.spent)} / {formatMoney(category.allocated)}
              </span>
            </div>
            <div className="relative h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-neutral-200 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${spentWidth}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">Total</span>
        <span className="text-sm font-semibold text-neutral-800">
          {formatMoney(totalSpent)} / {formatMoney(totalAllocated)}
        </span>
      </div>
    </div>
  </Card>
);

export default BudgetBreakdownCard;
