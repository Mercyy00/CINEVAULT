import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  Heart,
  RotateCcw,
  ArrowLeft,
  Palette,
  CheckCircle2,
  Eye,
  EyeOff,
  ClipboardPaste,
  SendHorizontal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';
import { MouseFollowingButterfly } from './MouseFollowingButterfly';

interface BirthdayPinLockProps {
  onUnlock: () => void;
}

// Pre-configured themes for live theme-switching on the lock page
const QUICK_THEMES = [
  { id: 'crimson-premiere', name: 'Crimson Premiere', color: '#e50914', bg: '#08080c' },
  { id: 'sunset-rose', name: 'Sunset Rose', color: '#e11d48', bg: '#fdf6f6' },
  { id: 'cinematic-dark', name: 'Cinematic Dark', color: '#e8852a', bg: '#0a0a0f' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', color: '#05d9e8', bg: '#1a0b2e' },
  { id: 'cherry-cola', name: 'Cherry Cola', color: '#c9184a', bg: '#0c0709' },
  { id: 'butter-green', name: 'Butter Green', color: '#22c55e', bg: '#08110b' },
  { id: 'matcha-cream', name: 'Matcha & Cream', color: '#2d6a4f', bg: '#f4f7f2' },
  { id: 'nordic-frost', name: 'Nordic Frost', color: '#0284c7', bg: '#f0f4f8' },
  { id: 'imperial-violet', name: 'Imperial Violet', color: '#8b5cf6', bg: '#0c0715' },
  { id: 'vanilla-cherry', name: 'Vanilla & Cherry', color: '#9a0002', bg: '#fdfaf7' },
  { id: 'elegant-light', name: 'Elegant Ivory', color: '#3e2723', bg: '#f5f0e8' },
] as const;

// Valid passcodes
const VALID_PASSCODES = [
  'cwyydqtvincd21',
  'CWYYDQTVINCD21',
  '0209',
  '2005',
  '02092005',
  '21',
  '020905',
  '1234',
  '0000',
  '2109',
  'divu21'
];

const IMPACT_MESSAGES = [
  "✨ Entering Divu's Birthday Universe...",
  "🌸 Gathering 21 Years of Beautiful Memories...",
  "🏮 Releasing Floating Tangled Sky Lanterns...",
  "🗝️ Preparing Secret Birthday Vault..."
];

export function BirthdayPinLock({ onUnlock }: BirthdayPinLockProps) {
  const { theme, setTheme, showToast } = useApp();
  const { playlist, playTrack, isPlaying, togglePlay, currentTrack } = useBirthdayMusic();
  const [passcode, setPasscode] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showText, setShowText] = useState<boolean>(true);
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start "All I Can Say" base track automatically
  useEffect(() => {
    const allICanSayIdx = playlist.findIndex(t => t.title.toLowerCase().includes('all i can say'));
    const targetIdx = allICanSayIdx !== -1 ? allICanSayIdx : 0;
    
    // Play immediately
    playTrack(targetIdx);

    // Also trigger on first user gesture in case browser blocks un-interacted autoplay with sound
    const handleFirstGesture = () => {
      playTrack(targetIdx);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [playlist, playTrack]);

  // 4-Second Impact Loading Screen Timer
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 4000; // Exactly 4.0 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setLoadingProgress(rawProgress);

      if (elapsed < 1100) {
        setLoadingMessageIdx(0);
      } else if (elapsed < 2300) {
        setLoadingMessageIdx(1);
      } else if (elapsed < 3400) {
        setLoadingMessageIdx(2);
      } else {
        setLoadingMessageIdx(3);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setIsLoadingImpact(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleValidatePass = useCallback((currentPass: string) => {
    const trimmed = currentPass.trim().toLowerCase();
    if (VALID_PASSCODES.some(valid => valid.toLowerCase() === trimmed)) {
      // SUCCESS: Unlock!
      setIsUnlocked(true);
      setErrorMessage(null);
      showToast('💖 Birthday Vault Unlocked! Welcome, my angel Divu ✨🎂');

      setTimeout(() => {
        onUnlock();
      }, 950);
    } else {
      // ERROR: Wrong Passcode
      setIsShaking(true);
      setErrorMessage(
        trimmed.length === 0
          ? 'Please enter the secret birthday passcode! 🔑'
          : 'Incorrect secret passcode! Please try again 🔐'
      );
      setTimeout(() => {
        setIsShaking(false);
      }, 650);
    }
  }, [onUnlock, showToast]);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const formatted = text.trim().toUpperCase();
          setPasscode(formatted);
          setErrorMessage(null);
          showToast('📋 Pasted from clipboard!');
          if (VALID_PASSCODES.some(valid => valid.toLowerCase() === formatted.toLowerCase())) {
            handleValidatePass(formatted);
          }
        }
      }
    } catch {
      showToast('⚠️ Clipboard access restricted. Please type the passcode manually.');
    }
  };

  const handleClear = useCallback(() => {
    if (isUnlocked) return;
    setErrorMessage(null);
    setPasscode('');
    inputRef.current?.focus();
  }, [isUnlocked]);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidatePass(passcode);
  };

  // 4-Second Cinematic Impact Loading Screen
  if (isLoadingImpact) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-500 overflow-hidden relative p-6 select-none">
        {/* Ambient background pulsing orbs */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full blur-[140px] opacity-35 pointer-events-none animate-pulse"
          style={{ background: 'var(--theme-accent, #e8852a)' }}
        />
        <div className="fixed top-12 left-12 w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none bg-pink-500" />
        <div className="fixed bottom-12 right-12 w-64 h-64 rounded-full blur-[100px] opacity-25 pointer-events-none bg-purple-500" />

        {/* Floating Lanterns & Sparkles during 4s loading */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5 opacity-50">
          <span className="absolute top-[20%] left-[15%] text-2xl animate-bounce delay-100">🏮</span>
          <span className="absolute top-[30%] right-[20%] text-2xl animate-pulse delay-300">✨</span>
          <span className="absolute bottom-[25%] left-[25%] text-2xl animate-pulse delay-500">🌸</span>
          <span className="absolute bottom-[35%] right-[15%] text-2xl animate-bounce delay-700">🏮</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-md w-full flex flex-col items-center text-center relative z-10"
        >
          {/* Centered Tangled Sun with slow glow rotation */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse pointer-events-none"
              style={{ background: 'radial-gradient(circle, #facc15 0%, #f59e0b 60%, transparent 80%)' }}
            />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="relative"
            >
              <img
                src="/images/tangled-sun.png"
                alt="Tangled Sun"
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
              />
            </motion.div>
          </div>

          {/* Title & Romantic Tag */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2 mb-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass border border-amber-400/30 text-amber-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>DIVU'S 21ST SPECIAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Opening Birthday Vault
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground min-h-[22px] transition-all duration-300">
              {IMPACT_MESSAGES[loadingMessageIdx]}
            </p>
          </motion.div>

          {/* Glowing 4-Second Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden shadow-inner relative">
            <motion.div
              className="h-full rounded-full transition-all duration-75 relative"
              style={{
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6)',
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white rounded-full blur-xs opacity-90 animate-pulse" />
            </motion.div>
          </div>

          {/* Music Status Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground/80 glass px-3 py-1 rounded-full border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🎵 Now Playing: <strong>Kali Uchis — All I Can Say</strong></span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground transition-colors duration-500 overflow-x-hidden selection:bg-brand/30 selection:text-brand relative p-4 sm:p-6 lg:p-8">
      {/* Background Ambient Glows */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-all duration-700 -z-10"
        style={{ background: 'var(--theme-accent, #e8852a)' }}
      />
      <div className="fixed bottom-10 right-10 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[130px] opacity-15 pointer-events-none transition-all duration-700 -z-10 bg-pink-500" />
      <div className="fixed top-10 left-10 w-[300px] h-[300px] rounded-full blur-[110px] opacity-15 pointer-events-none transition-all duration-700 -z-10 bg-purple-500" />

      {/* Floating Sparkles & Hearts Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5 opacity-40">
        <span className="absolute top-[12%] left-[10%] text-xl animate-pulse">✨</span>
        <span className="absolute top-[22%] right-[15%] text-2xl animate-bounce delay-300">🌸</span>
        <span className="absolute bottom-[20%] left-[14%] text-xl animate-pulse delay-500">💖</span>
        <span className="absolute bottom-[28%] right-[12%] text-2xl animate-bounce delay-700">🌻</span>
        <span className="absolute top-[50%] left-[6%] text-lg animate-pulse delay-1000">✨</span>
        <span className="absolute top-[65%] right-[8%] text-lg animate-pulse delay-150">🎂</span>
      </div>

      {/* Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-3 pt-2 pb-4 z-20">
        <a
          href="#home"
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full glass border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-semibold text-foreground hover:text-brand transition-all shadow-sm group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden xs:inline">Back to CineVault</span>
          <span className="xs:hidden">Back</span>
        </a>

        {/* Music Player & Theme Switcher Controls */}
        <div className="flex items-center gap-2">
          {/* Music Control Pill */}
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full glass border border-white/10 hover:border-brand/40 text-xs font-semibold text-foreground hover:text-brand transition-all shadow-sm cursor-pointer"
            title={isPlaying ? 'Pause Music' : 'Play Music'}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                <span className="hidden md:inline max-w-[120px] truncate text-[11px]">
                  {currentTrack?.title || 'All I Can Say'}
                </span>
                <span className="flex items-end gap-0.5 h-3 w-3">
                  <span className="w-0.5 bg-pink-500 rounded-full h-full animate-[bounce_0.8s_infinite]" />
                  <span className="w-0.5 bg-pink-400 rounded-full h-2/3 animate-[bounce_0.6s_infinite]" />
                  <span className="w-0.5 bg-pink-500 rounded-full h-4/5 animate-[bounce_0.9s_infinite]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline text-[11px] text-muted-foreground">Play Music</span>
              </>
            )}
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full glass border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-semibold text-foreground hover:text-brand transition-all shadow-sm cursor-pointer"
            title="Switch Theme"
          >
            <Palette className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">Theme:</span>
            <span className="capitalize font-bold text-brand">
              {theme.replace('-', ' ')}
            </span>
          </button>
        </div>
      </header>

      {/* Quick Theme Selector Dropdown Drawer */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl mb-4 p-4 rounded-3xl glass border border-border shadow-2xl z-30 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Palette className="w-3.5 h-3.5 text-brand" />
                <span>Select Lock Screen Theme</span>
              </div>
              <button
                onClick={() => setShowThemeSelector(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-0.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id as any);
                    showToast(`Theme changed to ${t.name} ✨`);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold transition-all border cursor-pointer",
                    theme === t.id
                      ? "bg-brand/15 border-brand text-brand shadow-sm"
                      : "bg-white/5 border-white/10 hover:border-white/20 text-foreground/80 hover:text-foreground"
                  )}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centerpiece Lock Card */}
      <main className="w-full max-w-lg my-auto flex flex-col items-center justify-center z-10">
        <motion.div
          animate={isShaking ? { x: [-14, 14, -10, 10, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full rounded-[2.25rem] glass border border-border/80 p-6 sm:p-8 shadow-2xl relative text-center backdrop-blur-xl overflow-hidden"
        >
          {/* Top glowing ambient highlight inside card */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
            style={{ background: 'var(--theme-accent, #e8852a)' }}
          />

          {/* Animated Lock Avatar */}
          <div className="relative mx-auto mb-4 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
            {/* Outer rotating pulse ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-brand/40"
            />
            {/* Inner Glow container */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn(
                "w-16 h-16 sm:w-18 sm:h-18 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-inner relative",
                isUnlocked
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  : "bg-brand/15 text-brand border border-brand/30 shadow-[0_0_25px_var(--theme-accent-glow,rgba(232,133,42,0.3))]"
              )}
            >
              <AnimatePresence mode="wait">
                {isUnlocked ? (
                  <motion.div
                    key="unlocked-icon"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  >
                    <Unlock className="w-8 h-8 sm:w-9 sm:h-9" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked-icon"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Lock className="w-8 h-8 sm:w-9 sm:h-9" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Vault Title & Personalized Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-brand" />
            <span>Turning 21 Vault • Sept 2</span>
            <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight mb-1">
            Divu's Birthday Vault
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6 font-medium">
            {isUnlocked
              ? "Access Granted, My Angel! 💖 Opening your universe..."
              : "Enter the secret passcode to unlock your birthday surprise 🎂✨"}
          </p>

          {/* Passcode Input Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
            {/* Input Box with glowing border */}
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type={showText ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setErrorMessage(null);
                  setPasscode(e.target.value.toUpperCase());
                }}
                disabled={isUnlocked}
                placeholder="Enter secret passcode..."
                className="w-full h-14 px-4 pr-24 rounded-2xl bg-white/5 border-2 border-white/15 focus:border-brand focus:bg-brand/5 text-foreground placeholder:text-muted-foreground/30 font-mono text-center text-base sm:text-lg font-black tracking-widest uppercase transition-all duration-200 outline-none shadow-inner"
              />

              {/* Inside Input Action Buttons */}
              <div className="absolute right-2 flex items-center gap-1">
                {passcode.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowText(!showText)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                  title={showText ? 'Hide characters' : 'Show characters'}
                >
                  {showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="p-1.5 rounded-lg text-brand hover:bg-brand/15 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold leading-snug"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit / Unlock Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={isUnlocked || passcode.trim().length === 0}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer",
                isUnlocked
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : passcode.trim().length > 0
                  ? "bg-brand text-brand-foreground hover:opacity-95 shadow-[0_10px_25px_-5px_var(--theme-accent-glow,rgba(232,133,42,0.4))]"
                  : "bg-white/10 text-foreground/80 hover:bg-white/15 border border-white/15 disabled:opacity-50"
              )}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>Unlocked! Opening Vault...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Birthday Page ✨</span>
                  <SendHorizontal className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </motion.button>
          </form>

          {/* Subtitle bottom text */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center text-[11px] text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand" />
              <span>Secret Vault Passcode Protected</span>
            </span>
          </div>
        </motion.div>
      </main>

      {/* Magical Tangled Golden Sun in Top-Left Sky */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="fixed top-12 sm:top-16 left-3 sm:left-6 md:left-10 lg:left-14 pointer-events-none z-10 select-none"
      >
        {/* Ambient sunburst glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-50 animate-pulse pointer-events-none"
          style={{ background: 'radial-gradient(circle, #facc15 0%, #f59e0b 50%, transparent 75%)' }}
        />
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.06, 1],
          }}
          transition={{
            rotate: { duration: 50, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative"
        >
          <img
            src="/images/tangled-sun.png"
            alt="Magical Tangled Sun Emblem"
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-[0_0_35px_rgba(234,179,8,0.7)]"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Flying Sky Lanterns drifting upwards in the sky */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        className="fixed top-16 sm:top-20 left-[16%] sm:left-[20%] md:left-[24%] pointer-events-none z-10 select-none hidden xs:block"
      >
        {/* Ambient warm lantern glow */}
        <div className="absolute inset-0 rounded-full blur-2xl bg-amber-400/25 opacity-70 animate-pulse pointer-events-none" />
        
        <motion.div
          animate={{
            y: [-14, 10, -14],
            x: [-6, 6, -6],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <img
            src="/images/tangled-lanterns.png"
            alt="Flying Tangled Sky Lanterns"
            className="w-28 sm:w-36 md:w-48 lg:w-56 h-auto object-contain drop-shadow-[0_10px_35px_rgba(245,158,11,0.65)]"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Secondary Floating Lantern Cluster (Top Right Midground) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
        className="fixed top-[18%] right-[22%] sm:right-[26%] md:right-[28%] lg:right-[32%] pointer-events-none z-5 select-none hidden sm:block"
      >
        <motion.div
          animate={{
            y: [8, -12, 8],
            x: [5, -5, 5],
            rotate: [1.5, -1.5, 1.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        >
          <img
            src="/images/tangled-lanterns.png"
            alt="Floating Sky Lanterns"
            className="w-16 sm:w-24 md:w-32 h-auto opacity-75 object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Romantic Tangled Boat with Lantern on the Water (Bottom Left) */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        className="fixed bottom-0 sm:bottom-1 left-2 sm:left-6 md:left-12 lg:left-16 pointer-events-none z-10 select-none"
      >
        {/* Ambient water reflection glow */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-4 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"
          style={{ background: 'var(--theme-accent, #8b5cf6)' }}
        />

        {/* Bow lantern candle glow */}
        <div className="absolute top-[28%] left-[8%] w-8 h-8 rounded-full bg-amber-400/50 blur-lg animate-pulse pointer-events-none" />

        <motion.div
          animate={{
            y: [-5, 4, -5],
            rotate: [-1.8, 1.8, -1.8],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <img
            src="/images/tangled-boat.png"
            alt="Rapunzel and Eugene on Boat"
            className="w-36 sm:w-48 md:w-60 lg:w-72 xl:w-80 h-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)]"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Fairytale Rapunzel Tower on the Right Margin (Half Visible from Right Screen Edge) */}
      <motion.div
        initial={{ opacity: 0, x: 80, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
        className="fixed bottom-0 right-0 translate-x-[46%] pointer-events-none z-10 select-none flex flex-col items-center justify-end"
      >
        {/* Ambient backlight glow matching theme */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-72 sm:h-96 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700 -z-10"
          style={{ background: 'var(--theme-accent, #e8852a)' }}
        />
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <img
            src="/images/rapunzel-tower.png"
            alt="Fairytale Rapunzel Tower"
            className="h-[60vh] sm:h-[72vh] md:h-[82vh] lg:h-[90vh] xl:h-[95vh] max-h-[950px] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Magical Golden Butterfly following mouse cursor with spring flight physics */}
      <MouseFollowingButterfly />

      {/* Footer info */}
      <footer className="w-full max-w-5xl flex items-center justify-center text-center text-xs text-muted-foreground/80 py-3 z-10">
        <p className="flex items-center gap-1.5 font-medium">
          <span>Crafted with infinite love for Divyanshi's 21st Birthday</span>
          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
        </p>
      </footer>
    </div>
  );
}
