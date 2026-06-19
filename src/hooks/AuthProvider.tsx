import React, { useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './authContext';
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../services/supabaseClient';
import { profileService } from '../services/travelDataService';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Authentication failed.';
}

async function ensureProfile(user: User, fullName?: string) {
  try {
    await profileService.upsertProfile({
      id: user.id,
      email: user.email ?? null,
      full_name:
        fullName ??
        (typeof user.user_metadata.full_name === 'string'
          ? user.user_metadata.full_name
          : null),
      avatar_url:
        typeof user.user_metadata.avatar_url === 'string'
          ? user.user_metadata.avatar_url
          : null,
    });
  } catch {
    // Profile creation can fail before email confirmation creates a session.
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const client = getSupabaseClient();

    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (isMounted) setSession(data.session);
      })
      .catch(() => {
        if (isMounted) setSession(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      async signInWithPassword(email, password) {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured.');
        }

        const { data, error } = await getSupabaseClient().auth.signInWithPassword(
          {
            email,
            password,
          },
        );

        if (error) throw new Error(getErrorMessage(error));
        if (data.user) await ensureProfile(data.user);
      },
      async signUpWithPassword(email, password, fullName) {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured.');
        }

        const { data, error } = await getSupabaseClient().auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName ?? '',
            },
          },
        });

        if (error) throw new Error(getErrorMessage(error));
        if (data.user) await ensureProfile(data.user, fullName);
      },
      async updatePassword(password) {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured.');
        }

        const { error } = await getSupabaseClient().auth.updateUser({
          password,
        });

        if (error) throw new Error(getErrorMessage(error));
      },
      async signOut() {
        if (!isSupabaseConfigured) return;
        const { error } = await getSupabaseClient().auth.signOut();
        if (error) throw new Error(getErrorMessage(error));
        setSession(null);
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
