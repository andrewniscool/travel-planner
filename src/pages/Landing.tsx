import React from 'react';
import { ArrowRight, BedDouble, CalendarDays, ChevronDown, Plane, Wallet } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { AuthModalMode } from '../components/auth/AuthModal';
import LandingTripSearch from '../components/landing/LandingTripSearch';

const heroImage =
  'https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=2000';
const collagePrimary =
  'https://images.pexels.com/photos/273204/pexels-photo-273204.jpeg?auto=compress&cs=tinysrgb&w=1000';
const collageSecondary =
  'https://images.pexels.com/photos/402028/pexels-photo-402028.jpeg?auto=compress&cs=tinysrgb&w=800';
const journeyStripImages = [
  'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3769135/pexels-photo-3769135.jpeg?auto=compress&cs=tinysrgb&w=800',
];

const layers = [
  {
    icon: Plane,
    title: 'Flights & transport',
    description: 'Every segment of the route, held in one calm view.',
  },
  {
    icon: BedDouble,
    title: 'Stays',
    description: 'Compare lodging by place, not by endless tabs.',
  },
  {
    icon: CalendarDays,
    title: 'Itinerary',
    description: 'A day-by-day rhythm that leaves room to breathe.',
  },
  {
    icon: Wallet,
    title: 'Budget',
    description: 'Track what a trip costs while it takes shape.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create',
    description: 'Name a destination — or a whole multi-stop journey — and give it a shape.',
  },
  {
    number: '02',
    title: 'Compare',
    description: 'Weigh stays, routes, and experiences side by side, at your own pace.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'Turn the plan into a living itinerary you carry with you the whole way.',
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
  const prefersReducedMotion = useReducedMotion();

  const handleGuestStart = () => {
    if (user) {
      navigate('/create-trip');
      return;
    }

    openAuthModal('sign-up');
  };

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const revealViewport = { once: true, amount: 0.35 } as const;

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <section id="hero" className="relative flex min-h-[92svh] flex-col overflow-visible">
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            src={heroImage}
            alt="Golden-hour light over a coastal cliffside village"
            className="h-full w-full object-cover"
            initial={{ scale: 1.06 }}
            animate={{ scale: prefersReducedMotion ? 1.06 : 1.14 }}
            transition={{ duration: 20, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e1710]/60 via-[#1e1710]/30 to-app-bg" />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-32 text-center"
        >
          <motion.p
            variants={item}
            className="mb-6 text-xs font-semibold uppercase tracking-eyebrow text-white/80"
          >
            Intentional travel, thoughtfully composed
          </motion.p>

          <motion.h1
            variants={item}
            className="max-w-3xl font-display text-display font-medium text-white drop-shadow-[0_4px_24px_rgba(20,15,10,0.4)]"
          >
            Where will your <span className="italic text-primary-200">story</span> take you?
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-base font-medium leading-7 text-white/85 drop-shadow-[0_2px_12px_rgba(20,15,10,0.4)] sm:text-lg"
          >
            One quiet workspace for the whole journey — from the first &ldquo;where to?&rdquo; to
            the last day of the trip.
          </motion.p>

          <motion.div variants={item} className="mt-10 w-full max-w-4xl">
            <LandingTripSearch onSearch={handleGuestStart} />
          </motion.div>
        </motion.div>

        <motion.a
          href="#discover"
          aria-label="Explore what you can plan"
          initial={{ opacity: 0 }}
          animate={{ opacity: prefersReducedMotion ? 1 : [0.4, 1, 0.4] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.a>
      </section>

      {/* Feature moment A — plan every layer */}
      <section id="discover" className="mx-auto max-w-6xl px-6 py-28 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            className="relative order-last lg:order-first"
          >
            <motion.div
              variants={item}
              className="overflow-hidden rounded-[1.75rem] shadow-elevated"
            >
              <img
                src={collagePrimary}
                alt="Warm desert canyon at dusk"
                className="aspect-[4/5] w-full object-cover"
              />
            </motion.div>
            <motion.div
              variants={item}
              className="absolute -bottom-8 -right-4 hidden w-44 -rotate-3 overflow-hidden rounded-2xl border-4 border-app-bg shadow-elevated sm:block lg:w-52"
            >
              <img
                src={collageSecondary}
                alt="Lantern-lit temple street"
                className="aspect-square w-full object-cover"
              />
            </motion.div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
          >
            <motion.p
              variants={item}
              className="text-xs font-semibold uppercase tracking-eyebrow text-primary-700"
            >
              Plan every layer
            </motion.p>
            <motion.h2
              variants={item}
              className="mt-4 font-display text-section-title font-medium text-app-text-strong sm:text-4xl"
            >
              Everything the trip needs, nothing it doesn&rsquo;t.
            </motion.h2>
            <motion.p
              variants={item}
              className="mt-4 max-w-md text-base leading-7 text-app-text-muted"
            >
              Flights, stays, places, and spending live together — so the plan stays whole instead
              of scattered across a dozen tabs.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2"
            >
              {layers.map((layer) => (
                <div key={layer.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <layer.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-app-text-strong">{layer.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-app-text-muted">
                      {layer.description}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="destinations" className="bg-app-surface-muted py-28 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            className="max-w-2xl"
          >
            <motion.p
              variants={item}
              className="text-xs font-semibold uppercase tracking-eyebrow text-accent-600"
            >
              From idea to itinerary
            </motion.p>
            <motion.h2
              variants={item}
              className="mt-4 font-display text-section-title font-medium text-app-text-strong sm:text-4xl"
            >
              Three unhurried steps, from a spark to a route.
            </motion.h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            className="mt-16 grid gap-12 md:grid-cols-3"
          >
            {steps.map((step) => (
              <motion.article key={step.number} variants={item}>
                <span className="font-display text-6xl font-medium text-primary-200">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-2xl font-medium text-app-text-strong">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-app-text-muted">{step.description}</p>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            className="mt-20 grid grid-cols-3 gap-4 sm:gap-6"
          >
            {journeyStripImages.map((src, index) => (
              <motion.div
                key={src}
                variants={item}
                className="overflow-hidden rounded-2xl shadow-card"
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className={`w-full object-cover ${
                    index === 1 ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-accent-800">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-medium leading-tight text-app-surface sm:text-4xl">
            Ready to go somewhere on purpose?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-app-surface/75">
            Start with a single &ldquo;where to?&rdquo; and let the rest of the trip fall into
            place.
          </p>
          <button
            type="button"
            onClick={handleGuestStart}
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-700 active:scale-[0.98]"
          >
            Plan your trip
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-app-border bg-app-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-2xl font-medium text-app-text-strong">Refine</p>
            <p className="mt-2 max-w-xs text-sm text-app-text-muted">
              A quiet command center for the whole journey.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-app-text-muted">
            <a href="#discover" className="transition-colors hover:text-primary-700">
              Plan every layer
            </a>
            <a href="#destinations" className="transition-colors hover:text-primary-700">
              How it works
            </a>
            <button
              type="button"
              onClick={() => openAuthModal('sign-in')}
              className="transition-colors hover:text-primary-700"
            >
              Sign in
            </button>
          </div>
        </div>
        <div className="border-t border-app-border-muted">
          <p className="mx-auto max-w-6xl px-6 py-6 text-xs text-app-text-subtle">
            © 2026 Refine. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
