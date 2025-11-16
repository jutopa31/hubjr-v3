// Copied and adapted from original src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const cleanValue = (val: any) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1);
  }
  return val;
};

const supabaseUrl = cleanValue(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) || '' as string;
const supabaseKey = cleanValue(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || '' as string;

export const supabase = createClient(
  supabaseUrl || 'https://jvdpuxpurhetopsclqrq.supabase.co',
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZHB1eHB1cmhldG9wc2NscXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDk3NDYsImV4cCI6MjA3MjE4NTc0Nn0.WxyPZK6atg4CeQiPKCKwrUA5pTu6c0JyPGF26TqPTo8',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseKey && supabaseUrl.startsWith('https://');
};

export const clearAuthState = async () => {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => { if (key.startsWith('supabase.')) localStorage.removeItem(key); });
    sessionStorage.clear();
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  }
  await supabase.auth.signOut({ scope: 'local' });
};

export const forceLogout = async () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
    }
  } finally {
    await supabase.auth.signOut({ scope: 'local' });
  }
};
