import React from 'react';
import {
  Building2,
  Car,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plane,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import type { BudgetCategory, TripStop } from '../../types';

const categoryIconMap: Record<string, React.ReactNode> = {
  Flights: <Plane className="w-5 h-5" />,
  Hotel: <Building2 className="w-5 h-5" />,
  Food: <UtensilsCrossed className="w-5 h-5" />,
  Activities: <MapPin className="w-5 h-5" />,
  Transportation: <Car className="w-5 h-5" />,
  Miscellaneous: <MoreHorizontal className="w-5 h-5" />,
};

const categoryColorMap: Record<string, string> = {
  Flights: 'text-primary-600 bg-primary-50',
  Hotel: 'text-accent-600 bg-accent-50',
  Food: 'text-warning-600 bg-warning-50',
  Activities: 'text-success-600 bg-success-50',
  Transportation: 'text-error-500 bg-error-50',
  Miscellaneous: 'text-neutral-500 bg-neutral-100',
};

interface BudgetCategoryGridProps {
  categories: BudgetCategory[];
  orderedStops: TripStop[];
  isMultiStop: boolean;
  formatMoney: (value: number) => string;
  getStatus: (spent: number, allocated: number) => 'green' | 'yellow' | 'red';
  getProgressColor: (
    spent: number,
    allocated: number,
  ) => 'primary' | 'success' | 'warning' | 'error' | 'accent';
  getDetailsPath: (categoryName: string) => string | null;
  onManageExpenses: (category: BudgetCategory) => void;
  onEditBudget: (category: BudgetCategory) => void;
  onViewDetails: (path: string) => void;
}

const statusColors = {
  green: 'text-success-600',
  yellow: 'text-warning-500',
  red: 'text-error-500',
};

const BudgetCategoryGrid: React.FC<BudgetCategoryGridProps> = ({
  categories,
  orderedStops,
  isMultiStop,
  formatMoney,
  getStatus,
  getProgressColor,
  getDetailsPath,
  onManageExpenses,
  onEditBudget,
  onViewDetails,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {categories.map((category) => {
      const status = getStatus(category.spent, category.allocated);
      const progressColor = getProgressColor(category.spent, category.allocated);
      const progressValue =
        category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
      const iconClass =
        categoryColorMap[category.name] || 'text-neutral-500 bg-neutral-100';
      const icon = categoryIconMap[category.name] || (
        <MoreHorizontal className="w-5 h-5" />
      );
      const detailsPath = getDetailsPath(category.name);

      return (
        <Card
          hover={false}
          key={`${category.stopId ?? 'trip'}-${category.name}`}
          className="p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconClass}`}
              >
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  {category.name}
                </h3>
                {isMultiStop && category.stopId && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {orderedStops.find((stop) => stop.id === category.stopId)?.name}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-0.5">
                  Allocated: {formatMoney(category.allocated)}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${statusColors[status]}`}>
              {formatMoney(category.spent)}
            </span>
          </div>

          <ProgressBar
            value={progressValue}
            color={progressColor}
            size="sm"
            showLabel
          />

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-neutral-400">
              {category.allocated > 0
                ? `${Math.round(progressValue)}% used`
                : 'No budget allocated'}
            </span>
            {status === 'red' && category.allocated > 0 && (
              <span className="text-xs text-error-500 font-medium">
                Over budget
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageExpenses(category)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Manage Expenses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditBudget(category)}
            >
              <Wallet className="w-3.5 h-3.5 mr-1" />
              Edit Budget
            </Button>
            {detailsPath && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(detailsPath)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                View Details
              </Button>
            )}
          </div>
        </Card>
      );
    })}
  </div>
);

export default BudgetCategoryGrid;
