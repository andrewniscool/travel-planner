import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

export type AuthModalMode = 'sign-in' | 'sign-up';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  returnTo?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'sign-in',
  onClose,
  returnTo = '/create-trip',
}) => {
  const navigate = useNavigate();
  const {
    user,
    isLoading,
    isConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithOAuth,
  } = useAuth();
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(
    null,
  );

  const isSignUp = mode === 'sign-up';

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setStatus(null);
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (isOpen && isConfigured && !isLoading && user) {
      onClose();
      navigate(returnTo);
    }
  }, [isConfigured, isLoading, isOpen, navigate, onClose, returnTo, user]);

  const updateMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setError(null);
    setStatus(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!isConfigured) {
      setError('Supabase env vars are missing, so auth is disabled.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithPassword(email.trim(), password);
        setStatus(
          'Account created. Confirm your email if required, then continue planning.',
        );
      } else {
        await signInWithPassword(email.trim(), password);
        onClose();
        navigate(returnTo);
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

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setStatus(null);

    if (!isConfigured) {
      setError('Supabase env vars are missing, so auth is disabled.');
      return;
    }

    setOauthProvider(provider);

    try {
      const redirectUrl = new URL('/sign-in', window.location.origin);
      redirectUrl.searchParams.set('returnTo', returnTo);
      await signInWithOAuth(provider, redirectUrl.toString());
    } catch (authError) {
      setOauthProvider(null);
      setError(
        authError instanceof Error
          ? authError.message
          : 'Authentication failed.',
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSignUp ? 'Create your account' : 'Log in to save'}
      size="sm"
      overlayClassName="bg-neutral-950/60 backdrop-blur-sm"
      className="overflow-hidden"
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-primary-50 p-4 text-primary-900">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-app-surface text-primary-700 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {isSignUp ? 'Save this journey.' : 'Pick up where you left off.'}
          </p>
          <p className="mt-1 text-sm leading-5 text-primary-900/70">
            Your draft stays lightweight until you create an account.
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => updateMode('sign-in')}
          className={[
            'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            !isSignUp
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800',
          ].join(' ')}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => updateMode('sign-up')}
          className={[
            'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            isSignUp
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800',
          ].join(' ')}
        >
          Sign up
        </button>
      </div>

      {(!isConfigured || error || status) && (
        <div
          className={[
            'mb-4 rounded-xl border p-3 text-sm',
            error || !isConfigured
              ? 'border-error-100 bg-error-50 text-error-600'
              : 'border-success-100 bg-success-50 text-success-600',
          ].join(' ')}
        >
          {error ||
            status ||
            'Supabase env vars are missing, so auth is disabled.'}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-800">
            Email
          </span>
          <div className="group flex items-center rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
            <Mail className="ml-4 h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-primary-600" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-none bg-transparent px-4 py-2.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
              placeholder="you@example.com"
              type="email"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-800">
            Password
          </span>
          <div className="group flex items-center rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
            <Lock className="ml-4 h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-primary-600" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-none bg-transparent px-4 py-2.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-0"
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
          size="lg"
          className="w-full gap-2 bg-primary-600 py-3.5 text-white shadow-lg shadow-primary-900/10 hover:bg-primary-700"
          disabled={isSubmitting || Boolean(oauthProvider) || !isConfigured}
        >
          {isSubmitting
            ? isSignUp
              ? 'Creating account...'
              : 'Logging in...'
            : isSignUp
              ? 'Create account'
              : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-4 py-1">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Or continue with
          </span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void handleOAuthSignIn('google')}
            disabled={!isConfigured || Boolean(oauthProvider)}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base font-bold text-primary-700">G</span>
            {oauthProvider === 'google' ? 'Opening...' : 'Google'}
          </button>
          <button
            type="button"
            onClick={() => void handleOAuthSignIn('apple')}
            disabled={!isConfigured || Boolean(oauthProvider)}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base font-bold">A</span>
            {oauthProvider === 'apple' ? 'Opening...' : 'Apple'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AuthModal;
