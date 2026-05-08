import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Building2,
  CalendarDays,
  Map,
  Wallet,
  Bookmark,
  MapPin,
  GitCompare,
  Calendar,
  Users,
  ArrowRight,
} from 'lucide-react';
import { testimonials } from '../data/testimonials';

const features = [
  {
    icon: Plane,
    title: 'Flights',
    description: 'Compare prices and routes across airlines',
  },
  {
    icon: Building2,
    title: 'Hotels',
    description: 'Find the perfect stay for your budget',
  },
  {
    icon: CalendarDays,
    title: 'Itinerary',
    description: 'Build your day-by-day travel plan',
  },
  {
    icon: Map,
    title: 'Map',
    description: 'See all your places on one map',
  },
  {
    icon: Wallet,
    title: 'Budget',
    description: 'Track spending and stay on budget',
  },
  {
    icon: Bookmark,
    title: 'Saved Places',
    description: 'Save restaurants, activities, and more',
  },
];

const steps = [
  {
    number: 1,
    icon: MapPin,
    title: 'Create a Trip',
    description: 'Set your destination, dates, and travel preferences',
  },
  {
    number: 2,
    icon: GitCompare,
    title: 'Compare Options',
    description: 'Browse flights, hotels, and activities side by side',
  },
  {
    number: 3,
    icon: Calendar,
    title: 'Build Your Itinerary',
    description: 'Organize your days and track your budget',
  },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtNHYySDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Plan every part of your trip in one beautiful workspace
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Compare flights and hotels, build day-by-day itineraries, track your budget, and organize everything in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-primary-700 font-semibold text-base hover:bg-primary-50 transition-colors shadow-lg"
              >
                Start Planning
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                to="/trip/trip-1"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="mt-16 animate-slide-up">
            <div className="max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden bg-white border border-white/20">
              <div className="flex h-80 sm:h-96">
                {/* Simulated Sidebar */}
                <div className="hidden sm:flex flex-col w-56 bg-neutral-900 p-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">Travel Builder</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10">
                      <div className="w-4 h-4 rounded bg-primary-400" />
                      <div className="w-20 h-3 rounded bg-white/30" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <div className="w-4 h-4 rounded bg-neutral-600" />
                      <div className="w-16 h-3 rounded bg-white/20" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <div className="w-4 h-4 rounded bg-neutral-600" />
                      <div className="w-24 h-3 rounded bg-white/20" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <div className="w-4 h-4 rounded bg-neutral-600" />
                      <div className="w-18 h-3 rounded bg-white/20" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      <div className="w-4 h-4 rounded bg-neutral-600" />
                      <div className="w-14 h-3 rounded bg-white/20" />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="w-full h-3 rounded bg-white/10" />
                  </div>
                </div>
                {/* Simulated Content Area */}
                <div className="flex-1 bg-neutral-50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-32 h-5 rounded bg-neutral-200" />
                    <div className="w-24 h-8 rounded-lg bg-primary-500" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-card">
                      <div className="w-6 h-6 rounded bg-primary-100 mb-2" />
                      <div className="w-12 h-6 rounded bg-neutral-200 mb-1" />
                      <div className="w-16 h-3 rounded bg-neutral-100" />
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-card">
                      <div className="w-6 h-6 rounded bg-accent-100 mb-2" />
                      <div className="w-8 h-6 rounded bg-neutral-200 mb-1" />
                      <div className="w-20 h-3 rounded bg-neutral-100" />
                    </div>
                    <div className="hidden sm:block bg-white rounded-xl p-4 shadow-card">
                      <div className="w-6 h-6 rounded bg-success-100 mb-2" />
                      <div className="w-10 h-6 rounded bg-neutral-200 mb-1" />
                      <div className="w-14 h-3 rounded bg-neutral-100" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl overflow-hidden shadow-card">
                      <div className="h-20 bg-gradient-to-r from-primary-200 to-accent-200" />
                      <div className="p-3">
                        <div className="w-20 h-4 rounded bg-neutral-200 mb-2" />
                        <div className="w-32 h-3 rounded bg-neutral-100" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-card">
                      <div className="h-20 bg-gradient-to-r from-accent-200 to-warning-200" />
                      <div className="p-3">
                        <div className="w-16 h-4 rounded bg-neutral-200 mb-2" />
                        <div className="w-28 h-3 rounded bg-neutral-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              Everything you need to plan the perfect trip
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl shadow-card p-8 card-hover animate-slide-up"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-5">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Connecting dashed line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0 border-t-2 border-dashed border-neutral-300" />

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center animate-slide-up"
              >
                <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-card border-4 border-primary-100 mb-6">
                  <div className="absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold">
                    {step.number}
                  </div>
                  <step.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Trip Preview Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              See what a planned trip looks like
            </h2>
          </div>
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-card overflow-hidden animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left: Image */}
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1540981/pexels-photo-1540981.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Tokyo, Japan"
                  className="w-full h-64 md:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Right: Details */}
              <div className="p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Tokyo, Japan
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>Jul 15 - Jul 22, 2026</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span>2 travelers</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>Cultural</span>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                    Itinerary Preview
                  </h4>
                  <ul className="space-y-1.5 text-sm text-neutral-500">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      Visit Shibuya Crossing & Harajuku
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      Explore Asakusa & Senso-ji Temple
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      Day trip to Hakone & Mt. Fuji view
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-neutral-600">
                    Est. Budget: <span className="font-semibold text-neutral-900">$5,500</span>
                  </span>
                </div>
                <Link
                  to="/trip/trip-1"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
                >
                  View Trip
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              Loved by travelers worldwide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-white rounded-2xl shadow-card p-8 card-hover animate-slide-up"
              >
                <p className="italic text-neutral-600 text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              Simple, transparent pricing
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Starter */}
            <div className="bg-white rounded-2xl shadow-card p-8 card-hover animate-slide-up">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Free Starter
              </h3>
              <p className="text-neutral-500 text-sm mb-4">
                Get started planning your trips
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-neutral-900">$0</span>
                <span className="text-neutral-500 text-sm">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 3 trips',
                  'Flight comparison',
                  'Hotel search',
                  'Basic itinerary',
                  'Budget tracking',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-neutral-600">
                    <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-primary-50 rounded-2xl shadow-card p-8 border-2 border-primary-200 card-hover animate-slide-up relative">
              <div className="absolute -top-3 right-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Pro
              </h3>
              <p className="text-neutral-500 text-sm mb-4">
                For the serious traveler
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-neutral-900">$12</span>
                <span className="text-neutral-500 text-sm">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited trips',
                  'Priority support',
                  'Advanced itinerary',
                  'Team collaboration',
                  'Export & share',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-neutral-600">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm opacity-50 cursor-not-allowed"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">Travel Builder</span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Plan every part of your trip in one beautiful workspace.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800">
            <p className="text-sm text-neutral-500">
              2026 Travel Builder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
