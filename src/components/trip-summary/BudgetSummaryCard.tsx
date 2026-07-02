import React from 'react';
import { Wallet } from 'lucide-react';
import Card from '../ui/Card';
import type { TripBudget } from '../../data/budget';

interface BudgetSummaryCardProps {
  budget?: TripBudget;
  tripBudget: number;
  totalAllocated: number;
  totalSpent: number;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  budget,
  tripBudget,
  totalAllocated,
  totalSpent,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <Wallet className="w-5 h-5 text-success-500" />
      Budget Summary
    </h2>
    {budget ? (
      <div className="space-y-3">
        <div className="bg-neutral-50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Spent
                </th>
              </tr>
            </thead>
            <tbody>
              {budget.categories.map((cat) => (
                <tr
                  key={`${cat.stopId ?? 'trip'}-${cat.name}`}
                  className="border-b border-neutral-50 last:border-0"
                >
                  <td className="px-4 py-2.5 text-neutral-700">
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-neutral-600">
                    ${cat.allocated.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-neutral-600">
                    ${cat.spent.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-2 px-4">
          <span className="text-sm font-semibold text-neutral-800">Total</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-600">
              ${totalAllocated.toLocaleString()} allocated
            </span>
            <span className="font-semibold text-neutral-800">
              ${totalSpent.toLocaleString()} spent
            </span>
            <span
              className={`font-semibold ${tripBudget - totalSpent >= 0 ? 'text-success-600' : 'text-error-500'}`}
            >
              ${Math.abs(tripBudget - totalSpent).toLocaleString()}{' '}
              {tripBudget - totalSpent >= 0 ? 'remaining' : 'over'}
            </span>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Wallet className="w-8 h-8 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-500">No budget data</p>
      </div>
    )}
  </Card>
);

export default BudgetSummaryCard;
