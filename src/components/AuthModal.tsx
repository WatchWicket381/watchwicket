import React, { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

type AuthModalProps = {
  onClose: () => void;
};

type SignUpStep = 'email' | 'verify' | 'complete';

function getPasswordStrength(password: string): { strength: number; text: string; color: string } {
  if (password.length === 0) return { strength: 0, text: '', color: '' };

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 1) return { strength, text: 'Weak', color: 'text-red-400' };
  if (strength <= 3) return { strength, text: 'Medium', color: 'text-yellow-400' };
  return { strength, text: 'Strong', color: 'text-green-400' };
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const captchaRef = useRef<any>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const passwordStrength = mode === 'signup' && signUpStep === 'complete' ? getPasswordStrength(password) : null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      setSuccess('Verification code sent! Check your email.');
      setTimeout(() => {
        setSignUpStep('verify');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, code: otpCode }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      setSuccess('Email verified! Complete your profile.');
      setTimeout(() => {
        setSignUpStep('complete');
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName);
      if (error) {
        console.error('[AuthModal] Signup error:', error);
        setError(error.message);
      } else {
        setSuccess('Account created! If email confirmation is enabled, check your inbox. Otherwise, you can sign in now.');
        setTimeout(() => {
          setMode('signin');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setSuccess('Account created! You can now sign in.');
        }, 3000);
      }
    } catch (err) {
      console.error('[AuthModal] Signup exception:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
  // ✅ CAPTCHA CHECK (ADD THIS)
  if (!captchaToken) {
    setError('Please complete the captcha');
    return;
  }

  setError('');
  setSuccess('');
  setLoading(true);

  try {
    const { error } = await signIn(email, password);

      if (error) {
        console.error('[AuthModal] Sign in error:', error);
        setError(error.message);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('[AuthModal] Sign in exception:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        console.error('[AuthModal] Reset password error:', error);
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      console.error('[AuthModal] Reset password exception:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const providerString = 'google';
    console.log('[AuthModal] Starting Google OAuth with provider:', providerString);
    console.log('[AuthModal] Provider type:', typeof providerString);
    console.log('[AuthModal] Provider string match test:', providerString === 'google');

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('[AuthModal] Google sign in error FULL DETAILS:');
        console.error('  - message:', error.message);
        console.error('  - status:', (error as any).status);
        console.error('  - code:', (error as any).code);
        console.error('  - name:', error.name);
        console.error('  - Full error object:', error);

        setError(`Google Sign In failed: ${error.message}`);
        setLoading(false);
      }
    } catch (err) {
      console.error('[AuthModal] Google sign in exception:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(`Exception: ${errorMsg}`);
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        setLoading(false);
        return;
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      setSuccess('New code sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const resetSignUpFlow = () => {
    setSignUpStep('email');
    setEmail('');
    setOtpCode('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setDevOtp('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetSignUpFlow();
            }}
            className="text-gray-400 hover:text-white text-3xl font-light"
          >
            ×
          </button>
        </div>

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-800">
                {success}
              </div>
            )}
<HCaptcha
  ref={captchaRef}
  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
  onVerify={(token) => setCaptchaToken(token)}
  onExpire={() => setCaptchaToken(null)}
/>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'signup' && signUpStep === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <p className="text-slate-300 text-sm mb-4">
              Enter your email to get started. We'll send you a verification code.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-800">
                {success}
              </div>
            )}

            {import.meta.env.DEV && devOtp && (
              <div className="text-blue-400 text-sm bg-blue-900 bg-opacity-30 p-3 rounded-lg border border-blue-800">
                DEV MODE: Your code is {devOtp}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {mode === 'signup' && signUpStep === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-slate-300 text-sm mb-4">
              We've sent a 6-digit code to <strong className="text-white">{email}</strong>. Enter it below to continue.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Verification Code *</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-800">
                {success}
              </div>
            )}

            {import.meta.env.DEV && devOtp && (
              <div className="text-blue-400 text-sm bg-blue-900 bg-opacity-30 p-3 rounded-lg border border-blue-800">
                DEV MODE: Your code is {devOtp}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Didn't receive a code? Resend
            </button>

            <button
              type="button"
              onClick={() => setSignUpStep('email')}
              className="w-full text-slate-400 hover:text-slate-300 text-sm"
            >
              ← Change email
            </button>
          </form>
        )}

        {mode === 'signup' && signUpStep === 'complete' && (
          <form onSubmit={handleCompleteSignUp} className="space-y-4">
            <p className="text-slate-300 text-sm mb-4">
              Email verified! Complete your profile to finish setting up your account.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordStrength && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength.strength
                            ? passwordStrength.strength <= 1
                              ? 'bg-red-500'
                              : passwordStrength.strength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.text}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-800">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-slate-300 text-sm mb-4">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900 bg-opacity-30 p-3 rounded-lg border border-green-800">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>
        )}

        {mode === 'signin' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm space-y-2">
          {mode === 'signin' && (
            <>
              <p className="text-slate-300">
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); resetSignUpFlow(); }}
                  className="text-green-400 hover:text-green-300 font-medium"
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-slate-300">
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); resetSignUpFlow(); }}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              <button
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
