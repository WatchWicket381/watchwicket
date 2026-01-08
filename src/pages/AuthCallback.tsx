import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Callback page loaded');
        console.log('[AuthCallback] Current URL:', window.location.href);
        console.log('[AuthCallback] Origin:', window.location.origin);
        console.log('[AuthCallback] Hash:', window.location.hash);
        console.log('[AuthCallback] Search:', window.location.search);

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const type = searchParams.get('type');

        console.log('[AuthCallback] Parsed params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error,
          errorDescription,
          type
        });

        if (error) {
          console.error('[AuthCallback] Auth error:', error, errorDescription);
          setErrorMessage(errorDescription || error);
          setStatus('error');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from callback tokens');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[AuthCallback] Session error:', sessionError);
            setErrorMessage(sessionError.message);
            setStatus('error');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          console.log('[AuthCallback] Session set successfully');
          console.log('[AuthCallback] User:', data.user?.email);
          setStatus('success');

          setTimeout(() => {
            console.log('[AuthCallback] Redirecting to home...');
            window.location.href = '/';
          }, 1000);
        } else {
          console.log('[AuthCallback] No tokens in URL, checking for existing session');
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !data.session) {
            console.error('[AuthCallback] No session available:', sessionError);
            setErrorMessage('Authentication failed. Please try again.');
            setStatus('error');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          console.log('[AuthCallback] Existing session found');
          console.log('[AuthCallback] User:', data.session.user?.email);
          setStatus('success');

          setTimeout(() => {
            console.log('[AuthCallback] Redirecting to home...');
            window.location.href = '/';
          }, 1000);
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
        setStatus('error');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <div className="inline-block w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Completing Sign In</h1>
            <p className="text-slate-400">Please wait while we sign you in...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 text-6xl">✓</div>
            <h1 className="text-2xl font-bold mb-2 text-green-400">Success!</h1>
            <p className="text-slate-400">Redirecting you to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Authentication Error</h1>
            <p className="text-slate-300 mb-4">{errorMessage}</p>
            <p className="text-slate-400 text-sm">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
}
