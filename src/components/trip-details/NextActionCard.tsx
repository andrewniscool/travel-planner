import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { NextTripAction } from '../../utils/nextTripAction';

const NextActionCard: React.FC<{ tripId: string; action: NextTripAction }> = ({ tripId, action }) => (
  <Card hover={false} className="border-primary-200 bg-primary-50/60 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Sparkles className="h-5 w-5" /></span>
      <div><p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700">Do this next</p><h2 className="mt-1 text-lg font-semibold text-app-text-strong">{action.label}</h2><p className="mt-1 text-sm text-app-text-muted">{action.description}</p></div>
    </div>
    <Link className="mt-4 inline-block shrink-0 sm:mt-0" to={action.route ? `/trip/${tripId}/${action.route}` : '/dashboard'}><Button size="sm">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
  </Card>
);

export default NextActionCard;
