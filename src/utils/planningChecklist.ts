export interface PlanningChecklistStep {
  label: string;
  threshold: number;
  route: 'flights' | 'hotels' | 'explore' | 'budget' | 'itinerary';
}

export const PLANNING_CHECKLIST: PlanningChecklistStep[] = [
  { label: 'Book flights', threshold: 30, route: 'flights' },
  { label: 'Select hotel', threshold: 50, route: 'hotels' },
  { label: 'Plan activities', threshold: 60, route: 'explore' },
  { label: 'Set budget', threshold: 70, route: 'budget' },
  { label: 'Organize itinerary', threshold: 85, route: 'itinerary' },
];

export const getUnfinishedSteps = (progress: number) =>
  PLANNING_CHECKLIST.filter((step) => progress < step.threshold);
