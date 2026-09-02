import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, ChevronDown, Lock } from 'lucide-react';
import { BirthdayTypographyIntro } from './BirthdayTypographyIntro';
import { BirthdayPinLock } from './BirthdayPinLock';
import { LoveTreeCanvas } from './LoveTreeCanvas';
import { SpinningVinylDisc } from './SpinningVinylDisc';
import { HangingPolaroidsGallery } from './HangingPolaroidsGallery';
import { HangingSpiderman } from './HangingSpiderman';
import { HangingLanterns } from './HangingLanterns';
import { MagicalCornerFlower } from './MagicalCornerFlower';
import { ScrollFlyingButterfly } from './ScrollFlyingButterfly';
import { HusbandVoiceNoteSection } from './HusbandVoiceNoteSection';
import { MultiverseFilmReel } from './MultiverseFilmReel';
import { CoupleSpinWheelSection } from './CoupleSpinWheelSection';
import { BirthdayArcadeSection } from './BirthdayArcadeSection';
import { MovieTheaterSection } from './MovieTheaterSection';
import { SealedLettersSection } from './SealedLettersSection';
import { YearlyPromisesNotebookSection } from './YearlyPromisesNotebookSection';
import { YearlyBucketListSection } from './YearlyBucketListSection';
import { LuffySectionGuardian } from './LuffySectionGuardian';
import { LuffyTimelineOverview } from './LuffyTimelineOverview';
import { LuffyTimeSimulator } from './LuffyTimeSimulator';
import { BIRTHDAY_SECTIONS_SCHEDULE } from '../config/birthdaySchedule';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';

export function BirthdayPage() {
  // Always starts locked on every entry/visit so passcode is required each time
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(false);
  const { pauseTrack } = useBirthdayMusic();

  // Stop music on unmount when user leaves BirthdayPage
  useEffect(() => {
    return () => {
      pauseTrack();
    };
  }, [pauseTrack]);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const triggered = sessionStorage.getItem('cv:playBirthdayIntro');
    if (triggered === 'true') return true;
    const completed = sessionStorage.getItem('cv:birthdayIntroCompleted');
    return completed !== 'true';
  });

  useEffect(() => {
    const handleTriggerIntro = () => {
      setShowIntro(true);
    };
    const handleTriggerLock = () => {
      setIsPinUnlocked(false);
    };
    window.addEventListener('trigger-birthday-intro', handleTriggerIntro);
    window.addEventListener('trigger-birthday-lock', handleTriggerLock);
    return () => {
      window.removeEventListener('trigger-birthday-intro', handleTriggerIntro);
      window.removeEventListener('trigger-birthday-lock', handleTriggerLock);
    };
  }, []);

  const handleUnlockPin = () => {
    setIsPinUnlocked(true);
    const completed = sessionStorage.getItem('cv:birthdayIntroCompleted');
    if (completed !== 'true') {
      setShowIntro(true);
    }
  };

  const handleLockVault = () => {
    setIsPinUnlocked(false);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('cv:birthdayIntroCompleted', 'true');
    sessionStorage.removeItem('cv:playBirthdayIntro');
  };

  // Time Simulator State for testing & live preview
  const [simulatedHour, setSimulatedHour] = useState<number | null>(() => {
    const saved = localStorage.getItem('cinevault_sim_hour');
    return saved !== null && saved !== 'null' ? parseInt(saved, 10) : null;
  });
  const [simulatedMinute, setSimulatedMinute] = useState<number | null>(() => {
    const saved = localStorage.getItem('cinevault_sim_min');
    return saved !== null && saved !== 'null' ? parseInt(saved, 10) : null;
  });
  const [forceUnlockAll, setForceUnlockAll] = useState<boolean>(() => {
    return localStorage.getItem('cinevault_sim_unlock_all') === 'true';
  });

  const handleSetSimulation = (hour: number | null, minute: number | null, unlockAll: boolean) => {
    setSimulatedHour(hour);
    setSimulatedMinute(minute);
    setForceUnlockAll(unlockAll);
    localStorage.setItem('cinevault_sim_hour', String(hour));
    localStorage.setItem('cinevault_sim_min', String(minute));
    localStorage.setItem('cinevault_sim_unlock_all', String(unlockAll));
  };

  const scrollToTree = () => {
    const el = document.getElementById('love-tree-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If locked, present the Birthday PIN Lock screen with full theme capabilities
  if (!isPinUnlocked) {
    return <BirthdayPinLock onUnlock={handleUnlockPin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-500 overflow-x-hidden selection:bg-brand/30 selection:text-brand relative">
      
      {/* Dynamic Birthday Heart & Kinetic Typography Gateway */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="birthday-typography-gateway"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999]"
          >
            <BirthdayTypographyIntro onComplete={handleIntroComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambient Glows */}
      <div 
        className="fixed top-12 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700 -z-10"
        style={{ background: 'var(--theme-accent, #e8852a)' }}
      />
      <div 
        className="fixed bottom-10 right-10 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 pointer-events-none transition-all duration-700 -z-10 bg-pink-500"
      />

      {/* Hanging Golden Lanterns from Top Right Ceiling (Scrolls naturally) */}
      <HangingLanterns />

      {/* Magical Scroll-Flying Golden Butterfly (Gracefully guides across margins) */}
      <ScrollFlyingButterfly />

      {/* SECTION 1: Grand, Open, Genuine Birthday Landing */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-6xl mx-auto w-full pt-20">
        
        {/* Hanging Spider-Man from Top Left Ceiling */}
        <HangingSpiderman />

        {/* Spinning Vinyl Record on Bottom Left (Theme Synced - Music always active) */}
        <SpinningVinylDisc />

        {/* Magical Blooming Sundrop Flower on Bottom Right */}
        <MagicalCornerFlower />

        {/* Floating Petals / Badges Header & Replay Heart Story Button */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs sm:text-sm font-semibold backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>2nd September 2005 • Turning 21 Special</span>
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowIntro(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass border border-pink-500/30 hover:border-pink-500 text-xs sm:text-sm font-semibold text-pink-400 hover:text-pink-300 transition-all cursor-pointer shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Replay Heart Story 💖</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLockVault}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass border border-amber-500/30 hover:border-amber-500 text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
            title="Lock the Birthday Vault and return to PIN screen"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Vault 🔒</span>
          </motion.button>
        </div>

        {/* Big Genuine Header Text */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black text-foreground tracking-tight leading-[1.05] mb-6 drop-shadow-sm"
        >
          Happy Birthday <br />
          <span className="text-brand bg-gradient-to-r from-brand via-pink-500 to-brand bg-clip-text text-transparent drop-shadow-md">
            Divyanshi
          </span>
          <span className="inline-block ml-3 animate-bounce text-4xl sm:text-6xl md:text-7xl">🎂✨</span>
        </motion.h1>

        {/* Heartfelt Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-muted-foreground text-base sm:text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed mb-8"
        >
          To my dearest <span className="text-foreground font-bold">Divu</span>, <span className="text-foreground font-bold">Goluuu</span> & <span className="text-foreground font-bold">Besan Ka Ladduuu</span> — the sweetest, kindest, and most precious girl in my universe. 💖
        </motion.p>

        {/* Cute Personalized Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-10 max-w-2xl"
        >
          <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold text-foreground/85 backdrop-blur-sm shadow-sm flex items-center gap-1.5">
            🌻 Sunflowers & Lilies
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold text-foreground/85 backdrop-blur-sm shadow-sm flex items-center gap-1.5">
            👒 The Luffy PFP Mystery
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold text-foreground/85 backdrop-blur-sm shadow-sm flex items-center gap-1.5">
            📚 Future Government Officer
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold text-foreground/85 backdrop-blur-sm shadow-sm flex items-center gap-1.5">
            🔍 1,000 Product Reviews Master
          </span>
        </motion.div>

        {/* Scroll Down Invitation Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="pt-2"
        >
          <button
            onClick={scrollToTree}
            className="group flex flex-col items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-brand transition-all cursor-pointer"
          >
            <span>Scroll down for your story & the vaults</span>
            <div className="w-10 h-10 rounded-full glass border border-white/15 flex items-center justify-center group-hover:border-brand/50 group-hover:scale-110 transition-all shadow-md">
              <ChevronDown className="w-5 h-5 animate-bounce text-brand" />
            </div>
          </button>
        </motion.div>
      </section>

      {/* ROADMAP OVERVIEW: Straw Hat Grand Line Roadmap */}
      <LuffyTimelineOverview 
        simulatedHour={simulatedHour}
        simulatedMinute={simulatedMinute}
        forceUnlockAll={forceUnlockAll}
      />

      {/* SECTION 2: Centerpiece Blooming Love Tree & Heartfelt Story (Unlocks 11:00 AM) */}
      <section id="love-tree-section" className="relative pt-10 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[0]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <LoveTreeCanvas />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 3: 40 Hanging Polaroids on Fairy Light Ropes (Unlocks 12:00 PM) */}
      <section id="memories-section" className="relative pt-8 pb-20 px-2 sm:px-6 max-w-[1400px] mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[1]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <HangingPolaroidsGallery />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 4: Husband's Secret Voice Note & Slide-in Spider-Man (Unlocks 02:00 PM) */}
      <section id="husband-voicenote-section" className="relative pt-6 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[2]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <HusbandVoiceNoteSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 5: Us In Another Universe (35mm Multiverse Film Reel) (Unlocks 03:00 PM) */}
      <section id="multiverse-section" className="relative pt-6 pb-20 px-2 sm:px-6 max-w-[1400px] mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[3]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <MultiverseFilmReel />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 6: Birthday Arcade Corner (Interactive Mini-Game) (Unlocks 07:00 PM) */}
      <section id="arcade-section" className="relative pt-6 pb-20 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[4]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <BirthdayArcadeSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 7: Couple Spin Wheel & Party Games (Singing, Secrets & Wild Dares) (Unlocks 08:00 PM) */}
      <section id="wheel-games-section" className="relative pt-6 pb-28 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[5]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <CoupleSpinWheelSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 8: Divu & Jay's Starlight Movie Theater (Kitbull, Feast, Paperman) (Unlocks 09:00 PM) */}
      <section id="movie-theater-section" className="relative pt-6 pb-28 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[6]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <MovieTheaterSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 9: 21 Wax-Sealed Love Letters (Open When... & Scratch Cards) (Unlocks 10:00 PM) */}
      <section id="sealed-letters-section" className="relative pt-6 pb-28 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[7]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <SealedLettersSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 10: Our 2026-2027 Sacred Promise Notebook (10 from Jay, 10 from Divu) (Unlocks 11:00 PM) */}
      <section id="promises-notebook-section" className="relative pt-6 pb-28 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[8]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <YearlyPromisesNotebookSection />
        </LuffySectionGuardian>
      </section>

      {/* SECTION 11: Our 21st Year Couple Bucket List (21 Adventures to conquer together) (Unlocks 11:30 PM) */}
      <section id="bucket-list-section" className="relative pt-6 pb-28 px-3 sm:px-6 max-w-7xl mx-auto w-full">
        <LuffySectionGuardian
          section={BIRTHDAY_SECTIONS_SCHEDULE[9]}
          simulatedHour={simulatedHour}
          simulatedMinute={simulatedMinute}
          forceUnlockAll={forceUnlockAll}
        >
          <YearlyBucketListSection />
        </LuffySectionGuardian>
      </section>

      {/* Interactive Floating Time Machine Controller for Jay / Testing */}
      <LuffyTimeSimulator
        simulatedHour={simulatedHour}
        simulatedMinute={simulatedMinute}
        forceUnlockAll={forceUnlockAll}
        onSetSimulation={handleSetSimulation}
      />

      {/* SECTION 10: Final Space & Footer Buffer */}
      <div id="next-birthday-sections" className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pb-60 sm:pb-72">
        {/* Next sections ready */}
      </div>

    </div>
  );
}
