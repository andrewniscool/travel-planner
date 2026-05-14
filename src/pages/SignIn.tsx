import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Lock, Mail, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'sign-in' | 'sign-up';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword, signUpWithPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

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
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtNHYySDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="relative w-full max-w-md animate-fade-in">
        <Card hover={false} className="p-6 sm:p-8 shadow-card-hover">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
              <Compass className="h-6 w-6 text-primary-700" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {isSignUp ? 'Create your account' : 'Sign in to Travel Builder'}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {isSignUp
                ? 'Use email and password to start saving trips to Supabase.'
                : 'Sign in to save and load your trips from Supabase.'}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('sign-in');
                setError(null);
                setStatus(null);
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                !isSignUp
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('sign-up');
                setError(null);
                setStatus(null);
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isSignUp
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              Sign Up
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
                  : 'border-success-100 bg-success-50 text-success-700',
              ].join(' ')}
            >
              {error || status}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                icon={<User className="h-4 w-4" />}
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              icon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !isConfigured}
            >
              {isSubmitting
                ? isSignUp
                  ? 'Creating Account...'
                  : 'Signing In...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <Link
              to="/"
              className="font-medium text-neutral-500 transition-colors hover:text-neutral-800"
            >
              Back to Landing
            </Link>
            <span className="text-neutral-300">/</span>
            <Link
              to="/dashboard"
              className="font-medium text-primary-700 transition-colors hover:text-primary-800"
            >
              Go to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
