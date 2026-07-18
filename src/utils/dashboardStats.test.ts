import { describe, expect, it } from 'vitest';
import { trips } from '../data/trips';
import { formatCurrencyTotals, groupTripBudgets } from './dashboardStats';

describe('dashboard currency totals', () => {
  it('groups budgets without combining currencies', () => {
    const base = trips[0];
    const totals = groupTripBudgets([
      { ...base, id: 'usd-1', budget: 1200, budgetCurrency: 'USD' },
      { ...base, id: 'eur-1', budget: 800, budgetCurrency: 'EUR' },
      { ...base, id: 'usd-2', budget: 300, budgetCurrency: 'USD' },
    ]);

    expect(totals).toEqual([
      { currency: 'USD', amount: 1500 },
      { currency: 'EUR', amount: 800 },
    ]);
    expect(formatCurrencyTotals(totals)).toBe('$1,500 · €800');
  });

  it('defaults missing currencies to USD and formats JPY without decimals', () => {
    const base = trips[0];
    expect(groupTripBudgets([{ ...base, budget: 250, budgetCurrency: undefined }])).toEqual([
      { currency: 'USD', amount: 250 },
    ]);
    expect(formatCurrencyTotals([{ currency: 'JPY', amount: 125000 }])).toBe('¥125,000');
  });
});
