import React, { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, forceLogout } from '../utils/supabase';
import { hasAdminPrivilege, AdminPrivilegeType } from '../utils/diagnosticAssessmentDB';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  hasHospitalContextAccess?: boolean;
  privileges?: AdminPrivilegeType[];
  signUp?: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn?: (email: string, password: string) => Promise<any>;
  signOut?: () => Promise<any>;
  resetPassword?: (email: string) => Promise<any>;
  hasPrivilege?: (privilegeType: AdminPrivilegeType) => boolean;
  refreshPrivileges?: () => Promise<void>;
  checkUserPrivileges?: (user: any) => Promise<void>;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    hasHospitalContextAccess: false,
    privileges: [],
  });

  const authInitialized = React.useRef(false);

  const checkUserPrivileges = useCallback(async (user: User | null) => {
    if (!user?.email) {
      setState(prev => ({ ...prev, hasHospitalContextAccess: false, privileges: [] }));
      return;
    }
    try {
      const privilegeTypes: AdminPrivilegeType[] = [
        'hospital_context_access', 'full_admin', 'lumbar_puncture_admin', 'scale_management', 'user_management'
      ];
      const results = await Promise.all(privilegeTypes.map(async (type) => {
        const r = await hasAdminPrivilege(user.email!, type);
        return { type, ok: r.success && r.hasPrivilege };
      }));
      const granted = results.filter(r => r.ok).map(r => r.type);
      setState(prev => ({ ...prev, hasHospitalContextAccess: granted.includes('hospital_context_access') || granted.includes('full_admin'), privileges: granted }));
    } catch {
      setState(prev => ({ ...prev, hasHospitalContextAccess: false, privileges: [] }));
    }
  }, []);

  useEffect(() => {
    if (authInitialized.current) return; authInitialized.current = true;
    const emergencyTimeout = setTimeout(() => { setState(prev => ({ ...prev, loading: false, error: 'Session load timeout' })); }, 5000);
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(emergencyTimeout);
      if (error) {
        setState({ session: null, user: null, error: null, loading: false, hasHospitalContextAccess: false, privileges: [] });
      } else {
        setState(prev => ({ ...prev, session, user: session?.user ?? null, loading: false }));
        if (session?.user) checkUserPrivileges(session.user);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null, loading: false }));
      if (session?.user) await checkUserPrivileges(session.user); else setState(prev => ({ ...prev, hasHospitalContextAccess: false, privileges: [] }));
    });
    return () => { subscription.unsubscribe(); clearTimeout(emergencyTimeout); }
  }, [checkUserPrivileges]);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } }); if (error) throw error; return { data, error: null }; }
    catch (error) { const authError = error as AuthError; setState(prev => ({ ...prev, error: authError.message, loading: false })); return { data: null, error: authError }; }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; return { data, error: null }; }
    catch (error) { const authError = error as AuthError; setState(prev => ({ ...prev, error: authError.message, loading: false })); return { data: null, error: authError }; }
  }, []);

  const signOut = useCallback(async () => {
    await forceLogout();
    setState({ user: null, session: null, loading: false, error: null, hasHospitalContextAccess: false, privileges: [] });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email);
  }, []);

  const hasPrivilege = useCallback((priv: AdminPrivilegeType) => {
    return (state.privileges || []).includes(priv);
  }, [state.privileges]);

  const refreshPrivileges = useCallback(async () => {
    if (state.user) await checkUserPrivileges(state.user);
  }, [state.user, checkUserPrivileges]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasPrivilege,
    refreshPrivileges,
    checkUserPrivileges
  } as AuthState as any;
}

