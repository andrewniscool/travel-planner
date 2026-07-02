import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

interface ChecklistRule {
  label: string;
  threshold: number;
}

interface PlanningProgressCardProps {
  checklist: ChecklistRule[];
  progress: number;
}

const PlanningProgressCard: React.FC<PlanningProgressCardProps> = ({
  checklist,
  progress,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
      Planning Progress
    </h2>
    <div className="space-y-3">
      {checklist.map((item) => {
        const checked = progress >= item.threshold;
        return (
          <div key={item.label} className="flex items-center gap-3">
            {checked ? (
              <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-neutral-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                checked ? 'text-neutral-700 line-through' : 'text-neutral-600'
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
    <div className="mt-5">
      <ProgressBar value={progress} color="primary" showLabel size="md" />
    </div>
  </Card>
);

export default PlanningProgressCard;
