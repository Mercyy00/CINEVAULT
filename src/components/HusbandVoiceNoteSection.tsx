import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Play, Pause, Heart, Sparkles, RotateCcw, MessageCircleHeart, ChevronDown } from 'lucide-react';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';
import { cn } from '../lib/utils';

export function HusbandVoiceNoteSection() {
  const { 
    isPlaying: isBgMusicPlaying, 
    pauseTrack: pauseBgMusic, 
    resumeTrack: resumeBgMusic 
  } = useBirthdayMusic();

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasBgMusicPlayingRef = useRef<boolean>(false);
  const simTimerRef = useRef<any>(null);

  // Audio file path: using the uploaded voice note file
  const VOICE_NOTE_SRC = "/music/vn.mp3";

  // Setup HTML Audio element for voice note
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = VOICE_NOTE_SRC;
    audioRef.current = audio;

    audio.onerror = () => {
      if (audio.src.endsWith('/music/vn.mp3')) {
        audio.src = '/vn.mp3';
      }
    };

    const onTimeUpdate = () => {
      setVoiceProgress(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setVoiceDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setVoiceDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlayingVoice(false);
      setVoiceProgress(0);
      // Resume background music from exact timestamp
      if (wasBgMusicPlayingRef.current) {
        resumeBgMusic();
        wasBgMusicPlayingRef.current = false;
      }
    };

    const onPlay = () => setIsPlayingVoice(true);
    const onPause = () => setIsPlayingVoice(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const stopVoiceSimulation = () => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  const startVoiceSimulation = (startFrom = 0) => {
    stopVoiceSimulation();
    setIsPlayingVoice(true);
    let curr = startFrom;
    const dur = 28; // 28 seconds demo
    setVoiceDuration(dur);
    setVoiceProgress(curr);

    simTimerRef.current = setInterval(() => {
      curr += 0.25;
      setVoiceProgress(curr);
      if (curr >= dur) {
        stopVoiceSimulation();
        setIsPlayingVoice(false);
        setVoiceProgress(0);
        if (wasBgMusicPlayingRef.current) {
          resumeBgMusic();
          wasBgMusicPlayingRef.current = false;
        }
      }
    }, 250);
  };

  const toggleVoicePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingVoice) {
      // User is pausing voice note
      audio.pause();
      stopVoiceSimulation();
      setIsPlayingVoice(false);

      // Resume background music
      if (wasBgMusicPlayingRef.current) {
        resumeBgMusic();
        wasBgMusicPlayingRef.current = false;
      }
    } else {
      // User is starting voice note
      if (isBgMusicPlaying) {
        wasBgMusicPlayingRef.current = true;
        pauseBgMusic();
      }

      audio.play().then(() => {
        setIsPlayingVoice(true);
      }).catch((err) => {
        console.warn("Real audio file not found, running demo simulation:", err);
        startVoiceSimulation(voiceProgress);
      });
    }
  };

  const handleReplay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isBgMusicPlaying) {
      wasBgMusicPlayingRef.current = true;
      pauseBgMusic();
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setVoiceProgress(0);
      audio.play().then(() => {
        setIsPlayingVoice(true);
      }).catch(() => {
        startVoiceSimulation(0);
      });
    } else {
      startVoiceSimulation(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setVoiceProgress(time);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = time;
    }
    if (simTimerRef.current && isPlayingVoice) {
      startVoiceSimulation(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-8">
      
      {/* Top Scroll Invitation Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-bold mb-3 shadow-md backdrop-blur-md">
          <MessageCircleHeart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
          <span>Scroll more for your husband's special message 💍💌</span>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto font-medium">
          Keep scrolling down... someone special is about to make an unexpected entrance! ✨
        </p>
        <div className="w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center mx-auto mt-3 shadow-sm">
          <ChevronDown className="w-4 h-4 text-brand animate-bounce" />
        </div>
      </motion.div>

      {/* Main Surprise Slide-In Stage */}
      <div className="relative glass border border-border rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden min-h-[460px] flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Ambient Glow Aura */}
        <div 
          className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700 -z-10"
          style={{ background: 'var(--theme-accent, #e8852a)' }}
        />

        {/* Left Side: Voice Note Player & Love Dedication */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-[55%] z-20 flex flex-col justify-between"
        >
          {/* Header Tag */}
          <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Voice Note From Jay 🎙️</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-500 font-mono font-bold ml-auto">
              EXCLUSIVE FOR DIVU 💖
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-display font-black text-foreground tracking-tight leading-tight mb-3">
            "Listen With Your Heart..." 💌
          </h3>

          <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed mb-6">
            A private spoken message recorded with love. Click Spider-Man or the play button to hear your husband's voice whispering straight to you.
          </p>

          {/* Voice Note Audio Player Card */}
          <div className="glass bg-card/85 border border-border rounded-2xl p-4 sm:p-5 shadow-card relative overflow-hidden">
            {/* Top Tape Effect Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3 text-xs font-bold">
              <div className="flex items-center gap-2 text-foreground">
                <Mic className={cn("w-4 h-4", isPlayingVoice ? "text-pink-500 animate-pulse" : "text-muted-foreground")} />
                <span>Jay's Voice Memo for Divu</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatTime(voiceProgress)} / {formatTime(voiceDuration || 28)}
              </span>
            </div>

            {/* Audio Waveform Animation Visualizer */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-10 mb-4 px-2">
              {[40, 65, 85, 30, 95, 70, 50, 80, 100, 45, 90, 60, 75, 35, 90, 55, 80, 40, 70, 95, 60, 45].map((heightPct, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    height: isPlayingVoice ? [`${Math.max(15, heightPct * 0.3)}%`, `${heightPct}%`, `${Math.max(20, heightPct * 0.5)}%`] : '20%',
                  }}
                  transition={{
                    duration: 0.6 + (idx % 4) * 0.15,
                    repeat: isPlayingVoice ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-1 sm:w-1.5 rounded-full transition-all duration-200",
                    isPlayingVoice 
                      ? "bg-gradient-to-t from-brand to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                      : "bg-white/20 dark:bg-white/10"
                  )}
                />
              ))}
            </div>

            {/* Progress Scrub Bar */}
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={voiceDuration || 28}
                step={0.1}
                value={voiceProgress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={(e) => toggleVoicePlay(e)}
                className="px-5 py-2.5 rounded-xl bg-brand text-background font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlayingVoice ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause Voice Note
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Play Voice Note 🎙️
                  </>
                )}
              </button>

              <button
                onClick={(e) => handleReplay(e)}
                className="px-3.5 py-2 rounded-xl glass border border-white/10 text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
                title="Replay from beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replay From Start
              </button>
            </div>

          </div>
        </motion.div>

        {/* Right Side: Spider-Man Sliding In Out of Nowhere! */}
        <motion.div
          initial={{ x: 280, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 18,
            delay: 0.2
          }}
          className="w-full lg:w-[45%] flex items-center justify-center relative cursor-pointer group select-none"
          onClick={(e) => toggleVoicePlay(e)}
        >
          {/* Floating "Click me, honey!" Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{
              opacity: 1,
              scale: [1, 1.05, 1],
              y: [0, -6, 0]
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-12 sm:-top-16 z-40"
          >
            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-brand via-pink-500 to-brand text-white font-display font-black text-xs sm:text-sm shadow-[0_10px_25px_rgba(236,72,153,0.4)] flex items-center gap-2 border-2 border-white/30 whitespace-nowrap">
              <Heart className="w-4 h-4 fill-white animate-ping" />
              <span>Click me, honey! 💖🎙️</span>
            </div>
            {/* Speech bubble pointer notch */}
            <div className="w-3 h-3 bg-pink-500 rotate-45 mx-auto -mt-1.5 shadow-sm" />
          </motion.div>

          {/* Spider-Man Character Image */}
          <div className="relative">
            {/* Reactive Glow Aura around Spidey */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full blur-2xl transition-all duration-500 pointer-events-none -z-10",
                isPlayingVoice ? "opacity-75 scale-125 bg-pink-500" : "opacity-25 scale-95 bg-brand"
              )}
            />

            <motion.img
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              src="/images/spiderman-ok.png"
              alt="Spider-Man Saying OK"
              className="w-64 sm:w-80 md:w-92 max-h-[380px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-300"
            />

            {/* Pulsing Audio Waveform Ring when Voice is Playing */}
            <AnimatePresence>
              {isPlayingVoice && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.1, 0.95] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-pink-500/60 pointer-events-none shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                />
              )}
            </AnimatePresence>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
