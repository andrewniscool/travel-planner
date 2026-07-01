import React from 'react';
import { PiggyBank, Receipt, User, Wallet } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

interface BudgetOverviewProps {
  totalSpent: number;
  totalAllocated: number;
  remaining: number;
  costPerTraveler: number;
  overallProgress: number;
  formatMoney: (value: number) => string;
  getProgressColor: (
    spent: number,
    allocated: number,
  ) => 'primary' | 'success' | 'warning' | 'error' | 'accent';
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  totalSpent,
  totalAllocated,
  remaining,
  costPerTraveler,
  overallProgress,
  formatMoney,
  getProgressColor,
}) => (
  <>
    <Card hover={false} className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-neutral-800">
          Overall Budget
        </h2>
        <span className="text-sm text-neutral-500">
          {formatMoney(totalSpent)} of {formatMoney(totalAllocated)}
        </span>
      </div>
      <ProgressBar
        value={overallProgress}
        color={getProgressColor(totalSpent, totalAllocated)}
        showLabel
        size="md"
      />
    </Card>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card hover={false} className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">
              {formatMoney(totalAllocated)}
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
              {formatMoney(totalSpent)}
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
              {formatMoney(Math.abs(remaining))}
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
              {formatMoney(Math.round(costPerTraveler))}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Per Traveler</p>
          </div>
        </div>
      </Card>
    </div>
  </>
);

export default BudgetOverview;
