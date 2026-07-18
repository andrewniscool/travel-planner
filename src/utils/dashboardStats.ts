import type { BudgetCurrency, Trip } from '../types';
import { DEFAULT_BUDGET_CURRENCY } from './budget';

export interface CurrencyTotal {
  currency: BudgetCurrency;
  amount: number;
}

export const groupTripBudgets = (trips: Trip[]): CurrencyTotal[] => {
  const totals = new Map<BudgetCurrency, number>();
  trips.forEach((trip) => {
    const currency = trip.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY;
    totals.set(currency, (totals.get(currency) ?? 0) + trip.budget);
  });
  return Array.from(totals, ([currency, amount]) => ({ currency, amount }));
};

export const formatCurrencyTotals = (totals: CurrencyTotal[]) =>
  totals
    .map(({ currency, amount }) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    )
    .join(' · ');
