import React from 'react';
import { Wallet } from 'lucide-react';
import type { TripBudget } from '../../data/budget';
import DossierSection from './DossierSection';
import ProgressBar from '../ui/ProgressBar';

interface BudgetSectionProps {
  budget?: TripBudget;
  totalAllocated: number;
  totalSpent: number;
}

const progressColor = (pct: number) => (pct >= 100 ? 'error' : pct >= 75 ? 'warning' : 'primary');

const BudgetSection: React.FC<BudgetSectionProps> = ({ budget, totalAllocated, totalSpent }) => {
  return (
    <DossierSection icon={<Wallet className="h-4 w-4" />} title="Budget">
      {budget ? (
        <>
          <div className="space-y-3">
            {budget.categories.map((cat) => {
              const pct = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
              return (
                <div key={`${cat.stopId ?? 'trip'}-${cat.name}`}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-app-text">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-app-text-muted">
                      ${cat.spent.toLocaleString()} / ${cat.allocated.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar value={pct} size="sm" color={progressColor(pct)} />
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-app-border-muted pt-3">
            <span className="text-sm font-semibold text-app-text-strong">Total</span>
            <span className="text-sm font-semibold text-app-text-strong">
              ${totalSpent.toLocaleString()}{' '}
              <span className="font-normal text-app-text-muted">
                of ${totalAllocated.toLocaleString()}
              </span>
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-app-text-subtle">No budget data.</p>
      )}
    </DossierSection>
  );
};

export default BudgetSection;
