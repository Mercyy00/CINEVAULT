import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
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

  // Calculate simple password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-border' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await register(name.trim(), email.trim(), password);
        showToast('🎉 Account created! Cloud sync is now active.');
        onClose();
      } else if (mode === 'signin') {
        await login(email.trim(), password);
        showToast('👋 Welcome back! Your profile and list are synced.');
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setResetSuccess(true);
        showToast('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('✨ Signed in with Google! Cloud sync active.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 text-foreground animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl relative text-foreground"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
            {mode === 'signup' && 'Sync your watchlist, continue watching progress & preferences across all devices.'}
            {mode === 'signin' && 'Access your synced watchlist and pick up exactly where you left off.'}
            {mode === 'forgot' && 'Enter your account email to receive password reset instructions.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* Success Alert for Reset */}
        {mode === 'forgot' && resetSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">Reset email sent! Please check your inbox and spam folder.</span>
          </motion.div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name or Nickname"
                  className="w-full bg-input/50 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-input/50 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-muted-foreground/60 transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-foreground">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-[11px] text-brand hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-input/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-muted-foreground/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator for Signup */}
              {mode === 'signup' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          "h-full flex-1 transition-all duration-300",
                          step <= strength.score ? strength.color : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Strength: <strong className="text-foreground">{strength.label}</strong></span>
                    <span>Min. 6 characters</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-input/50 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-brand-foreground font-bold rounded-xl text-xs sm:text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-card flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'signup' && 'Create Account & Sync'}
                {mode === 'signin' && 'Sign In'}
                {mode === 'forgot' && 'Send Reset Instructions'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google OAuth Option (for sign in / sign up) */}
        {mode !== 'forgot' && (
          <>
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative px-3 bg-card text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="w-full py-2.5 rounded-xl bg-muted/40 hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* Footer Toggle Mode */}
        <div className="text-center mt-5 pt-3 border-t border-border/60">
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="text-brand font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'signin' && (
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="text-brand font-semibold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setResetSuccess(false); }}
              className="text-xs text-brand font-semibold hover:underline cursor-pointer"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
