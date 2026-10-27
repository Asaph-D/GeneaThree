import { createClient, Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;
const configuredSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
const supabase = url && anonKey ? createClient(url, anonKey) : null;

interface AuthValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signUpWithEmail: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const error = query.get('error_description') || fragment.get('error_description');
    if (error) {
      setAuthError(decodeURIComponent(error.replace(/\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user: session?.user ?? null,
    loading,
    configured: Boolean(supabase),
    authError,
    clearAuthError: () => setAuthError(null),
    signInWithProvider: async (provider) => {
      if (!supabase) throw new Error('La connexion est momentanément indisponible.');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${configuredSiteUrl || window.location.origin}/demo` },
      });
      if (error) throw error;
    },
    signUpWithEmail: async ({ firstName, lastName, email, password }) => {
      if (!supabase) throw new Error("La création de compte est momentanément indisponible.");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${configuredSiteUrl || window.location.origin}/demo`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            privacy_consent_at: new Date().toISOString(),
          },
        },
      });
      if (error) throw error;
      return { requiresEmailConfirmation: !data.session };
    },
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [session, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}
