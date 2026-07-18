import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { PLANNING_CHECKLIST } from '../../utils/planningChecklist';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface NextStepsCardProps {
  tripId: string;
  progress: number;
}

const NextStepsCard: React.FC<NextStepsCardProps> = ({ tripId, progress }) => {
  const doneCount = PLANNING_CHECKLIST.filter((step) => progress >= step.threshold).length;

  return (
    <Card hover={false} className="p-5">
      <SectionHeader title="Next steps" meta={`${doneCount} of ${PLANNING_CHECKLIST.length} done`} />
      <div className="space-y-1">
        {PLANNING_CHECKLIST.map((step) =>
          progress >= step.threshold ? (
            <div
              key={step.label}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-app-text-subtle"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
              {step.label}
            </div>
          ) : (
            <Link
              key={step.label}
              to={`/trip/${tripId}/${step.route}`}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
            >
              <Circle className="h-4 w-4 shrink-0 text-app-text-subtle" />
              <span className="flex-1">{step.label}</span>
              <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ),
        )}
      </div>
    </Card>
  );
};

export default NextStepsCard;
