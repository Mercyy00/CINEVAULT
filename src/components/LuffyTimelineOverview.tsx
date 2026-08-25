import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Lock, CheckCircle2, Heart, Compass } from 'lucide-react';
import { 
  BIRTHDAY_SECTIONS_SCHEDULE, 
  calculateSectionLockState 
   
} from '../config/birthdaySchedule';
import { playLuffySound } from '../utils/luffyAudio';
import { cn } from '../lib/utils';

interface LuffyTimelineOverviewProps {
  simulatedHour?: number | null;
  simulatedMinute?: number | null;
  forceUnlockAll?: boolean;
}

export function LuffyTimelineOverview({
  simulatedHour,
  simulatedMinute,
  forceUnlockAll
}: LuffyTimelineOverviewProps) {
  const [sectionsState, setSectionsState] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const checkAll = () => {
      const stateMap: { [id: string]: boolean } = {};
      BIRTHDAY_SECTIONS_SCHEDULE.forEach(sec => {
        const lock = calculateSectionLockState(sec, simulatedHour, simulatedMinute, forceUnlockAll);
        stateMap[sec.id] = lock.isLocked;
      });
      setSectionsState(stateMap);
    };

    checkAll();
    const interval = setInterval(checkAll, 1000);
    return () => clearInterval(interval);
  }, [simulatedHour, simulatedMinute, forceUnlockAll]);

  const scrollToSection = (domId: string, isLocked: boolean) => {
    // Play sound depending on lock state
    if (isLocked) {
      playLuffySound('angry');
    } else {
      playLuffySound('smile');
    }

    const el = document.getElementById(domId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const unlockedCount = BIRTHDAY_SECTIONS_SCHEDULE.filter(s => !sectionsState[s.id]).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="relative rounded-3xl p-6 sm:p-8 bg-card/60 dark:bg-card/40 border border-brand/20 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Glow */}
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-20 pointer-events-none -z-10"
          style={{ background: 'var(--theme-accent, #e8852a)' }}
        />

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand text-2xl shadow-inner shrink-0">
              <Compass className="w-6 h-6 animate-spin text-brand" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-bold font-mono mb-1">
                <span>👒 Straw Hat Grand Line Roadmap</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-foreground">
                Divu's 21st Birthday Surprise Timeline
              </h2>
            </div>
          </div>

          {/* Progress Counter Badge */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/5 dark:bg-black/30 border border-border flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-xs font-bold text-foreground">
                <span className="text-brand font-mono text-sm">{unlockedCount}</span> of <span className="font-mono text-sm">{BIRTHDAY_SECTIONS_SCHEDULE.length}</span> Vaults Unlocked
              </div>
            </div>
          </div>
        </div>

        {/* 8 Scheduled Stops Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {BIRTHDAY_SECTIONS_SCHEDULE.map((sec, idx) => {
            const isLocked = sectionsState[sec.id] ?? true;

            return (
              <motion.div
                key={sec.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection(sec.domId, isLocked)}
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between gap-3 relative overflow-hidden group shadow-sm",
                  isLocked 
                    ? "bg-card/40 border-border hover:border-brand/40 opacity-90" 
                    : "bg-brand/10 border-brand/40 shadow-[0_4px_20px_-5px_rgba(232,133,42,0.2)]"
                )}
              >
                {/* Top Badge & Time */}
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1",
                    isLocked ? "bg-white/5 text-muted-foreground border border-white/10" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}>
                    <Clock className="w-3 h-3" />
                    <span>{sec.timeLabel}</span>
                  </span>

                  {isLocked ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-bold">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Open</span>
                    </span>
                  )}
                </div>

                {/* Section Title & Icon */}
                <div>
                  <div className="text-2xl mb-1.5">{sec.icon}</div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-brand transition-colors line-clamp-1">
                    {sec.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                    {sec.subtitle}
                  </p>
                </div>

                {/* Bottom Prompt */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground font-mono">Island #{idx + 1}</span>
                  <span className="text-brand group-hover:underline flex items-center gap-1">
                    {isLocked ? 'View Vault 🔒' : 'Explore Now ✨'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Captain Luffy's Reminder Note */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍖</span>
            <span>
              <strong className="text-foreground">Luffy's Voice Active:</strong> Click any locked vault to hear Luffy's angry scolding (<em>a-luffy.mp3</em>) or click any unlocked vault to hear his joyful laugh (<em>luffy-smile.mp3</em>)!
            </span>
          </div>
          <div className="flex items-center gap-1 text-pink-500 font-semibold shrink-0">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Music continues playing uninterrupted!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
