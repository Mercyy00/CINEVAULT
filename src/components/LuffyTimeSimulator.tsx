import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, Clock, Zap, X, ChevronUp, ChevronDown, Volume2, RotateCcw } from 'lucide-react';
import { playLuffySound } from '../utils/luffyAudio';
import { cn } from '../lib/utils';

interface LuffyTimeSimulatorProps {
  simulatedHour: number | null;
  simulatedMinute: number | null;
  forceUnlockAll: boolean;
  onSetSimulation: (hour: number | null, minute: number | null, unlockAll: boolean) => void;
}

export function LuffyTimeSimulator({
  simulatedHour,
  simulatedMinute,
  forceUnlockAll,
  onSetSimulation
}: LuffyTimeSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Live Clock', hour: null, minute: null, unlockAll: false, desc: 'Real-time mode' },
    { label: '10:30 AM', hour: 10, minute: 30, unlockAll: false, desc: 'All 8 Locked (Test Angry Luffy)' },
    { label: '11:30 AM', hour: 11, minute: 30, unlockAll: false, desc: 'Love Tree Ready to Open' },
    { label: '12:30 PM', hour: 12, minute: 30, unlockAll: false, desc: 'Polaroids Ready to Open' },
    { label: '02:30 PM', hour: 14, minute: 30, unlockAll: false, desc: 'Voice Note Ready to Open' },
    { label: '03:30 PM', hour: 15, minute: 30, unlockAll: false, desc: 'Multiverse Reel Ready to Open' },
    { label: '07:30 PM', hour: 19, minute: 30, unlockAll: false, desc: 'Arcade Ready to Open' },
    { label: '08:30 PM', hour: 20, minute: 30, unlockAll: false, desc: 'Wheel Games Ready to Open' },
    { label: '09:30 PM', hour: 21, minute: 30, unlockAll: false, desc: 'Movie Theater Ready to Open' },
    { label: '10:30 PM', hour: 22, minute: 30, unlockAll: false, desc: 'All 8 Ready to Open (Finale)' },
    { label: '⚡ Unlock All', hour: null, minute: null, unlockAll: true, desc: 'Bypass All Locks Instantly' },
  ];

  const handleResetOpened = () => {
    window.dispatchEvent(new CustomEvent('cinevault-reset-opened'));
    onSetSimulation(simulatedHour, simulatedMinute, false);
  };

  const currentPresetLabel = forceUnlockAll
    ? '⚡ Unlock All'
    : simulatedHour === null
    ? '🔒 Live Clock'
    : presets.find(p => p.hour === simulatedHour && p.minute === simulatedMinute)?.label || `${simulatedHour}:${simulatedMinute}`;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[250] pointer-events-auto select-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="mb-3 p-4 sm:p-5 rounded-3xl bg-card/95 border border-brand/40 backdrop-blur-2xl shadow-2xl w-84 max-w-[92vw] text-foreground text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">
                  ⏱️
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs sm:text-sm">Luffy Time Machine</h4>
                  <p className="text-[10px] text-muted-foreground">Test click-to-open & Angry Luffy</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Sound Effects Tester Bar */}
            <div className="mb-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand mb-2">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Luffy Voice Effects:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => playLuffySound('angry')}
                  className="py-1.5 px-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Play a-luffy.mp3"
                >
                  <span>😡 Angry Shout</span>
                </button>
                <button
                  onClick={() => playLuffySound('smile')}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Play luffy-smile.mp3"
                >
                  <span>😊 Joyful Laugh</span>
                </button>
              </div>
            </div>

            {/* Re-lock Button */}
            <button
              onClick={handleResetOpened}
              className="w-full mb-3 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Opened Vaults (Test Clicking)</span>
            </button>

            {/* Quick Presets */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {presets.map((p, idx) => {
                const isActive = p.unlockAll
                  ? forceUnlockAll
                  : !forceUnlockAll && p.hour === simulatedHour && p.minute === simulatedMinute;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSetSimulation(p.hour, p.minute, p.unlockAll);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all text-left cursor-pointer",
                      isActive
                        ? "bg-brand text-background border-brand shadow-sm font-bold"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground"
                    )}
                  >
                    <div>
                      <div className="font-bold">{p.label}</div>
                      <div className={cn("text-[10px]", isActive ? "text-background/80" : "text-muted-foreground")}>
                        {p.desc}
                      </div>
                    </div>
                    {isActive ? (
                      <CheckCircleIcon className="w-4 h-4 shrink-0" />
                    ) : p.unlockAll ? (
                      <Zap className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/90 dark:bg-black/80 border border-brand/40 text-foreground backdrop-blur-xl shadow-xl hover:border-brand transition-all cursor-pointer text-xs font-bold ring-1 ring-brand/20"
        title="Open Time Machine to test unlock states"
      >
        <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
        <Sliders className="w-3.5 h-3.5 text-brand" />
        <span>Time Machine:</span>
        <span className="text-brand font-mono">{currentPresetLabel}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-70" /> : <ChevronUp className="w-3.5 h-3.5 opacity-70" />}
      </motion.button>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
