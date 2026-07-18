import React from 'react';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Trip } from '../../types';
import { getUnfinishedSteps, PLANNING_CHECKLIST } from '../../utils/planningChecklist';
import Card from '../ui/Card';
const NextStepsPanel: React.FC<{ trip: Trip }> = ({ trip }) => {
  const remaining = getUnfinishedSteps(trip.planningProgress);
  const done = PLANNING_CHECKLIST.length - remaining.length;
  return (
    <Card hover={false} className="flex h-full flex-col p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold text-app-text-strong">Next Steps</h2>
        <span className="text-xs text-app-text-muted">{done} of 5 done</span>
      </div>
      {remaining.length ? (
        <div className="space-y-1">
          {remaining.map((step) => (
            <Link
              key={step.route}
              to={`/trip/${trip.id}/${step.route}`}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-app-text-muted hover:bg-app-surface-muted hover:text-app-text"
            >
              <Circle className="h-4 w-4" />
              <span className="flex-1">{step.label}</span>
              <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-primary-600" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-7 w-7 text-success-500" />
          <p className="mt-2 text-sm font-medium text-app-text">All planning steps complete</p>
          <Link className="mt-2 text-sm text-primary-600" to={`/trip/${trip.id}/summary`}>
            View trip summary
          </Link>
        </div>
      )}
    </Card>
  );
};
export default NextStepsPanel;
