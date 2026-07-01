import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { BUDGET_CURRENCY_OPTIONS, isBudgetCurrency } from '../../utils/budget';
import type { BudgetCategory, BudgetCurrency, TripStop } from '../../types';

interface BudgetAllocationModalProps {
  isOpen: boolean;
  selectedCategory: BudgetCategory | null;
  allocationForm: string;
  currencyForm: BudgetCurrency;
  orderedStops: TripStop[];
  onClose: () => void;
  onAllocationChange: (value: string) => void;
  onCurrencyChange: (currency: BudgetCurrency) => void;
  onSubmit: () => void | Promise<void>;
}

const BudgetAllocationModal: React.FC<BudgetAllocationModalProps> = ({
  isOpen,
  selectedCategory,
  allocationForm,
  currencyForm,
  orderedStops,
  onClose,
  onAllocationChange,
  onCurrencyChange,
  onSubmit,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Edit ${selectedCategory?.name ?? 'Category'} Budget`}
    size="sm"
  >
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Allocated amount"
          type="number"
          min="0"
          step="1"
          value={allocationForm}
          onChange={(event) => onAllocationChange(event.target.value)}
          required
        />
        <Select
          label="Currency"
          value={currencyForm}
          onChange={(nextCurrency) => {
            if (isBudgetCurrency(nextCurrency)) {
              onCurrencyChange(nextCurrency);
            }
          }}
          options={BUDGET_CURRENCY_OPTIONS.map((currency) => ({
            value: currency.code,
            label: currency.label,
          }))}
        />
      </div>
      {selectedCategory && (
        <p className="text-sm text-neutral-500">
          Updates the allocation for {selectedCategory.name}
          {selectedCategory.stopId
            ? ` at ${
                orderedStops.find((stop) => stop.id === selectedCategory.stopId)
                  ?.name ?? 'this stop'
              }`
            : ''}
          . Currency changes apply to this trip's Budget page.
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save budget</Button>
      </div>
    </form>
  </Modal>
);

export default BudgetAllocationModal;
