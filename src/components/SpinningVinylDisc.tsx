import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music2, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  ListMusic, 
  X, 
  Heart,
  Disc
} from 'lucide-react';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';
import { cn } from '../lib/utils';

export function SpinningVinylDisc() {
  const { 
    playlist, 
    currentTrackIndex, 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    playTrack, 
    nextTrack, 
    prevTrack 
  } = useBirthdayMusic();

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  return (
    <>
      {/* 1. CORNER ROTATING VINYL DISC (Cleanly Placed in Bottom Left Corner) */}
      <div className="fixed -bottom-24 -left-24 sm:-bottom-32 sm:-left-32 md:-bottom-40 md:-left-40 z-30 pointer-events-auto select-none">
        
        {/* Reactive Glow */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none -z-10",
            isPlaying ? "opacity-60 scale-125 animate-pulse" : "opacity-20 scale-95"
          )}
          style={{
            background: `radial-gradient(circle, var(--theme-accent, #e8852a) 0%, rgba(236, 72, 153, 0.45) 50%, transparent 75%)`
          }}
        />

        {/* Floating Notes Particle Emitter when playing */}
        <AnimatePresence>
          {isPlaying && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], y: -90, x: 50, scale: [0.5, 1.2, 0.8] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
                className="absolute top-10 right-14 text-brand pointer-events-none z-50"
              >
                <Music2 className="w-5 h-5 drop-shadow-md" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], y: -110, x: 80, scale: [0.5, 1.3, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1 }}
                className="absolute top-14 right-18 text-pink-500 pointer-events-none z-50"
              >
                <Sparkles className="w-4 h-4 drop-shadow-md" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Vinyl Disc Body */}
        <motion.div
          onClick={handleToggle}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-88 md:h-88 rounded-full cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-black/90 ring-2 ring-brand/40 overflow-hidden"
          title={isPlaying ? "Click to Pause Music" : "Click to Play Music"}
        >
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{
              duration: 7,
              repeat: isPlaying ? Infinity : 0,
              ease: "linear"
            }}
            className="w-full h-full relative rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at center,
                  #141414 0%,
                  #0a0a0a 35%,
                  #1c1c1c 37%,
                  #0f0f0f 45%,
                  #1a1a1a 50%,
                  #080808 65%,
                  #1a1a1a 75%,
                  #050505 100%
                )
              `
            }}
          >
            {/* Grooves */}
            <div 
              className="absolute inset-0 rounded-full opacity-60 pointer-events-none"
              style={{
                backgroundImage: `repeating-radial-gradient(circle at center, transparent 0, transparent 2px, rgba(255,255,255,0.06) 3px, transparent 4px)`
              }}
            />

            {/* Light Reflection */}
            <div 
              className="absolute inset-0 rounded-full opacity-30 pointer-events-none mix-blend-screen"
              style={{
                background: `conic-gradient(
                  from 35deg at 50% 50%,
                  rgba(255,255,255,0.3) 0deg,
                  transparent 45deg,
                  rgba(255,255,255,0.15) 90deg,
                  transparent 135deg,
                  rgba(255,255,255,0.3) 180deg,
                  transparent 225deg,
                  rgba(255,255,255,0.15) 270deg,
                  transparent 315deg,
                  rgba(255,255,255,0.3) 360deg
                )`
              }}
            />

            {/* Center Label */}
            <div 
              className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-black shadow-inner flex flex-col items-center justify-center text-center p-2 text-white overflow-hidden"
              style={{
                background: `radial-gradient(circle at 35% 35%, var(--theme-accent, #e8852a) 0%, #d946ef 55%, #7c3aed 100%)`
              }}
            >
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[7px] sm:text-[8px] font-mono tracking-widest uppercase opacity-90 font-bold">
                  DIVU 21ST
                </span>
                <p className="text-[8px] sm:text-[10px] font-display font-black leading-tight max-w-[85%] truncate drop-shadow-sm">
                  {currentTrack.title}
                </p>
                <span className="text-[6px] sm:text-[7px] opacity-80 max-w-[80%] truncate">
                  {currentTrack.artist}
                </span>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-background border-2 border-white/60 shadow-inner z-20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-foreground/80" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 2. DEDICATED SLEEK FLOATING MUSIC DOCK (Positioned clearly at Bottom Left, Never Overlapping) */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 pointer-events-auto select-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/80 border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl text-white text-xs font-semibold"
        >
          {/* Mini Spinning Disc Icon */}
          <button
            onClick={handleToggle}
            className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Current Song Title & Artist */}
          <div 
            onClick={() => setShowPlaylistModal(true)}
            className="flex flex-col cursor-pointer max-w-[120px] sm:max-w-[170px] min-w-0 pr-1 text-left group"
            title="Click to view full playlist"
          >
            <span className="font-bold text-white text-xs truncate group-hover:text-brand transition-colors">
              {currentTrack.title}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {currentTrack.artist}
            </span>
          </div>

          {/* Quick Prev / Next Controls */}
          <div className="flex items-center gap-0.5 pl-1.5 border-l border-white/15">
            <button
              onClick={prevTrack}
              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextTrack}
              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Full Playlist Drawer Button */}
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-brand text-gray-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shrink-0 shadow-sm"
            title="Open 13-Song Playlist"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Songs ({playlist.length})</span>
          </button>
        </motion.div>
      </div>

      {/* 3. FULL VINYL PLAYLIST MODAL (13 HANDPICKED SONGS) */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPlaylistModal(false)}
            className="fixed inset-0 z-50 p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full p-6 rounded-3xl bg-gradient-to-b from-card via-[#111] to-card border border-white/15 shadow-2xl text-foreground max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                    <Disc className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-white">Divu's Vinyl Playlist</h3>
                    <p className="text-xs text-muted-foreground">{playlist.length} Handpicked Romantic Melodies</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Playlist Tracks List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 custom-scrollbar">
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(idx)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group",
                        isCurrent
                          ? "bg-brand/20 border-brand text-brand shadow-sm"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-foreground/90 hover:border-white/15"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0",
                          isCurrent ? "bg-brand text-white shadow-sm" : "bg-white/10 text-muted-foreground group-hover:text-white"
                        )}>
                          {isCurrent && isPlaying ? (
                            <span className="flex gap-0.5 items-end h-3">
                              <span className="w-0.5 h-3 bg-white animate-pulse" />
                              <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                              <span className="w-0.5 h-3.5 bg-white animate-pulse delay-150" />
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate group-hover:text-brand transition-colors">
                            {track.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {track.artist} • <span className="text-[11px] opacity-75">{track.tag}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-mono hidden sm:inline">
                          {track.mood}
                        </span>
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          isCurrent ? "bg-brand text-white" : "opacity-0 group-hover:opacity-100 bg-white/10 text-foreground"
                        )}>
                          {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer Note */}
              <div className="pt-3 border-t border-white/10 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                <span>Plays continuously & syncs with the spinning vinyl disc!</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
