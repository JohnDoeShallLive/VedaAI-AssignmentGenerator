'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, School, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { setAuthCookie } from '@/app/actions/auth';

function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  
  // Toggles: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  
  // Toggles & states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: 'Weak', color: 'bg-red-500' });

  // Compute password strength when password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, text: 'Too Short', color: 'bg-gray-200' });
      return;
    }
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let text = 'Weak';
    let color = 'bg-red-500 w-1/4';
    if (score >= 4) {
      text = 'Very Strong';
      color = 'bg-green-500 w-full';
    } else if (score === 3) {
      text = 'Strong';
      color = 'bg-green-400 w-3/4';
    } else if (score === 2) {
      text = 'Medium';
      color = 'bg-yellow-500 w-1/2';
    }

    setPasswordStrength({ score, text, color });
  }, [password]);

  // Handle Credentials Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!auth) {
      setErrorMsg('Authentication is currently disabled (Firebase credentials missing).');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`, { idToken }, { withCredentials: true });
      if (res.data.success) {
        if (res.data.sessionCookie) await setAuthCookie(res.data.sessionCookie);
        await refreshUser();
        setSuccessMsg('Logged in successfully! Redirecting...');
        
        // Force Next.js to re-evaluate middleware with new cookies
        router.refresh();
        
        setTimeout(() => {
          if (res.data.data.onboardingComplete) {
            router.replace('/assignments');
          } else {
            router.replace('/onboarding');
          }
        }, 800);
      } else {
        throw new Error('Failed to sync user with backend');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Handle Credentials Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!auth) {
      setErrorMsg('Registration is currently disabled (Firebase credentials missing).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Sync the user with backend to insert name and institution (could be done via a separate call if needed, but sync upserts)
      // Since it's a new user, they will be upserted in the sync call. We might lose name and institutionName unless we send it, 
      // but for MVP Firebase doesn't take institutionName. 
      // We'll update their display name in Firebase if possible, but the backend will just set default name if missing.
      // A better approach is calling an API endpoint first, or passing name in /sync. For simplicity, we just rely on /sync.
      
      const idToken = await userCredential.user.getIdToken(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`, { idToken }, { withCredentials: true });
      
      if (res.data.success) {
        if (res.data.sessionCookie) await setAuthCookie(res.data.sessionCookie);
        await refreshUser();
        setSuccessMsg('Registration successful! Redirecting...');
        
        // Force Next.js to re-evaluate middleware with new cookies
        router.refresh();
        
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1000);
      } else {
         throw new Error('Failed to sync user with backend');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to communicate with registration backend');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!auth) {
      setErrorMsg('Password reset is currently disabled (Firebase credentials missing).');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('If an account exists, a reset link has been generated and sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!auth) {
      setErrorMsg('Google Sign-in is currently disabled (Firebase credentials missing).');
      return;
    }

    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken(true);
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`, { idToken }, { withCredentials: true });
      
      if (res.data.success) {
        if (res.data.sessionCookie) await setAuthCookie(res.data.sessionCookie);
        await refreshUser();
        setSuccessMsg('Logged in successfully! Redirecting...');
        
        // Force Next.js to re-evaluate middleware with new cookies
        router.refresh();
        
        setTimeout(() => {
           if (res.data.data.onboardingComplete) {
            router.replace('/assignments');
          } else {
            router.replace('/onboarding');
          }
        }, 800);
      } else {
        throw new Error('Failed to sync user with backend');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white font-bold text-3xl shadow-lg shadow-brand/20 mb-4 animate-bounce">
          V
        </div>
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
          {mode === 'signin' && 'Sign in to VedaAI'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {mode === 'signin' && (
            <>
              Or{' '}
              <button onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }} className="font-semibold text-brand hover:underline">
                register a new account
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }} className="font-semibold text-brand hover:underline">
                Sign in instead
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }} className="font-semibold text-brand hover:underline">
              Return to sign in
            </button>
          )}
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-border sm:px-10">
        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm flex items-start gap-2 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder:text-text-secondary/50"
                  placeholder="name@school.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder:text-text-secondary/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-text-secondary" /> : <Eye className="h-4 w-4 text-text-secondary" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand hover:bg-[#D84D1B] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* 2. SIGN UP (REGISTER) FORM */}
        {mode === 'signup' && (
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Omitting Name and Institution for brevity in Firebase Auth email/pass unless using custom endpoint. Backend handles fallback. */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder:text-text-secondary/50"
                  placeholder="name@school.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder:text-text-secondary/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-text-secondary" /> : <Eye className="h-4 w-4 text-text-secondary" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-secondary font-medium">Strength:</span>
                    <span className={`font-bold ${
                      passwordStrength.text === 'Very Strong' || passwordStrength.text === 'Strong'
                        ? 'text-green-600'
                        : passwordStrength.text === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-red-500'
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}></div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand hover:bg-[#D84D1B] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form className="space-y-5" onSubmit={handleForgotPassword}>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enter your email address and we will generate a secure reset link.
            </p>
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-text-secondary" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder:text-text-secondary/50"
                  placeholder="name@school.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand hover:bg-[#D84D1B] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Generating link...' : 'Generate Reset Link'}
            </button>
          </form>
        )}

        {/* Google OAuth Provider Separator (Only on Sign In / Sign Up) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-text-secondary font-semibold">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-xl text-sm font-semibold text-text-primary bg-white hover:bg-surface active:scale-[0.98] transition-all shadow-sm"
              >
                {/* SVG Google Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google Account</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-2xl animate-pulse mb-3">
          V
        </div>
        <p className="text-xs text-text-secondary">Loading VedaAI Secure Portal...</p>
      </div>
    }>
      <LoginComponent />
    </Suspense>
  );
}
