import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** Nombre del mecánico; null si no hay sesión o aún se está comprobando. */
  staffName: string | null;
  isLoading: boolean;
  /** Motivo por el que se cerró la sesión (p. ej. una cuenta de cliente). */
  error: string | null;
};

const AuthContext = createContext<AuthState>({
  session: null,
  staffName: null,
  isLoading: true,
  error: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(isSupabaseConfigured);
  // Resultado de comprobar si el usuario de la sesión es del taller.
  const [staff, setStaff] = useState<{ userId: string; name: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('staff')
      .select('name')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setStaff({ userId, name: data?.name ?? null });
        if (data) {
          setError(null);
        } else {
          setError('Esta cuenta no pertenece al taller.');
          supabase.auth.signOut();
        }
      });
  }, [userId]);

  const staffChecked = staff !== null && staff.userId === userId;
  const staffName = staffChecked ? staff.name : null;
  const isLoading = isSessionLoading || (!!userId && !staffChecked);

  return (
    <AuthContext.Provider value={{ session, staffName, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
