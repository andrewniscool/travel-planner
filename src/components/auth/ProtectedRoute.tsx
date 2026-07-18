import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

declare const __DEV_AUTH_BYPASS_ENABLED__: boolean;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, isLoading, isConfigured } = useAuth();

  if (__DEV_AUTH_BYPASS_ENABLED__ || !isConfigured) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-500 shadow-sm">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/sign-in" replace state={{ returnTo }} />;
  }

  return children;
};

export default ProtectedRoute;
