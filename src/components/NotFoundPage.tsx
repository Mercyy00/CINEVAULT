import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Film, Tv, Sparkles, Bookmark, Search, ArrowRight } from 'lucide-react';
import { updateSeoMetadata } from '../lib/seo';

export function NotFoundPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    updateSeoMetadata({
      title: '404 Page Not Found',
      description: 'The requested page or title is not available in the CineVault catalogue.',
      ogType: 'website',
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.hash = `#search/${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 pt-16 pb-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand/10 blur-[120px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
          Error 404 • Missing Reel
        </div>

        {/* 404 Huge Typography */}
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-display font-extrabold text-foreground tracking-tight mb-4 drop-shadow-lg">
          4<span className="text-brand">0</span>4
        </h1>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-3">
          That film is not in the vault.
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
          The page or reel you requested could not be located. It might have been relocated, deleted,
          or never existed in this timeline.
        </p>

        {/* Inline Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies, TV, anime..."
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand rounded-full py-3.5 pl-12 pr-12 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all backdrop-blur-md"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute right-2 p-2 bg-brand text-background rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          <a
            href="#home"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-medium transition-all hover:scale-105"
          >
            <Home className="w-3.5 h-3.5 text-brand" /> Home
          </a>
          <a
            href="#movies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-medium transition-all hover:scale-105"
          >
            <Film className="w-3.5 h-3.5 text-blue-400" /> Movies
          </a>
          <a
            href="#tvshows"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-medium transition-all hover:scale-105"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" /> TV Shows
          </a>
          <a
            href="#anime"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-medium transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Anime
          </a>
          <a
            href="#mylist"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-medium transition-all hover:scale-105"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" /> My List
          </a>
        </div>

        {/* Primary CTA */}
        <a
          href="#home"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand text-background font-bold rounded-full hover:opacity-90 shadow-card transition-all hover:scale-105 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Back to Discover
        </a>
      </motion.div>
    </div>
  );
}
