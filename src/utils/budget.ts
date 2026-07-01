import type { BudgetCategory, BudgetCurrency } from '../types';

export const DEFAULT_BUDGET_CURRENCY: BudgetCurrency = 'USD';

export const BUDGET_CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { code: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
] as const;

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Flights', icon: '✈️', share: 0.35 },
  { name: 'Hotel', icon: '🏨', share: 0.3 },
  { name: 'Food', icon: '🍽️', share: 0.15 },
  { name: 'Activities', icon: '🎟️', share: 0.1 },
  { name: 'Transportation', icon: '🚕', share: 0.07 },
  { name: 'Miscellaneous', icon: '🛍️', share: 0.03 },
] as const;

export const isBudgetCurrency = (
  currency: string,
): currency is BudgetCurrency =>
  BUDGET_CURRENCY_OPTIONS.some((option) => option.code === currency);

export const getBudgetCategoryKey = (
  category: Pick<BudgetCategory, 'name' | 'stopId'>,
) => `${category.stopId ?? 'trip'}:${category.name}`;
