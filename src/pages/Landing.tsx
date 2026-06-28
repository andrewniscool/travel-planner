import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Hotel,
  MapPin,
  Plane,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { AuthModalMode } from '../components/auth/AuthModal';
import LandingTripSearch from '../components/landing/LandingTripSearch';

const heroImage =
  'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1800';
const ctaImage =
  'https://images.pexels.com/photos/3769135/pexels-photo-3769135.jpeg?auto=compress&cs=tinysrgb&w=1000';

const features = [
  {
    icon: Plane,
    title: 'Flights',
    description: 'Intelligent routing and seat decisions tuned to comfort.',
  },
  {
    icon: Hotel,
    title: 'Hotels',
    description: 'Boutique stays and architectural retreats worth the detour.',
  },
  {
    icon: CalendarDays,
    title: 'Itineraries',
    description: 'Slow-paced schedules designed for presence, not rushing.',
  },
  {
    icon: Wallet,
    title: 'Budgeting',
    description: 'Transparent tracking so the experience stays in focus.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create',
    description:
      'Define your intent, from rest to discovery, before the route takes shape.',
  },
  {
    number: '02',
    title: 'Compare',
    description:
      'Evaluate routes, stays, and experiences by quality, pace, and fit.',
  },
  {
    number: '03',
    title: 'Build',
    description:
      'Turn the final plan into a calm digital concierge for the whole trip.',
  },
];

const itineraries = [
  {
    place: 'Kyoto, Japan',
    theme: 'Zen Retreat & Tea Ceremonies',
    dates: 'Oct 12 - 19',
    price: '$3,450',
    rating: '4.95',
    image:
      'https://images.pexels.com/photos/402028/pexels-photo-402028.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    place: 'Positano, Italy',
    theme: 'Coastal Slow-Living',
    dates: 'Sep 24 - Oct 2',
    price: '$5,200',
    rating: '4.98',
    badge: 'Refine Choice',
    image:
      'https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    place: 'Sedona, USA',
    theme: 'High-Desert Meditation',
    dates: 'Nov 5 - 12',
    price: '$2,800',
    rating: '4.89',
    image:
      'https://images.pexels.com/photos/273204/pexels-photo-273204.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    place: 'Geiranger, Norway',
    theme: 'Fjord Discovery & Solitude',
    dates: 'Dec 1 - 8',
    price: '$4,100',
    rating: '4.92',
    image:
      'https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
];

const openAuthModal = (mode: AuthModalMode) => {
  window.dispatchEvent(
    new CustomEvent<{ mode: AuthModalMode }>('refine:open-auth', {
      detail: { mode },
    }),
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGuestStart = () => {
    if (user) {
      navigate('/create-trip');
      return;
    }

    openAuthModal('sign-up');
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <section className="relative flex min-h-[820px] items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Misty emerald lake beneath mountains at sunrise"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-app-bg" />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-app-text shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary-700" />
            Intentional travel, carefully composed
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-normal text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-6xl">
            Plan your next journey with intention
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-lg">
            Discover curated experiences and thoughtfully paced itineraries
            tailored to your rhythm of life.
          </p>
          <button
            type="button"
            onClick={handleGuestStart}
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-primary-900/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 active:scale-[0.98]"
          >
            Start Planning
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <LandingTripSearch onSearch={handleGuestStart} />

      <section id="discover" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-normal text-app-text sm:text-4xl">
            Everything you need, nothing you do not.
          </h2>
          <p className="mt-3 text-base text-app-text-muted">
            Integrate each part of the journey without crowding the experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-transparent bg-app-surface-muted p-8 transition-all hover:border-primary-200"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-app-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-app-text-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-app-surface-muted py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-14 text-center text-3xl font-bold tracking-normal text-app-text md:text-left">
            Your journey in three steps
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="group">
                <div className="mb-6 text-5xl font-extrabold text-primary-700/20 transition-colors group-hover:text-primary-700">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-app-text">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-app-text-muted">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="destinations" className="mx-auto max-w-7xl px-6 py-24">
        <span id="journeys" className="sr-only">
          Featured journeys
        </span>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-app-text">
              Featured Itineraries
            </h2>
            <p className="mt-2 text-base text-app-text-muted">
              Designed by a community of refined travelers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGuestStart}
            className="inline-flex items-center gap-1 self-start text-sm font-bold text-app-text underline underline-offset-4 transition-colors hover:text-primary-700"
          >
            View all journeys
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {itineraries.map((trip) => (
            <article key={trip.place} className="group cursor-pointer">
              <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-app-surface-muted">
                <img
                  src={trip.image}
                  alt={trip.theme}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={handleGuestStart}
                  className="absolute right-3 top-3 text-white drop-shadow"
                  aria-label={`Save ${trip.place}`}
                >
                  <Heart className="h-6 w-6" />
                </button>
                {trip.badge && (
                  <div className="absolute left-3 top-3 rounded-full bg-app-surface px-3 py-1 text-xs font-bold text-app-text shadow-sm">
                    {trip.badge}
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-app-text">
                  {trip.place}
                </h3>
                <div className="flex items-center gap-1 text-sm text-app-text">
                  <Star className="h-4 w-4 fill-current" />
                  {trip.rating}
                </div>
              </div>
              <p className="mt-1 text-sm text-app-text-muted">{trip.theme}</p>
              <p className="text-sm text-app-text-muted">{trip.dates}</p>
              <p className="mt-1 text-base font-bold text-app-text">
                {trip.price}{' '}
                <span className="font-normal text-app-text-muted">journey</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-20 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 rounded-[2rem] bg-primary-50 p-8 md:grid-cols-2 md:p-16">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-normal text-app-text">
                Ready to redefine how you explore the world?
              </h2>
              <p className="mt-5 text-base leading-7 text-app-text-muted">
                Join intentional travelers who trade crowded tourism for refined
                discovery.
              </p>
              <button
                type="button"
                onClick={handleGuestStart}
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary-600 px-7 py-4 text-lg font-bold text-white shadow-lg shadow-primary-900/10 transition-colors hover:bg-primary-700"
              >
                Begin Your Itinerary
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 overflow-hidden rounded-2xl shadow-xl">
              <img
                src={ctaImage}
                alt="Traveler planning a route on a phone beside a passport"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-app-border bg-app-bg">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-normal text-primary-700">
              REFINE
            </p>
            <p className="mt-2 text-sm text-app-text-muted">
              2026 Refined Living. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-app-text-muted">
            <a href="#discover" className="transition-colors hover:text-primary-700">
              Discover
            </a>
            <a href="#destinations" className="transition-colors hover:text-primary-700">
              Destinations
            </a>
            <a href="#journeys" className="transition-colors hover:text-primary-700">
              Journeys
            </a>
            <button
              type="button"
              onClick={() => openAuthModal('sign-in')}
              className="transition-colors hover:text-primary-700"
            >
              Support
            </button>
          </div>
          <div className="flex gap-3 text-app-text-muted">
            <MapPin className="h-5 w-5" />
            <Users className="h-5 w-5" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
