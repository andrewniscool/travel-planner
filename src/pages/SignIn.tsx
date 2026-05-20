import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Map,
  Plane,
  User,
  Wallet,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'sign-in' | 'sign-up';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const featureCards: FeatureCard[] = [
  {
    icon: <Plane className="h-6 w-6" />,
    title: 'Track every flight',
    subtitle: 'Plan every detail.',
    content: (
      <div className="rounded-lg border border-white/10 bg-white/10 p-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/55">
          <span>SFO</span>
          <div className="mx-6 flex-1 border-t border-dashed border-white/30" />
          <span>HND</span>
        </div>
        <div className="text-base font-semibold">JL001 · 12:20 PM</div>
      </div>
    ),
  },
  {
    icon: <CalendarDays className="h-6 w-6" />,
    title: 'Build your dream itinerary',
    subtitle: 'Stay organized.',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-base">
          <div className="h-2 w-2 rounded-full bg-accent-300" />
          <span>Day 3: Shibuya food walk</span>
        </div>
        <div className="flex items-center gap-4 text-base text-white/50">
          <div className="h-2 w-2 rounded-full bg-white/30" />
          <span>Day 4: Hakone onsen transfer</span>
        </div>
      </div>
    ),
  },
  {
    icon: <Map className="h-6 w-6" />,
    title: 'Curate hidden gems',
    subtitle: 'Explore like a local.',
    content: (
      <div className="flex gap-3">
        <div className="flex h-20 w-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-center text-xs font-semibold uppercase tracking-wide">
          Coffee alley
        </div>
        <div className="flex h-20 w-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-center text-xs font-semibold uppercase tracking-wide">
          Night market
        </div>
      </div>
    ),
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: 'Track every dollar',
    subtitle: 'Stay on budget.',
    content: (
      <div className="space-y-2">
        <div className="mb-1 flex justify-between text-sm">
          <span>Travel Budget</span>
          <span className="font-semibold">$4,250 / $5,000</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[85%] rounded-full bg-primary-100 shadow-[0_0_12px_rgb(204_251_241_/_0.55)]" />
        </div>
      </div>
    ),
  },
];

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword, signUpWithPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

  const updateMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setStatus(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!isConfigured) {
      setError('Supabase is not configured. Add your env vars first.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithPassword(email.trim(), password, fullName.trim());
        setStatus(
          'Account created. If email confirmation is enabled, confirm your email before signing in.',
        );
      } else {
        await signInWithPassword(email.trim(), password);
        navigate('/dashboard');
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Authentication failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 lg:flex-row">
      <main className="relative z-10 flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 sm:px-8 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-[440px] animate-fade-in">
          <div className="mb-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
              <Compass className="h-6 w-6 text-primary-700" />
            </div>
            <h1 className="text-4xl font-bold tracking-normal text-primary-700">
              Travel Builder
            </h1>
            <p className="mt-2 text-base text-neutral-500">
              {isSignUp
                ? 'Join our community of organized travelers.'
                : 'Begin your next curated journey.'}
            </p>
          </div>

          <div className="mb-8 flex rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => updateMode('sign-in')}
              className={[
                'flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-300',
                !isSignUp
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => updateMode('sign-up')}
              className={[
                'flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-300',
                isSignUp
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              Create Account
            </button>
          </div>

          {!isConfigured && (
            <div className="mb-5 rounded-xl border border-warning-100 bg-warning-50 p-3 text-sm text-warning-700">
              Supabase env vars are missing, so auth is disabled.
            </div>
          )}

          {(error || status) && (
            <div
              className={[
                'mb-5 rounded-xl border p-3 text-sm',
                error
                  ? 'border-error-100 bg-error-50 text-error-600'
                  : 'border-success-100 bg-success-50 text-success-600',
              ].join(' ')}
            >
              {error || status}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Full Name
                </span>
                <div className="group flex items-center rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
                  <User className="ml-4 h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-primary-600" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full border-none bg-transparent px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                    placeholder="Julian Wylde"
                    type="text"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">
                Email Address
              </span>
              <div className="group flex items-center rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
                <Mail className="ml-4 h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-primary-600" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border-none bg-transparent px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                  placeholder="explorer@travelbuilder.com"
                  type="email"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-sm font-semibold text-neutral-800">
                  Password
                </span>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary-700 transition-colors hover:text-primary-800"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="group flex items-center rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
                <Lock className="ml-4 h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-primary-600" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-none bg-transparent px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="mr-4 text-neutral-400 transition-colors hover:text-primary-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-3 py-4 shadow-lg shadow-primary-600/20 active:scale-[0.98]"
              disabled={isSubmitting || !isConfigured}
            >
              {isSubmitting
                ? isSignUp
                  ? 'Creating Account...'
                  : 'Signing In...'
                : isSignUp
                  ? 'Create My Account'
                  : 'Continue to Explore'}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <span className="text-base font-bold text-primary-700">G</span>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <span className="text-base font-bold"></span>
                Apple
              </button>
            </div>
          </form>
        </div>
      </main>

      <section className="gradient-hero relative hidden min-h-screen w-1/2 items-center justify-center overflow-hidden lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:40px_40px]" />

        <div className="relative h-screen w-full overflow-hidden">
          <div className="auth-feature-scroll absolute left-0 top-0 flex w-full flex-col">
            {[0, 1, 2].map((groupIndex) => (
              <div
                key={groupIndex}
                className="flex w-full flex-col gap-8 py-4"
                aria-hidden={groupIndex > 0}
              >
                {featureCards.map((card) => (
                  <div
                    key={`${groupIndex}-${card.title}`}
                    className="flex w-full justify-center px-8"
                  >
                    <div className="auth-glass-card w-full max-w-[400px] rounded-2xl p-8 text-white transition-all duration-500">
                      <div className="mb-5 flex items-center gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                          {card.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold tracking-normal">
                            {card.title}
                          </h3>
                          <p className="text-sm text-white/70">{card.subtitle}</p>
                        </div>
                      </div>
                      {card.content}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;
