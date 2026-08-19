'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const clearStaleSession = async () => {
      await supabase.auth.signOut({ scope: 'local' });
      if (!isMounted) return;
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    const isInvalidRefreshToken = (error) => {
      if (!error) return false;
      const message = String(error.message || '');
      return (
        error.code === 'refresh_token_not_found' ||
        message.includes('Refresh Token Not Found') ||
        message.includes('Invalid Refresh Token')
      );
    };

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (isInvalidRefreshToken(error)) {
        await clearStaleSession();
        return;
      }

      if (error) {
        console.error('Supabase session error:', error);
      }

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED' && !nextSession) {
        await clearStaleSession();
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}
