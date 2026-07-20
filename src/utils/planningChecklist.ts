export interface PlanningChecklistStep {
  label: string;
  threshold: number;
  route: 'plan' | 'budget';
}

export const PLANNING_CHECKLIST: PlanningChecklistStep[] = [
  { label: 'Book flights', threshold: 30, route: 'plan' },
  { label: 'Select hotel', threshold: 50, route: 'plan' },
  { label: 'Plan activities', threshold: 60, route: 'plan' },
  { label: 'Set budget', threshold: 70, route: 'budget' },
  { label: 'Organize itinerary', threshold: 85, route: 'plan' },
];

export const getUnfinishedSteps = (progress: number) =>
  PLANNING_CHECKLIST.filter((step) => progress < step.threshold);
