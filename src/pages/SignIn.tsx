import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Lock, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtNHYySDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="relative w-full max-w-md animate-fade-in">
        <Card hover={false} className="p-6 sm:p-8 shadow-card-hover">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
              <Compass className="h-6 w-6 text-primary-700" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Sign in to Travel Builder
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Frontend placeholder for the future account flow.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock className="h-4 w-4" />}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Sign In
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
