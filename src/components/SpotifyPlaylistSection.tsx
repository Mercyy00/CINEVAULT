import { motion } from 'motion/react';
import { Disc, Sparkles, Heart, Radio, Headphones, Volume2 } from 'lucide-react';

export function SpotifyPlaylistSection() {
  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-card/90 via-card/60 to-card/95 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10 text-center sm:text-left">
        
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Divu's Spotify Frequency • Handpicked Melodies</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-tight">
            Soundtrack of <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-brand bg-clip-text text-transparent">Our Love</span> 🎧💖
          </h3>
          
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Every song in this playlist holds a piece of our late-night talks, car rides, and shared memories.
          </p>
        </div>

        {/* Vinyl / Headphones Visual Badge */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-md shadow-inner shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 via-brand to-pink-500 p-0.5 shadow-md flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Disc className="w-5 h-5 text-emerald-400" />
            </div>
          </motion.div>
          <div className="text-left">
            <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Live Spotify Player
            </div>
            <div className="text-xs font-bold text-foreground">Curated for Divyanshi</div>
          </div>
        </div>

      </div>

      {/* Spotify Embed Iframe Container with Polished Frame */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black/80 border border-emerald-500/20">
        <iframe
          data-testid="embed-iframe"
          style={{ borderRadius: '16px' }}
          src="https://open.spotify.com/embed/playlist/4iXzvT45MPdt4nu8mgY8CL?utm_source=generator&si=4dadf1d01b594eb5"
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Divu & Jay Love Playlist"
          className="w-full"
        />
      </div>

      {/* Cozy Footer Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-3 border-t border-white/5">
        <span className="flex items-center gap-1.5 font-medium">
          <Headphones className="w-3.5 h-3.5 text-brand" />
          <span>Put on your headphones for the best romantic experience</span>
        </span>
        <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
          <Heart className="w-3.5 h-3.5 fill-pink-500" />
          <span>Every melody reminds me of you, Divu</span>
        </span>
      </div>

    </div>
  );
}
