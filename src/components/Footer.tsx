import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { Twitter, DiscIcon as Discord, X, Globe, Shield, FileText, Mail, Film, Sparkles, Tv, ExternalLink } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

interface LegalModalData {
  title: string;
  icon: React.ReactNode;
  sections: Array<{ heading: string; body: string }>;
}

const MODAL_DATA: Record<string, LegalModalData> = {
  about: {
    title: 'About CineVault',
    icon: <Film className="w-6 h-6 text-brand" />,
    sections: [
      {
        heading: 'The Vision',
        body: 'CineVault is a high-performance cinema discovery and streaming platform crafted for film lovers and anime enthusiasts. Our goal is to provide a fluid, elegant interface for browsing cinema, exploring deep filmographies, and tracking your personal viewing journey across all your devices.',
      },
      {
        heading: 'Metadata & Data Sources',
        body: 'All movie and television metadata, high-resolution backdrops, posters, ratings, and cast information are provided via The Movie Database (TMDB) API. Anime metadata, episode synopses, and Japanese animation classifications are powered by the AniList GraphQL API.',
      },
      {
        heading: 'Cloud & Offline Sync',
        body: 'CineVault operates with an offline-first architecture powered by LocalStorage and Google Cloud Firestore. Whether you are signed in or browsing as a guest, your custom themes, volume preferences, and continue-watching queues remain seamless.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    sections: [
      {
        heading: '1. Information We Store',
        body: 'We respect your digital privacy. CineVault does not track your location, sell your viewing habits, or employ intrusive third-party advertising cookies. When you create an account, only your email address and profile preferences are stored securely via Firebase Authentication.',
      },
      {
        heading: '2. Local Storage & Device Caching',
        body: 'To optimize network bandwidth and page responsiveness, CineVault caches theme selections, font configurations, volume settings, and recent search history directly in your browser’s localStorage and indexed database.',
      },
      {
        heading: '3. Third-Party Services',
        body: 'API requests for media metadata are routed directly to TMDB and AniList servers under their standard public API usage guidelines. Media assets are streamed from their respective origin hosts without intermediary profiling.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    icon: <FileText className="w-6 h-6 text-blue-400" />,
    sections: [
      {
        heading: '1. Personal Non-Commercial Use',
        body: 'CineVault is provided free of charge for personal discovery, research, and non-commercial entertainment purposes. All movie trademarks, logos, and promotional imagery belong to their respective copyright holders.',
      },
      {
        heading: '2. Content Disclaimer',
        body: 'CineVault is a metadata indexer and streaming client interface. CineVault does not host, upload, or store copyright-infringing video files on its internal servers.',
      },
      {
        heading: '3. API Attribution',
        body: 'This product uses the TMDB API and AniList API but is not endorsed or certified by TMDB or AniList. By using CineVault, you agree to comply with all applicable local copyright and streaming regulations.',
      },
    ],
  },
  contact: {
    title: 'Contact & Support',
    icon: <Mail className="w-6 h-6 text-purple-400" />,
    sections: [
      {
        heading: 'Get in Touch',
        body: 'Have a feature suggestion, bug report, or want to contribute to the CineVault open-source experience? We welcome feedback from the developer and cinema communities.',
      },
      {
        heading: 'GitHub & Community',
        body: 'Find our project repositories, report issues, or inspect our source code on GitHub. Join our Discord community server to discuss movie releases, anime recommendations, and roadmap updates.',
      },
    ],
  },
};

export function Footer() {
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  const { userProfile } = useApp();

  const modalData = activeModalKey ? MODAL_DATA[activeModalKey] : null;

  return (
    <>
      <footer className="w-full border-t border-white/10 mt-20 relative z-20 bg-background/80 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-14 pb-28">
          {/* Top Section with Brand & Navigation Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Brand Column */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-7 h-7 bg-brand transition-all shrink-0 drop-shadow-md',
                    userProfile.logoStyle === 'cat' ? 'brand-logo-cat' : 'brand-logo-vault'
                  )}
                  aria-hidden="true"
                />
                <span className="text-2xl font-display font-bold text-brand tracking-wider">
                  CineVault
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                Your ultimate cinema vault for streaming films, series, and anime. Discover, track,
                and curate your personal watchlist.
              </p>
              <div className="flex items-center gap-3 pt-2 text-muted-foreground">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow CineVault on Twitter"
                  className="hover:text-brand transition-colors bg-white/5 hover:bg-brand/10 p-2 rounded-full border border-white/10 hover:border-brand/40"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join CineVault Discord"
                  className="hover:text-brand transition-colors bg-white/5 hover:bg-brand/10 p-2 rounded-full border border-white/10 hover:border-brand/40"
                >
                  <Discord className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="CineVault on GitHub"
                  className="hover:text-brand transition-colors bg-white/5 hover:bg-brand/10 p-2 rounded-full border border-white/10 hover:border-brand/40"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Internal Navigation Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 font-display">
                Discover
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-brand transition-colors flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-brand" /> Trending Home
                  </a>
                </li>
                <li>
                  <a href="/movies" className="hover:text-brand transition-colors flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-blue-400" /> Feature Films
                  </a>
                </li>
                <li>
                  <a href="/tvshows" className="hover:text-brand transition-colors flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" /> Television Series
                  </a>
                </li>
                <li>
                  <a href="/anime" className="hover:text-brand transition-colors flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Anime Hub
                  </a>
                </li>
                <li>
                  <a href="/mylist" className="hover:text-brand transition-colors">
                    My Watchlist
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Company Information */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 font-display">
                Information
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey('about')}
                    className="hover:text-brand transition-colors text-left cursor-pointer"
                  >
                    About CineVault
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey('privacy')}
                    className="hover:text-brand transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey('terms')}
                    className="hover:text-brand transition-colors text-left cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey('contact')}
                    className="hover:text-brand transition-colors text-left cursor-pointer"
                  >
                    Contact & Feedback
                  </button>
                </li>
              </ul>
            </div>

            {/* Source & Attribution Column */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 font-display">
                Data Attribution
              </h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Media data, ratings, and backdrops provided by TMDB and AniList.
              </p>
              <div className="flex flex-col gap-2 text-[11px] text-muted-foreground/80">
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                >
                  The Movie Database (TMDB) <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://anilist.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                >
                  AniList GraphQL API <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} CineVault. Built with React & Vite. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs">
              <a href="/sitemap.xml" className="hover:text-brand transition-colors">
                Sitemap
              </a>
              <a href="/llms.txt" className="hover:text-brand transition-colors">
                llms.txt
              </a>
              <a href="/robots.txt" className="hover:text-brand transition-colors">
                robots.txt
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Real, Genuine Content Modal */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveModalKey(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <FocusLock returnFocus>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-brand/30 rounded-2xl p-6 sm:p-8 relative shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-brand transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                {modalData.icon}
                <h2 id="legal-modal-title" className="text-2xl font-display font-bold text-foreground">
                  {modalData.title}
                </h2>
              </div>

              <div className="text-foreground/90 space-y-6 leading-relaxed text-sm">
                {modalData.sections.map((section, idx) => (
                  <section key={idx} className="space-y-1.5">
                    <h3 className="text-base font-semibold text-brand font-display">
                      {section.heading}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{section.body}</p>
                  </section>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModalKey(null)}
                  className="px-6 py-2.5 bg-brand text-background text-sm font-bold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
            </FocusLock>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
