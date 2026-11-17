import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  isLoading: boolean;
  /** La cuenta entró con una contraseña temporal del taller y debe crear la suya. */
  mustChangePassword: boolean;
  /** Nombre para el saludo (lo pone el taller al dar de alta al cliente). */
  firstName: string;
};

const AuthContext = createContext<AuthState>({
  session: null,
  isLoading: true,
  mustChangePassword: false,
  firstName: '',
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const metadata = session?.user.user_metadata ?? {};
  const mustChangePassword = metadata.must_change_password === true;
  const firstName = typeof metadata.full_name === 'string' ? metadata.full_name.split(' ')[0] : '';

  return (
    <AuthContext.Provider value={{ session, isLoading, mustChangePassword, firstName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
