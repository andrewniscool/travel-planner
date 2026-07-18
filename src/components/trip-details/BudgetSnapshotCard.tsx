import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { TripBudget } from '../../data/budget';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import SectionHeader from '../ui/SectionHeader';
import type { BudgetCurrency } from '../../types';
import { formatBudgetAmount } from '../../utils/budget';

interface BudgetSnapshotCardProps {
  tripId: string;
  budget?: TripBudget;
  totalAllocated: number;
  totalSpent: number;
  currency?: BudgetCurrency;
}

const progressColor = (pct: number) => (pct >= 100 ? 'error' : pct >= 75 ? 'warning' : 'primary');

const BudgetSnapshotCard: React.FC<BudgetSnapshotCardProps> = ({
  tripId,
  budget,
  totalAllocated,
  totalSpent,
  currency,
}) => {
  const pct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const topCategories = budget
    ? [...budget.categories].sort((a, b) => b.allocated - a.allocated).slice(0, 3)
    : [];

  return (
    <Card hover={false} className="p-5">
      <SectionHeader
        title="Budget"
        action={
          <Link
            to={`/trip/${tripId}/budget`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            {budget ? 'Open budget' : 'Set a budget'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      {budget ? (
        <>
          <p className="text-lg font-semibold text-app-text-strong">
            {formatBudgetAmount(totalSpent, currency)}{' '}
            <span className="text-sm font-normal text-app-text-muted">
              of {formatBudgetAmount(totalAllocated, currency)}
            </span>
          </p>
          <ProgressBar className="mt-2" value={pct} size="sm" color={progressColor(pct)} />
          <div className="mt-4 space-y-3 border-t border-app-border-muted pt-4">
            {topCategories.map((cat) => {
              const catPct = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
              return (
                <div key={`${cat.stopId ?? 'trip'}-${cat.name}`}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-app-text">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-app-text-muted">
                      {formatBudgetAmount(cat.spent, currency)} /{' '}
                      {formatBudgetAmount(cat.allocated, currency)}
                    </span>
                  </div>
                  <ProgressBar value={catPct} size="sm" color={progressColor(catPct)} />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-app-text-subtle">No budget set up yet.</p>
      )}
    </Card>
  );
};

export default BudgetSnapshotCard;
