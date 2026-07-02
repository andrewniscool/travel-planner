import React from 'react';
import Select from '../ui/Select';
import TravelerPicker from '../ui/TravelerPicker';
import {
  BUDGET_CURRENCY_OPTIONS,
  isBudgetCurrency,
} from '../../utils/budget';
import type { BudgetCurrency } from '../../types';

interface TripDetailsSectionProps {
  travelers: number;
  budget: number | '';
  budgetCurrency: BudgetCurrency;
  onTravelersChange: (value: number) => void;
  onBudgetChange: (value: number | '') => void;
  onBudgetCurrencyChange: (currency: BudgetCurrency) => void;
}

const TripDetailsSection: React.FC<TripDetailsSectionProps> = ({
  travelers,
  budget,
  budgetCurrency,
  onTravelersChange,
  onBudgetChange,
  onBudgetCurrencyChange,
}) => (
  <div>
    <h3 className="mb-4 text-lg font-bold text-neutral-900">Trip Details</h3>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <TravelerPicker value={travelers} onChange={onTravelersChange} />

      <div className="flex min-h-[64px] rounded-xl border border-neutral-200 bg-white shadow-sm transition-all focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-500">
        <div className="flex w-20 shrink-0 items-center border-r border-neutral-200 px-1">
          <Select
            value={budgetCurrency}
            onChange={(nextCurrency) => {
              if (isBudgetCurrency(nextCurrency)) {
                onBudgetCurrencyChange(nextCurrency);
              }
            }}
            aria-label="Budget currency"
            options={BUDGET_CURRENCY_OPTIONS.map((currency) => ({
              value: currency.code,
              label: `${currency.code} ${currency.symbol}`,
              selectedLabel: currency.symbol,
            }))}
            buttonClassName="border-0 bg-transparent px-3 py-2 text-lg shadow-none focus:ring-0"
            dropdownClassName="right-auto w-36"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <label className="absolute left-3 top-2 text-[10px] font-extrabold uppercase text-neutral-900">
            Budget
          </label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(event) =>
              onBudgetChange(event.target.value ? Number(event.target.value) : '')
            }
            placeholder="5000"
            className="w-full rounded-r-xl border-0 bg-transparent px-3 pb-2 pt-6 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
          />
        </div>
      </div>
    </div>
  </div>
);

export default TripDetailsSection;
