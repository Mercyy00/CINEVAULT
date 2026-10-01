import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { login, register, resetPassword, loginWithGoogle, showToast } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const strength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  })();
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('The passwords don’t match. Re-enter them and try again.');
        }
        if (password.length < 6) {
          throw new Error('Use at least 6 characters for your password.');
        }
        await register(name.trim(), email.trim(), password);
        showToast('Account created. Your library now syncs across devices.');
        onClose();
      } else if (mode === 'signin') {
        await login(email.trim(), password);
        showToast('Signed in.');
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setResetSuccess(true);
        showToast('Reset link sent. Check your email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('Signed in with Google.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in didn’t complete. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'signup' ? 'Create your account' : mode === 'signin' ? 'Sign in' : 'Reset password';
  const subtitle =
    mode === 'signup'
      ? 'Keep your watchlist and progress in sync everywhere you watch.'
      : mode === 'signin'
        ? 'Pick up right where you left off.'
        : 'Enter your email and we’ll send you a reset link.';

  const inputClass =
    'w-full bg-input/60 border border-border rounded-xl px-4 py-3.5 text-base text-foreground outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 placeholder:text-muted-foreground/50 transition-colors';

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 text-foreground animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[26rem] max-h-[92vh] overflow-y-auto custom-scrollbar bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl relative safe-bottom"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-8">
          <h2 className="text-2xl font-display font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 flex items-start gap-2.5 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {mode === 'forgot' && resetSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">Check your inbox — and your spam folder — for the reset link.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium mb-1.5">Name</label>
              <input
                id="auth-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium mb-1.5">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-sm font-medium">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  className={cn(inputClass, 'pr-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {mode === 'signup' && password && (
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex gap-1 h-1 flex-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          'h-full flex-1 rounded-full transition-colors duration-300',
                          step <= strength
                            ? strength <= 1
                              ? 'bg-destructive'
                              : strength === 2
                                ? 'bg-amber-500'
                                : strength === 3
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                            : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground w-14 text-right">{strengthLabel}</span>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-confirm" className="block text-sm font-medium mb-1.5">Confirm password</label>
              <input
                id="auth-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={inputClass}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl text-base hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed !mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'signup' ? (
              'Create account'
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-6 flex items-center gap-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="w-full py-3.5 rounded-xl bg-muted/40 hover:bg-muted border border-border text-foreground font-medium text-base transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="text-center mt-6 text-sm text-muted-foreground">
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="text-foreground font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
          {mode === 'signin' && (
            <>
              New to CineVault?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="text-foreground font-semibold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setResetSuccess(false); }}
              className="text-foreground font-semibold hover:underline cursor-pointer"
            >
              Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
