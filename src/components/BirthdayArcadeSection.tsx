import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Sparkles, Maximize2, Minimize2, RotateCcw, Camera, Trophy, Flame, Play, Palette, Volume2, VolumeX } from 'lucide-react';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';
import { cn } from '../lib/utils';

interface ArcadeGame {
  id: string;
  title: string;
  shortTitle: string;
  genre: string;
  icon: string;
  badge: string;
  src: string;
  instructions: string;
  challenge: string;
  accent: string;
  borderGlow: string;
  aspectClass: string;
}

const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "cat-pizza",
    title: "Cat Pizza",
    shortTitle: "Cat Pizza Cafe 🍕🐱",
    genre: "Cute Bakery & Kitty Cafe 🍕🐾",
    icon: "🐱",
    badge: "NEW GAME 🍕",
    src: "https://f221e1d1-dcbd-496f-b713-93fb45e4ce63.gdn.poki.com/b8b86622-c2e5-4361-97a5-664ffb9c309d/index.html?country=IN&ccpaApplies=0&url_referrer=https%3A%2F%2Fpoki.com%2F&tag=pg-eb5b9e6fb73a3a274e293fe2dc1a371dfabf02de&site_id=3&iso_lang=en&poki_url=https%3A%2F%2Fpoki.com%2Fen%2Fg%2Fcat-pizza&hoist=yes&nonPersonalized=n&cloudsavegames=n&familyFriendly=n&device=desktop&categories=4%2C64%2C91%2C145%2C277%2C388%2C839%2C1205&ab=4cc77a0cdd5c8c2b24b987c9c7f33b9b7a9acbd3&experiment=control-56273e57&special_condition=landing&game_id=f221e1d1-dcbd-496f-b713-93fb45e4ce63&game_version_id=b8b86622-c2e5-4361-97a5-664ffb9c309d&inspector=0&csp=1",
    instructions: "Bake tasty pizzas, serve hungry feline customers, and run the cutest cat pizzeria! 🍕🐱",
    challenge: "Can you deliver the perfect piping hot pizza order for all the kitties? 😻",
    accent: "from-orange-500 to-amber-500",
    borderGlow: "shadow-[0_0_25px_rgba(249,115,22,0.5)]",
    aspectClass: "w-full max-w-5xl mx-auto aspect-[16/10] sm:aspect-[16/9] min-h-[500px] max-h-[700px]"
  },
  {
    id: "decor-life",
    title: "Decor Life",
    shortTitle: "Decor Life 🏡✨",
    genre: "Cozy Room Renovation & Unpacking 🛋️📦",
    icon: "🏡",
    badge: "COZY MAKEOVER 🛋️",
    src: "https://917d3a3c-474e-4bac-8f03-e27312b48e67.gdn.poki.com/cb86bc8e-f62b-46f7-8ebf-3943b76ea68d/index.html?country=IN&ccpaApplies=0&url_referrer=https%3A%2F%2Fpoki.com%2F&tag=pg-eb5b9e6fb73a3a274e293fe2dc1a371dfabf02de&site_id=3&iso_lang=en&poki_url=https%3A%2F%2Fpoki.com%2Fen%2Fg%2Fdecor-life&hoist=yes&nonPersonalized=n&cloudsavegames=n&familyFriendly=n&device=desktop&categories=4%2C1014%2C1140%2C1141%2C1187%2C1190%2C20&ab=4cc77a0cdd5c8c2b24b987c9c7f33b9b7a9acbd3&experiment=control-56273e57&game_id=917d3a3c-474e-4bac-8f03-e27312b48e67&game_version_id=cb86bc8e-f62b-46f7-8ebf-3943b76ea68d&inspector=0&csp=1",
    instructions: "Unbox packages, place furniture & accessories, and renovate dreamy aesthetic rooms! 🛋️📦✨",
    challenge: "Can you unbox and design our dream aesthetic master bedroom and cozy nook? 💖",
    accent: "from-pink-500 to-rose-500",
    borderGlow: "shadow-[0_0_25px_rgba(236,72,153,0.5)]",
    aspectClass: "w-full max-w-5xl mx-auto aspect-[16/10] sm:aspect-[16/9] min-h-[500px] max-h-[720px]"
  },
  {
    id: "we-become-what-we-behold",
    title: "We Become What We Behold",
    shortTitle: "Camera Comedy Game 📸",
    genre: "Photography & Satirical Comedy 📸",
    icon: "📸",
    badge: "FAN FAVORITE 📸",
    src: "https://4041ad3f-ee25-483b-ae8b-51b16b86ac67.gdn.poki.com/c2e2e416-d187-42ef-a501-85ff9c905ad4/index.html?country=IN&ccpaApplies=0&url_referrer=https%3A%2F%2Fpoki.com%2F&tag=pg-eb5b9e6fb73a3a274e293fe2dc1a371dfabf02de&site_id=3&iso_lang=en&poki_url=https%3A%2F%2Fpoki.com%2Fen%2Fg%2Fwe-become-what-we-behold&hoist=yes&nonPersonalized=n&cloudsavegames=n&familyFriendly=n&device=desktop&categories=6%2C7%2C37%2C91%2C1139&ab=4cc77a0cdd5c8c2b24b987c9c7f33b9b7a9acbd3&experiment=control-56273e57&special_condition=landing&game_id=4041ad3f-ee25-483b-ae8b-51b16b86ac67&game_version_id=c2e2e416-d187-42ef-a501-85ff9c905ad4&inspector=0&csp=1",
    instructions: "Click & drag your camera viewfinder to snap photos of quirky characters in the square! 📸",
    challenge: "Can you snap all funny moments without bursting into giggles? 🤭",
    accent: "from-amber-500 to-rose-500",
    borderGlow: "shadow-[0_0_25px_rgba(245,158,11,0.5)]",
    aspectClass: "w-full max-w-5xl mx-auto aspect-[16/10] sm:aspect-[16/9] min-h-[500px] max-h-[700px]"
  }
];

export function BirthdayArcadeSection() {
  const { 
    isPlaying: isBgMusicPlaying, 
    pauseTrack: pauseBgMusic, 
    resumeTrack: resumeBgMusic 
  } = useBirthdayMusic();

  const [selectedGameId, setSelectedGameId] = useState<string>("cat-pizza");
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Default to MUTED to prevent unwanted sound & overlap with background music
  const [isMuted, setIsMuted] = useState(true);
  const wasBgMusicPlayingRef = useRef<boolean>(false);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const currentGame = ARCADE_GAMES.find(g => g.id === selectedGameId) || ARCADE_GAMES[0];

  // Send cross-origin audio control messages to HTML5 game engine inside iframe
  const sendMuteToIframe = (muted: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const messages = [
      // Standard HTML5 & Web Audio events
      { type: muted ? 'mute' : 'unmute', value: muted },
      { type: 'setMuted', muted: muted },
      { type: 'setVolume', value: muted ? 0 : 1, volume: muted ? 0 : 1 },
      { type: 'volume', volume: muted ? 0 : 1 },
      { action: muted ? 'mute' : 'unmute' },
      { name: muted ? 'mute' : 'unmute' },
      { method: muted ? 'mute' : 'unmute' },
      { event: muted ? 'mute' : 'unmute' },
      muted ? 'mute' : 'unmute',
      // CrazyGames SDK audio control
      { type: 'crazygames:mute', muted },
      { type: 'crazygames:volume', volume: muted ? 0 : 1 },
      { type: 'SDK_GAME_VOLUME', volume: muted ? 0 : 1 },
      { type: 'SDK_MUTE', muted },
      // Poki SDK audio control
      { type: 'pokiMute', muted },
      { type: 'poki:mute', muted },
      { type: 'pokiSetVolume', volume: muted ? 0 : 1 },
      // Unity WebGL & Howler & Construct 3
      { unity: 'setVolume', value: muted ? 0 : 1 },
      { howler: 'mute', muted },
      { c3: 'setMasterVolume', volume: muted ? 0 : 100 }
    ];

    messages.forEach(msg => {
      try {
        iframe.contentWindow?.postMessage(msg, '*');
      } catch {
        // Ignore cross-origin SOP restrictions
      }
    });

    // Direct DOM access if accessible
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.querySelectorAll('audio, video').forEach((media: any) => {
          media.muted = muted;
          if (muted) media.pause();
        });
      }
    } catch {
      // Cross-origin expected
    }
  };

  // Sync mute state to iframe whenever isMuted changes
  useEffect(() => {
    sendMuteToIframe(isMuted);
  }, [isMuted]);

  // Periodic mute pulse when game is active and muted
  useEffect(() => {
    if (!isGameActive || !isMuted) return;
    const interval = setInterval(() => {
      sendMuteToIframe(true);
    }, 800);
    return () => clearInterval(interval);
  }, [isGameActive, isMuted]);

  const handleToggleMute = () => {
    if (isMuted) {
      // Unmuting game audio: Pause background birthday music to avoid audio overlap
      if (isBgMusicPlaying) {
        wasBgMusicPlayingRef.current = true;
        pauseBgMusic();
      }
      setIsMuted(false);
      sendMuteToIframe(false);
    } else {
      // Muting game audio: Re-enable background music if it was paused by the game
      setIsMuted(true);
      sendMuteToIframe(true);
      if (wasBgMusicPlayingRef.current) {
        resumeBgMusic();
        wasBgMusicPlayingRef.current = false;
      }
    }
  };

  const handleSelectGame = (gameId: string) => {
    if (gameId === selectedGameId && isGameActive) return;
    setIsLoaded(false);
    setSelectedGameId(gameId);
    setIsGameActive(true);
    setReloadKey(prev => prev + 1);
  };

  const handleReload = () => {
    setIsLoaded(false);
    setReloadKey(prev => prev + 1);
  };

  const handleStopGame = () => {
    setIsGameActive(false);
    setIsLoaded(false);
    if (!isMuted) {
      setIsMuted(true);
      if (wasBgMusicPlayingRef.current) {
        resumeBgMusic();
        wasBgMusicPlayingRef.current = false;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    if (!isFullscreen) {
      if (gameContainerRef.current.requestFullscreen) {
        gameContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // When game iframe loads, send repeated mute pulses as game engine initializes
  const handleIframeLoad = () => {
    setIsLoaded(true);
    if (isMuted) {
      sendMuteToIframe(true);
      setTimeout(() => sendMuteToIframe(true), 250);
      setTimeout(() => sendMuteToIframe(true), 750);
      setTimeout(() => sendMuteToIframe(true), 1500);
      setTimeout(() => sendMuteToIframe(true), 3000);
    }
  };

  return (
    <div className="relative w-full max-w-[1350px] mx-auto py-16 px-2 sm:px-6 select-none">
      
      {/* Background Neon Arcade Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] rounded-full blur-[160px] opacity-20 pointer-events-none transition-all duration-700 -z-10"
        style={{ background: 'radial-gradient(circle, var(--theme-accent, #e8852a) 0%, #ec4899 50%, #8b5cf6 100%)' }}
      />

      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-bold mb-4 shadow-md backdrop-blur-md"
        >
          <Gamepad2 className="w-4 h-4 text-pink-500 animate-bounce" />
          <span>Divu's Mini-Game Arcade Corner 🕹️</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight leading-tight mb-3"
        >
          Take a Break & <span className="bg-gradient-to-r from-brand via-pink-500 to-purple-500 bg-clip-text text-transparent">Play!</span> 🎮✨
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed"
        >
          Play <strong className="text-foreground">"Cat Pizza"</strong>, renovate & design in <strong className="text-foreground">"Decor Life"</strong>, or snap laughs in <strong className="text-foreground">"Camera Comedy"</strong>!
        </motion.p>
      </div>

      {/* ARCADE GAME CARTRIDGE SELECTOR TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 max-w-5xl mx-auto mb-8">
        {ARCADE_GAMES.map((game, idx) => {
          const isSelected = game.id === selectedGameId;
          return (
            <motion.div
              key={game.id}
              onClick={() => handleSelectGame(game.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 border-2 flex items-center justify-between gap-4 overflow-hidden",
                isSelected
                  ? `glass bg-card/95 border-brand ring-2 ring-brand/40 ${game.borderGlow}`
                  : "glass bg-card/60 border-border/70 hover:border-brand/40 opacity-75 hover:opacity-100"
              )}
            >
              {/* Active Glow Accent Strip */}
              {isSelected && (
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${game.accent}`} />
              )}

              <div className="flex items-center gap-3.5">
                {/* Game Icon Badge */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform shadow-md",
                  isSelected ? "bg-brand/20 scale-110" : "bg-white/5"
                )}>
                  {game.icon}
                </div>

                {/* Game Information */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand/15 text-brand">
                      {game.badge}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      SLOT #{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-display font-black text-foreground leading-snug">
                    {game.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {game.genre}
                  </p>
                </div>
              </div>

              {/* Status / Active Indicator */}
              <div className="shrink-0 flex items-center">
                {isSelected ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-background font-bold text-xs shadow-md">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Loaded</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl glass border border-white/10 text-muted-foreground text-xs font-semibold">
                    Insert 🕹️
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ARCADE CONSOLE WINDOW */}
      <motion.div
        ref={gameContainerRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className={cn(
          "relative glass bg-card/90 border-2 border-border/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300",
          isFullscreen ? "fixed inset-0 z-[500] rounded-none border-none p-0 bg-black flex flex-col" : "p-3 sm:p-5"
        )}
      >
        {/* Arcade Cabinet Top Bezel */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-black/40 dark:bg-black/70 rounded-2xl mb-3 border border-white/10 backdrop-blur-md text-xs font-mono">
          
          {/* Status Traffic Lights */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="hidden md:inline-block font-bold text-brand ml-2 uppercase tracking-wider">
              🎮 ARCADE UNIT #0209
            </span>
          </div>

          {/* Center Game Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {ARCADE_GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectGame(g.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                  g.id === selectedGameId 
                    ? "bg-brand text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{g.icon}</span>
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{g.shortTitle}</span>
              </button>
            ))}
          </div>

          {/* Quick Arcade Controls */}
          <div className="flex items-center gap-2">
            {/* Game Sound Mute / Unmute Toggle */}
            <button
              onClick={handleToggleMute}
              className={cn(
                "p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono font-bold",
                isMuted
                  ? "glass border-white/10 text-muted-foreground hover:text-foreground hover:border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              )}
              title={isMuted ? "Unmute Game Sound (Pauses background music)" : "Mute Game Sound (Resumes background music)"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Sound ON</span>
                </>
              )}
            </button>

            {isGameActive && (
              <button
                onClick={handleStopGame}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl glass border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono"
                title="Stop / Exit Game"
              >
                <span>⏹️</span>
                <span className="hidden sm:inline">Stop Game</span>
              </button>
            )}

            <button
              onClick={handleReload}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl glass border border-white/10 hover:border-brand/40 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-brand/20 hover:bg-brand text-brand hover:text-background border border-brand/40 text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono font-bold"
              title={isFullscreen ? "Exit Fullscreen" : "Play Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
            </button>
          </div>

        </div>

        {/* Music Paused Notice when Game Sound is Active */}
        {!isMuted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[11px] font-mono text-emerald-400"
          >
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Game sound active • Birthday mixtape song paused to prevent audio overlap</span>
            </span>
            <button
              onClick={handleToggleMute}
              className="underline hover:text-emerald-300 font-bold ml-2 cursor-pointer"
            >
              Mute game
            </button>
          </motion.div>
        )}

        {/* Game Iframe Screen with Game-specific Aspect Ratio */}
        <div className={cn(
          "relative w-full rounded-2xl overflow-hidden bg-neutral-950 shadow-inner border border-white/5 flex items-center justify-center",
          isFullscreen ? "flex-1 rounded-none border-none h-full" : currentGame.aspectClass
        )}>
          {/* Attract Mode Screen when Game is not active */}
          {!isGameActive ? (
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 max-w-lg mx-auto z-20">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-brand/15 border-2 border-brand/40 flex items-center justify-center text-4xl sm:text-5xl mb-4 shadow-[0_0_35px_rgba(232,133,42,0.35)] animate-bounce">
                {currentGame.icon}
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand/15 text-brand mb-2">
                {currentGame.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
                {currentGame.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                {currentGame.instructions}
              </p>
              <button
                onClick={() => {
                  setIsGameActive(true);
                  setIsLoaded(false);
                }}
                className="px-8 py-4 bg-brand text-background font-display font-black rounded-2xl text-sm sm:text-base shadow-[0_0_25px_rgba(232,133,42,0.5)] hover:shadow-[0_0_35px_rgba(232,133,42,0.7)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Insert Token & Play Game (Muted)</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-3">
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span>100% Muted • Birthday playlist continues playing peacefully</span>
              </div>
            </div>
          ) : (
            <>
              {/* Loading Spinner */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-center p-6 z-20">
                  <div className="w-16 h-16 rounded-2xl bg-brand/15 border-2 border-brand/40 flex items-center justify-center mb-4 animate-bounce text-brand shadow-[0_0_25px_rgba(232,133,42,0.4)]">
                    <Gamepad2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <h4 className="text-base font-display font-black text-foreground mb-1">
                    Loading {currentGame.title}... 🕹️✨
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Booting up the game window (Muted)
                  </p>
                </div>
              )}

              {/* Sandboxed Interactive Iframe (No autoplay permission) */}
              <iframe
                ref={iframeRef}
                key={`${currentGame.id}-${reloadKey}`}
                src={currentGame.src}
                title={currentGame.title}
                className="w-full h-full border-0 relative z-10"
                style={{ width: '100%', height: '100%', minHeight: isFullscreen ? '100%' : '560px' }}
                allow="fullscreen; gamepad; focus-without-user-activation; accelerometer; gyroscope; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
                onLoad={handleIframeLoad}
              />
            </>
          )}
        </div>

        {/* Arcade Footer HUD & Instructions */}
        {!isFullscreen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/50 text-xs">
            
            {/* Dynamic Control Instructions */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border">
              <div className="w-8 h-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
                {selectedGameId === 'decor-life' ? <Palette className="w-4 h-4" /> : selectedGameId === 'cat-pizza' ? <Gamepad2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-bold text-foreground block">How to Play:</span>
                <span className="text-[11px] text-muted-foreground leading-snug">{currentGame.instructions}</span>
              </div>
            </div>

            {/* Jay's Birthday Challenge */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-pink-500/10 border border-pink-500/25">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-pink-500 block">Jay's Challenge:</span>
                <span className="text-[11px] text-foreground/80 leading-snug">{currentGame.challenge}</span>
              </div>
            </div>

            {/* Birthday Queen Perk */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-purple-400 block">Birthday Queen Perk:</span>
                <span className="text-[11px] text-foreground/80 leading-snug">Unlimited rooms, aesthetic items & arcade tokens unlocked! 👑</span>
              </div>
            </div>

          </div>
        )}

      </motion.div>
    </div>
  );
}
