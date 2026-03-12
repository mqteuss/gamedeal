import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      // Verifica se a sessão ainda é válida antes de criar perfis
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
      } else {
        // Perfil não existe (trigger pode ter falhado) — cria manualmente
        if (import.meta.env.DEV) console.log('Profile not found, creating one...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            email: currentUser.email || '',
          })
          .select()
          .single();

        if (insertError) {
          if (import.meta.env.DEV) console.error('Failed to create profile:', insertError);
          setProfile({
            id: currentUser.id,
            email: currentUser.email || '',
            username: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
          });
        } else {
          setProfile(newProfile as Profile);
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to fetch profile:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
