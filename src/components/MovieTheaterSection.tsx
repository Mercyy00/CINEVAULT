import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Heart, 
  Sparkles, 
  Ticket, 
  Popcorn, 
  ChevronRight, 
  Clapperboard, 
  Moon, 
  SunMedium, 
  CheckCircle, 
  Clock
  
  
} from 'lucide-react';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';
import { cn } from '../lib/utils';

export interface MovieItem {
  id: string;
  actNumber: string;
  title: string;
  tagline: string;
  studio: string;
  duration: string;
  badge: string;
  badgeColor: string;
  videoSrc: string;
  themeColor: string;
  movieQuote: string;
  romanticMessage: {
    greeting: string;
    body: string[];
    closing: string;
    highlight: string;
  };
  afterMovieMessage: {
    title: string;
    reflection: string;
    nextPrompt: string;
  };
}

export const MOVIE_LIST: MovieItem[] = [
  {
    id: 'kitbull',
    actNumber: 'ACT I',
    title: 'Kitbull',
    tagline: 'An Unlikely Bond & Safe Shelter',
    studio: 'Pixar SparkShorts',
    duration: '8 mins',
    badge: "Divu's Soft Heart Pick 🐾",
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    videoSrc: '/movies/kitbull.mp4',
    themeColor: '#10b981',
    movieQuote: '“Home isn’t just a place — it’s the person whose arms make you feel safe from the whole world.”',
    romanticMessage: {
      greeting: 'To my precious Divu & little kitten,',
      body: [
        'Just like the fierce, guarded little kitten who slowly discovered that the gentle giant dog only had love, warmth, and unconditional protection to offer...',
        'You walked into my life and gave my heart a safe haven. Whenever the world gets overwhelming, being with you reminds me of the pure, unspoken trust between Kit and Bull.',
        'We built a bond so rare, tender, and unbreakable. Thank you for being my sweetest companion in every storm.'
      ],
      closing: 'Dedicated to the safest bond in my universe:',
      highlight: '“Kitbull” — For You, My Dearest Divu 🐱🐶💖'
    },
    afterMovieMessage: {
      title: 'Act I Completed: The Power of Gentle Love',
      reflection: 'Seeing them run out into the sunshine together always reminds me of us. No matter what, right now we have each other, safe and smiling.',
      nextPrompt: 'Ready to see how love turns everyday moments into the sweetest treat?'
    }
  },
  {
    id: 'feast',
    actNumber: 'ACT II',
    title: 'Feast',
    tagline: 'A Lifetime of Shared Bites & Sweet Memories',
    studio: 'Disney Short Films',
    duration: '6 mins',
    badge: "Goluuu's Foodie Love Story 🍝",
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    videoSrc: '/movies/feast.mp4',
    themeColor: '#f59e0b',
    movieQuote: '“Love is measured in every shared bite, every stolen fry, and every warm plate enjoyed together.”',
    romanticMessage: {
      greeting: 'To my little Besan Ka Ladduuu & favorite food partner,',
      body: [
        'They say real love thrives in the coziest everyday moments. Just like Winston the puppy whose whole world was built around meals shared across the table...',
        'My favorite memories with you are seasoned with late-night cravings, funny food debates, and you asking for just "one more bite" of dessert.',
        'Through all of life’s flavors, my favorite seat in the whole world will always be sitting right across from you.'
      ],
      closing: 'Specially curated for my favorite foodie:',
      highlight: '“Feast” — A Delicious Love Story for My Goluuu 🐶🍟✨'
    },
    afterMovieMessage: {
      title: 'Act II Completed: Sweetness in Every Bite',
      reflection: 'Winston taught us that when the person you love is happy, every meal is a celebration. You truly make my life the most delightful feast.',
      nextPrompt: 'Now, it\'s time for destiny to fold its most magical paper airplane...'
    }
  },
  {
    id: 'paperman',
    actNumber: 'ACT III',
    title: 'Paperman',
    tagline: 'Destiny, Paper Airplanes & Soulmates',
    studio: 'Walt Disney Animation Studios',
    duration: '7 mins',
    badge: 'The Grand Romantic Finale 💌',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    videoSrc: '/movies/paperman.mp4',
    themeColor: '#f43f5e',
    movieQuote: '“Out of millions of strangers in this city, fate will guide paper airplanes through the wind just to bring two hearts together.”',
    romanticMessage: {
      greeting: 'To my once-in-a-lifetime soulmate, Divu,',
      body: [
        'Out of billions of people in this universe, fate folded a little paper airplane and sent it flying straight into my life. That one moment changed my whole reality forever.',
        'No distance, no noise of the world, and no hurdle could ever stop what the universe planned for us. You are my forever Valentine and my greatest destiny.',
        'With all my heart, soul, and endless devotion, here is our grand cinematic climax for your 21st birthday.'
      ],
      closing: 'With all my love forever and always:',
      highlight: '“Paperman” — For You, My One & Only Love ✈️💌💋'
    },
    afterMovieMessage: {
      title: 'Grand Finale Completed: Destined For Eternity',
      reflection: 'The red lipstick mark on that paper airplane guided them back into each other’s arms. Divu, you are my red mark of destiny. Happy 21st Birthday, my forever love.',
      nextPrompt: 'All 3 movies screened! Certified Soulmates Forever 🏆💖'
    }
  }
];

export function MovieTheaterSection() {
  const { isPlaying: isBgMusicPlaying, pauseTrack: pauseBgMusic, resumeTrack: resumeBgMusic } = useBirthdayMusic();

  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [hasStartedMovie, setHasStartedMovie] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theaterDimMode, setTheaterDimMode] = useState(false);
  const [movieCompletedMap, setMovieCompletedMap] = useState<Record<string, boolean>>({});
  const [showIntermissionModal, setShowIntermissionModal] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [snackHearts, setSnackHearts] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cinemaContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const wasBgMusicPlayingBeforeMovie = useRef(false);

  const activeMovie = MOVIE_LIST[currentMovieIndex];

  // Auto hide controls when watching
  const handleMouseMove = () => {
    setShowControlsOverlay(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isVideoPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3500);
    }
  };

  // Pause bg music when video plays
  const handleVideoPlay = () => {
    if (isBgMusicPlaying) {
      wasBgMusicPlayingBeforeMovie.current = true;
      pauseBgMusic();
    }
    setIsVideoPlaying(true);
  };

  /* The flag was set when the movie started but never acted on, so the
   * background playlist stayed silent for the rest of the visit once a movie
   * had been played. */
  const restoreBackgroundMusic = () => {
    if (!wasBgMusicPlayingBeforeMovie.current) return;
    wasBgMusicPlayingBeforeMovie.current = false;
    resumeBgMusic();
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    setShowControlsOverlay(true);
    restoreBackgroundMusic();
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setMovieCompletedMap(prev => ({ ...prev, [activeMovie.id]: true }));
    setShowIntermissionModal(true);
    setShowControlsOverlay(true);
    restoreBackgroundMusic();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(err => console.log('Video play interrupted:', err));
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoProgress(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!cinemaContainerRef.current) return;
    if (!document.fullscreenElement) {
      cinemaContainerRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.log('Exit fullscreen error:', err));
    }
  };

  // Switch to a movie index
  const selectMovie = (index: number) => {
    if (index === currentMovieIndex) return;
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentMovieIndex(index);
    setHasStartedMovie(false);
    setShowIntermissionModal(false);
    setCurtainsOpen(false);
    setIsVideoPlaying(false);
    setVideoProgress(0);
  };

  // Start movie from love letter
  const handleStartMovie = () => {
    setCurtainsOpen(true);
    setHasStartedMovie(true);
    setTheaterDimMode(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => console.log('Play err:', err));
      }
    }, 1100);
  };

  // Proceed to next movie from intermission
  const handleNextMovie = () => {
    setShowIntermissionModal(false);
    if (currentMovieIndex < MOVIE_LIST.length - 1) {
      selectMovie(currentMovieIndex + 1);
    } else {
      selectMovie(0);
    }
  };

  // Interactive snack animation
  const triggerSnackEffect = (emoji: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newId = Date.now() + Math.random();
    const newEffect = {
      id: newId,
      x: rect.left + rect.width / 2,
      y: rect.top,
      emoji
    };
    setSnackHearts(prev => [...prev.slice(-15), newEffect]);
    setTimeout(() => {
      setSnackHearts(prev => prev.filter(item => item.id !== newId));
    }, 1200);
  };

  // Format time in mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* FULL-SCREEN BACKDROP OVERLAY WHEN THEATER DIM MODE IS ACTIVE */}
      <AnimatePresence>
        {theaterDimMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onClick={() => setTheaterDimMode(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-30 pointer-events-auto cursor-pointer"
            title="Click outside to exit theater dim mode"
          />
        )}
      </AnimatePresence>

      {/* Main Cinema Theater Card (Elevated to z-40 so it stays crystal clear when dimmed) */}
      <div 
        className={cn(
          "relative w-full rounded-3xl transition-all duration-700 overflow-hidden z-40",
          theaterDimMode 
            ? "bg-[#07080e] shadow-[0_0_140px_rgba(0,0,0,0.98),0_0_80px_rgba(232,133,42,0.15)] ring-1 ring-white/15" 
            : "bg-gradient-to-b from-card/85 via-card/50 to-card/90 backdrop-blur-2xl border border-white/10 shadow-2xl"
        )}
      >
        {/* Floating Snack Hearts Layer */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {snackHearts.map(snack => (
            <motion.div
              key={snack.id}
              initial={{ opacity: 1, y: snack.y, x: snack.x, scale: 0.8, rotate: 0 }}
              animate={{ 
                opacity: 0, 
                y: snack.y - 140, 
                x: snack.x + (Math.random() * 60 - 30), 
                scale: 1.6,
                rotate: Math.random() * 40 - 20 
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="fixed text-2xl font-bold drop-shadow-md select-none"
            >
              {snack.emoji}
            </motion.div>
          ))}
        </div>

        {/* Retro Marquee Neon Header */}
        <div className="relative pt-8 pb-5 px-4 sm:px-8 text-center border-b border-white/10 overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Bulb Lights */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 select-none opacity-90">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.35, 1, 0.35],
                  scale: [0.85, 1.15, 0.85]
                }}
                transition={{ 
                  duration: 1.6, 
                  repeat: Infinity, 
                  delay: i * 0.12,
                  ease: "easeInOut" 
                }}
                className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm",
                  i % 3 === 0 ? "bg-amber-400 shadow-amber-400/80" : i % 3 === 1 ? "bg-pink-400 shadow-pink-400/80" : "bg-rose-400 shadow-rose-400/80"
                )}
              />
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-2.5 backdrop-blur-md">
            <Clapperboard className="w-4 h-4 text-brand animate-pulse" />
            <span>Divu & Jay’s Private Starlight Cinema</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-foreground tracking-tight drop-shadow-md">
            The Starlight <span className="bg-gradient-to-r from-brand via-pink-400 to-amber-300 bg-clip-text text-transparent">Love Cinema</span> 🍿✨
          </h2>
          
          <p className="mt-2 text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-medium">
            3 special short stories celebrating the sweetest bond, shared cravings, and undeniable destiny.
          </p>

          {/* VIP Pass */}
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-2xl bg-black/40 border border-amber-400/30 text-amber-200 text-xs sm:text-sm backdrop-blur-md">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span className="font-bold uppercase text-amber-300">VIP Pass</span>
            <span className="text-amber-400/50">•</span>
            <span>Divyanshi & Jay</span>
            <span className="text-amber-400/50">•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> All-Access
            </span>
          </div>
        </div>

        {/* 3-Act Navigation Strip */}
        <div className="px-4 sm:px-8 py-3.5 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Film className="w-4 h-4 text-brand" />
            <span>SELECT MOVIE:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {MOVIE_LIST.map((movie, idx) => {
              const isCurrent = idx === currentMovieIndex;
              const isCompleted = movieCompletedMap[movie.id];

              return (
                <button
                  key={movie.id}
                  onClick={() => selectMovie(idx)}
                  className={cn(
                    "group relative px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer border",
                    isCurrent 
                      ? "bg-brand/25 border-brand text-brand shadow-[0_0_16px_rgba(232,133,42,0.35)] scale-105" 
                      : isCompleted
                        ? "bg-white/5 border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                        : "bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <span className="font-mono text-[10px] sm:text-xs opacity-70">{movie.actNumber}:</span>
                  <span className="font-bold">{movie.title}</span>
                  {isCompleted && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dim Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheaterDimMode(!theaterDimMode)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer",
                theaterDimMode 
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
              )}
              title="Dim surrounding background for cinema immersion"
            >
              {theaterDimMode ? <SunMedium className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theaterDimMode ? "Dim Lights: ON" : "Dim Lights"}</span>
            </button>
          </div>
        </div>

        {/* Cinema Stage Wrapper */}
        <div 
          ref={cinemaContainerRef}
          onMouseMove={handleMouseMove}
          className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[680px] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden bg-black/70"
        >
          {/* Dynamic Ambilight Halo (Matching Active Movie Color) */}
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-1000 blur-3xl opacity-35"
            style={{
              background: `radial-gradient(circle at center, ${activeMovie.themeColor} 0%, transparent 75%)`
            }}
          />

          {/* Cinema Screen Frame (Much wider max-w-6xl) */}
          <div className="relative w-full max-w-6xl mx-auto rounded-3xl border-4 border-black/90 bg-black shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
            
            {/* Screen Aspect Box */}
            <div className="relative w-full min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[620px] aspect-video bg-black flex items-center justify-center overflow-hidden">
              
              {/* The Actual Video Player (Only rendered when started, or ready in background) */}
              <video
                ref={videoRef}
                src={activeMovie.videoSrc}
                playsInline
                preload="metadata"
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setVideoProgress(videoRef.current.currentTime);
                    if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                      setVideoDuration(videoRef.current.duration);
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                    setVideoDuration(videoRef.current.duration);
                  }
                }}
                onClick={togglePlay}
                className={cn(
                  "w-full h-full object-contain cursor-pointer transition-opacity duration-700",
                  hasStartedMovie ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              />

              {/* THEATRICAL VELVET CURTAINS LAYER */}
              {/* Left Curtain */}
              <motion.div
                initial={false}
                animate={{ 
                  x: curtainsOpen ? '-100%' : '0%'
                }}
                transition={{ 
                  duration: 1.4, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="absolute inset-y-0 left-0 w-1/2 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, #450a0a 0%, #7f1d1d 30%, #991b1b 50%, #7f1d1d 75%, #450a0a 100%)',
                  boxShadow: 'inset -15px 0 35px rgba(0,0,0,0.85), 10px 0 25px rgba(0,0,0,0.7)'
                }}
              >
                <div 
                  className="w-full h-full opacity-60"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.4) 20px, rgba(0,0,0,0.4) 40px)'
                  }}
                />
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              </motion.div>

              {/* Right Curtain */}
              <motion.div
                initial={false}
                animate={{ 
                  x: curtainsOpen ? '100%' : '0%'
                }}
                transition={{ 
                  duration: 1.4, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="absolute inset-y-0 right-0 w-1/2 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, #450a0a 0%, #7f1d1d 30%, #991b1b 50%, #7f1d1d 75%, #450a0a 100%)',
                  boxShadow: 'inset 15px 0 35px rgba(0,0,0,0.85), -10px 0 25px rgba(0,0,0,0.7)'
                }}
              >
                <div 
                  className="w-full h-full opacity-60"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.4) 20px, rgba(0,0,0,0.4) 40px)'
                  }}
                />
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              </motion.div>

              {/* Top Velvet Pelmet */}
              <div 
                className="absolute top-0 inset-x-0 h-9 sm:h-12 z-25 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 70%, #991b1b 100%)',
                  borderBottom: '2.5px solid #f59e0b',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.8)'
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="px-3.5 py-0.5 rounded-full bg-black/60 border border-amber-400/50 text-[10px] sm:text-xs text-amber-300 font-mono tracking-widest uppercase">
                    ⭐ Private Screening ⭐
                  </div>
                </div>
              </div>

              {/* PRE-MOVIE ROMANTIC LOVE CARD (Clear, Uncramped, Beautifully Centered) */}
              <AnimatePresence>
                {!hasStartedMovie && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.4 } }}
                    className="absolute inset-0 z-30 p-4 sm:p-8 md:p-12 flex items-center justify-center bg-black/75 backdrop-blur-sm overflow-y-auto"
                  >
                    <div className="relative max-w-3xl w-full p-6 sm:p-8 md:p-10 rounded-3xl bg-gradient-to-b from-[#18181b]/95 via-[#0c0d12]/95 to-[#18181b]/95 border border-amber-400/30 text-white shadow-2xl text-left my-auto">
                      
                      {/* Top Header Stamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("px-3 py-1 rounded-full text-xs font-bold border shadow-sm", activeMovie.badgeColor)}>
                            {activeMovie.actNumber} • {activeMovie.title}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" /> {activeMovie.duration}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-amber-400 tracking-wider font-semibold">
                          PRE-MOVIE LETTER 💌
                        </span>
                      </div>

                      {/* Movie Quote Box */}
                      <div className="mb-5 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-amber-200/90 italic flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>{activeMovie.movieQuote}</div>
                      </div>

                      {/* Heartfelt Letter Body */}
                      <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed font-sans">
                        <p className="font-semibold text-brand text-sm sm:text-base">
                          {activeMovie.romanticMessage.greeting}
                        </p>
                        
                        {activeMovie.romanticMessage.body.map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            {paragraph}
                          </p>
                        ))}

                        <p className="text-xs sm:text-sm text-muted-foreground pt-1">
                          {activeMovie.romanticMessage.closing}
                        </p>
                        
                        <p className="font-bold text-sm sm:text-base md:text-lg text-amber-300">
                          {activeMovie.romanticMessage.highlight}
                        </p>
                      </div>

                      {/* Start Movie CTA Button */}
                      <div className="mt-6 sm:mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                          <span>Curtains will open and lights will dim</span>
                        </div>

                        <button
                          onClick={handleStartMovie}
                          className="group px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-brand via-pink-500 to-amber-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                          <span>Open Curtains & Play Movie</span>
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* POST-MOVIE INTERMISSION MODAL */}
              <AnimatePresence>
                {showIntermissionModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-35 p-4 sm:p-8 flex items-center justify-center bg-black/90 backdrop-blur-lg overflow-y-auto"
                  >
                    <div className="relative max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#18181b] via-[#111113] to-[#18181b] border-2 border-brand/40 text-center shadow-2xl">
                      
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center mb-4 text-3xl sm:text-4xl shadow-inner">
                        {currentMovieIndex === 2 ? '🏆' : currentMovieIndex === 1 ? '💌' : '🐾'}
                      </div>

                      <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground mb-2">
                        {activeMovie.afterMovieMessage.title}
                      </h3>

                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                        {activeMovie.afterMovieMessage.reflection}
                      </p>

                      <div className="p-3.5 rounded-2xl bg-brand/10 border border-brand/20 text-brand text-xs sm:text-sm font-semibold mb-6">
                        ✨ {activeMovie.afterMovieMessage.nextPrompt}
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setShowIntermissionModal(false);
                            if (videoRef.current) {
                              videoRef.current.currentTime = 0;
                              videoRef.current.play().catch(() => {});
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-medium text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Replay {activeMovie.title}</span>
                        </button>

                        <button
                          onClick={handleNextMovie}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand to-pink-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>{currentMovieIndex === 2 ? "Start Trilogy from Beginning" : "Next Movie Screening"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* CUSTOM CINEMA PLAYER CONTROLS (ONLY RENDERED ONCE MOVIE HAS STARTED!) */}
            {hasStartedMovie && (
              <AnimatePresence>
                {showControlsOverlay && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.25 }}
                    className="p-3 sm:p-4 bg-gradient-to-t from-black via-zinc-950 to-zinc-900 border-t border-white/10 text-white select-none"
                  >
                    {/* Scrubber Bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                        {formatTime(videoProgress)}
                      </span>
                      
                      <div className="relative flex-1 group">
                        <input
                          type="range"
                          min={0}
                          max={videoDuration || 100}
                          step={0.1}
                          value={videoProgress}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand transition-all hover:h-2"
                        />
                      </div>

                      <span className="text-[11px] font-mono text-muted-foreground w-10">
                        {formatTime(videoDuration)}
                      </span>
                    </div>

                    {/* Bottom Controls Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      
                      {/* Play / Restart / Volume */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlay}
                          className="w-9 h-9 rounded-xl bg-brand hover:bg-brand/90 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                          title={isVideoPlaying ? "Pause" : "Play"}
                        >
                          {isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = 0;
                            }
                          }}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Restart Movie"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-2 pl-2">
                          <button
                            onClick={toggleMute}
                            className="text-muted-foreground hover:text-white transition-colors cursor-pointer"
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand"
                          />
                        </div>
                      </div>

                      {/* Current Title */}
                      <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-foreground/90">
                        <span className="font-mono text-brand font-bold">{activeMovie.actNumber}:</span>
                        <span className="text-white">{activeMovie.title}</span>
                      </div>

                      {/* Right Side Options */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setHasStartedMovie(false);
                            setCurtainsOpen(false);
                            if (videoRef.current) videoRef.current.pause();
                          }}
                          className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-amber-300 border border-amber-400/20 hover:border-amber-400/40 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Heart className="w-3 h-3 fill-amber-300" />
                          <span>Letter</span>
                        </button>

                        <button
                          onClick={toggleFullscreen}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Fullscreen"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            )}

          </div>

        </div>

        {/* Interactive Snack Concession Bar */}
        <div className="px-4 sm:px-8 py-5 bg-gradient-to-r from-card/90 via-card/50 to-card/90 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
          
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-brand uppercase tracking-wider mb-0.5">
              <Popcorn className="w-4 h-4" />
              <span>Cinema Concession & Snacks</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tap any snack to pop romantic celebration hearts! 💖
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: "Caramel Popcorn", icon: "🍿", emoji: "🍿💖" },
              { name: "Choco Nachos", icon: "🧀", emoji: "🧀✨" },
              { name: "Hot Cocoa", icon: "☕", emoji: "☕💫" },
              { name: "Cupcake", icon: "🧁", emoji: "🧁🌸" },
              { name: "Cotton Candy", icon: "🍭", emoji: "🍭🎉" }
            ].map((snack, sIdx) => (
              <button
                key={sIdx}
                onClick={(e) => triggerSnackEffect(snack.emoji, e)}
                className="px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-brand/15 border border-white/10 hover:border-brand/30 text-xs font-semibold text-foreground/90 hover:text-brand transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="text-sm">{snack.icon}</span>
                <span>{snack.name}</span>
              </button>
            ))}
          </div>

          <div className="text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Date Night Mode: 100% Cozy</span>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
