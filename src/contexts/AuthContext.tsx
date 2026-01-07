import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile, Subscription } from '../supabaseClient';
import { User, AuthError } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  isPro: boolean;
  refreshSubscription: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [captchaSettings, setCaptchaSettings] = useState<any>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    } else {
      console.warn('[Auth] No profile found for user, attempting to create one');
      await ensureProfileExists(userId);
    }
  };

  const ensureProfileExists = async (userId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.data.user.email || '',
          full_name: user.data.user.user_metadata?.full_name || user.data.user.user_metadata?.name || '',
          avatar_url: user.data.user.user_metadata?.avatar_url || null,
          google_id: user.data.user.user_metadata?.provider_id || null,
        }, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        console.error('[Auth] Error creating profile:', error);
      } else if (data) {
        console.log('[Auth] Profile created successfully');
        setProfile(data);
      }
    } catch (err) {
      console.error('[Auth] Exception creating profile:', err);
    }
  };

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setSubscription(data);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    const fetchCaptchaSettings = async () => {
      try {
        console.log('[Auth] Fetching captcha settings from Supabase...');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`);
        const settings = await response.json();
        console.log('[Auth] Captcha settings received:', settings);

        if (settings.external?.captcha) {
          console.log('[Auth] Captcha provider:', settings.external.captcha.provider);
          console.log('[Auth] Captcha sitekey:', settings.external.captcha.site_key);
          setCaptchaSettings(settings.external.captcha);
        } else {
          console.log('[Auth] No captcha configuration found in settings');
        }
      } catch (err) {
        console.error('[Auth] Error fetching captcha settings:', err);
      }
    };

    fetchCaptchaSettings();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          await fetchSubscription(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const getCaptchaToken = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      console.log('[Auth] getCaptchaToken - Starting...');
      console.log('[Auth] Captcha settings:', captchaSettings);

      if (!captchaSettings) {
        console.warn('[Auth] No captcha settings available yet, skipping captcha');
        resolve(null);
        return;
      }

      const { provider, site_key } = captchaSettings;
      console.log('[Auth] Provider:', provider);
      console.log('[Auth] Site key:', site_key);

      if (!site_key) {
        console.error('[Auth] No site key configured!');
        resolve(null);
        return;
      }

      if (provider === 'hcaptcha') {
        console.log('[Auth] Using hCaptcha provider');
        if (typeof (window as any).hcaptcha === 'undefined') {
          console.error('[Auth] ERROR: hCaptcha not loaded!');
          resolve(null);
          return;
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
          const widgetId = (window as any).hcaptcha.render(container, {
            sitekey: site_key,
            size: 'invisible',
            callback: (token: string) => {
              console.log('[Auth] hCaptcha token received');
              if (container.parentNode) {
                document.body.removeChild(container);
              }
              resolve(token);
            },
            'error-callback': () => {
              console.error('[Auth] hCaptcha error');
              if (container.parentNode) {
                document.body.removeChild(container);
              }
              resolve(null);
            },
          });
          (window as any).hcaptcha.execute(widgetId);
        } catch (err) {
          console.error('[Auth] hCaptcha error:', err);
          if (container.parentNode) {
            document.body.removeChild(container);
          }
          resolve(null);
        }
      } else if (provider === 'turnstile') {
        console.log('[Auth] Using Turnstile provider');
        if (typeof (window as any).turnstile === 'undefined') {
          console.error('[Auth] ERROR: Turnstile not loaded!');
          resolve(null);
          return;
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
          (window as any).turnstile.render(container, {
            sitekey: site_key,
            callback: (token: string) => {
              console.log('[Auth] Turnstile token received');
              if (container.parentNode) {
                document.body.removeChild(container);
              }
              resolve(token);
            },
            'error-callback': (error: any) => {
              console.error('[Auth] Turnstile error:', error);
              if (container.parentNode) {
                document.body.removeChild(container);
              }
              resolve(null);
            },
            'timeout-callback': () => {
              console.error('[Auth] Turnstile timeout');
              if (container.parentNode) {
                document.body.removeChild(container);
              }
              resolve(null);
            },
          });
        } catch (err) {
          console.error('[Auth] Turnstile error:', err);
          if (container.parentNode) {
            document.body.removeChild(container);
          }
          resolve(null);
        }
      } else {
        console.error('[Auth] Unknown captcha provider:', provider);
        resolve(null);
      }
    });
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('[Auth] Sign up with captcha verification - redirectTo:', redirectTo);

    const captchaToken = await getCaptchaToken();
    console.log('[Auth] Captcha token obtained for signup:', captchaToken ? 'yes' : 'no');

    const signUpOptions: any = {
      data: {
        full_name: fullName || '',
      },
      emailRedirectTo: redirectTo,
    };

    if (captchaToken) {
      signUpOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: signUpOptions,
    });

    if (error) {
      console.error('[Auth] Sign up error:', error.message, error);
    } else {
      console.log('[Auth] Sign up successful:', data);
      if (data.user && !data.session) {
        console.warn('[Auth] Email confirmation may be required');
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] ========== SIGN IN ATTEMPT ==========');
    console.log('[Auth] Email:', email);
    console.log('[Auth] Starting captcha token generation...');

    const captchaToken = await getCaptchaToken();
    console.log('[Auth] Captcha token obtained:', captchaToken ? 'YES' : 'NO');
    if (captchaToken) {
      console.log('[Auth] Token preview:', captchaToken.substring(0, 30) + '...');
    }

    const authOptions: any = { email, password };

    if (captchaToken) {
      authOptions.options = { captchaToken };
      console.log('[Auth] Passing captcha token to Supabase');
    } else {
      console.warn('[Auth] NO CAPTCHA TOKEN - Supabase will likely reject this!');
    }

    console.log('[Auth] Calling supabase.auth.signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword(authOptions);

    if (error) {
      console.error('[Auth] ❌ Sign in FAILED');
      console.error('[Auth] Error message:', error.message);
      console.error('[Auth] Error details:', {
        status: (error as any).status,
        code: (error as any).code,
        name: error.name,
        __isAuthError: (error as any).__isAuthError,
      });
      console.error('[Auth] Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('[Auth] ✅ Sign in SUCCESSFUL');
      console.log('[Auth] User:', data.user?.email);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
    console.log('[Auth] Reset password - redirectTo:', redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error('[Auth] Reset password error:', error.message, error);
    } else {
      console.log('[Auth] Reset password email sent successfully');
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const providerString = 'google';
    const redirectTo = `${window.location.origin}/auth/callback`;

    console.log('[Auth] signInWithGoogle called');
    console.log('[Auth] Provider:', providerString, 'Type:', typeof providerString);
    console.log('[Auth] window.location.origin:', window.location.origin);
    console.log('[Auth] Dynamic redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerString as 'google',
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('[Auth] Google sign in error DETAILS:');
      console.error('  - message:', error.message);
      console.error('  - status:', (error as any).status);
      console.error('  - code:', (error as any).code);
      console.error('  - name:', error.name);
      console.error('  - Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('[Auth] Google sign in initiated successfully');
      console.log('[Auth] Response data:', data);
      console.log('[Auth] Provider used:', data.provider);
      console.log('[Auth] Redirect URL in response:', data.url);
    }

    return { error };
  };

  // Check for local Pro override (for development/owner access)
  const urlParams = new URLSearchParams(window.location.search);
  const hasProParam = urlParams.get('pro') === '1';
  const localProOverride = localStorage.getItem('watchwicket_pro_override') === 'true';

  // Set local override if pro=1 in URL
  useEffect(() => {
    if (hasProParam) {
      localStorage.setItem('watchwicket_pro_override', 'true');
    }
  }, [hasProParam]);

  const isPro =
    subscription?.subscription_type === 'pro' && subscription?.status === 'active' ||
    localProOverride ||
    hasProParam;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        isPro,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
