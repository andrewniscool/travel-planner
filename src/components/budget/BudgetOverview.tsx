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
  <Card hover={false} className="p-5">
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {[
        { label: 'Total budget', value: formatMoney(totalAllocated), icon: Wallet, tone: 'bg-primary-50 text-primary-600' },
        { label: 'Spent so far', value: formatMoney(totalSpent), icon: Receipt, tone: 'bg-accent-50 text-accent-600' },
        { label: remaining >= 0 ? 'Remaining' : 'Over budget', value: formatMoney(Math.abs(remaining)), icon: PiggyBank, tone: remaining >= 0 ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-500' },
        { label: 'Per traveler', value: formatMoney(Math.round(costPerTraveler)), icon: User, tone: 'bg-app-surface-muted text-app-text-muted' },
      ].map((item) => <div key={item.label} className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-lg font-semibold text-app-text-strong">{item.value}</p><p className="text-xs text-app-text-muted">{item.label}</p></div></div>)}
    </div>
    <div className="mt-5 border-t border-app-border-muted pt-4"><div className="mb-2 flex justify-between text-xs text-app-text-muted"><span>Overall spending</span><span>{Math.round(overallProgress)}%</span></div><ProgressBar value={overallProgress} color={getProgressColor(totalSpent, totalAllocated)} size="sm" /></div>
  </Card>
);

export default BudgetOverview;
