import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { Twitter, DiscIcon as Discord, X, Globe, Shield, FileText, Mail, Film } from 'lucide-react';

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

  const modalData = activeModalKey ? MODAL_DATA[activeModalKey] : null;

  return (
    <>
      <footer className="w-full border-t border-white/[0.08] mt-24 relative z-20 bg-[#0b0b0d] px-4 sm:px-8 py-16 pb-28 flex flex-col items-center text-center gap-5">
        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-brand-badge">CV</span>
          <span>CineVault</span>
        </div>

        {/* Discovery navigation links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-[#929093]">
          <a href="/" className="hover:text-[#f3f0ea] transition-colors">Home</a>
          <a href="/movies" className="hover:text-[#f3f0ea] transition-colors">Movies</a>
          <a href="/tvshows" className="hover:text-[#f3f0ea] transition-colors">TV Shows</a>
          <a href="/anime" className="hover:text-[#f3f0ea] transition-colors">Anime</a>
          <a href="/mylist" className="hover:text-[#f3f0ea] transition-colors">Watchlist</a>
          <a href="/trending" className="hover:text-[#f3f0ea] transition-colors">Trending</a>
        </div>

        {/* Disclaimer Note */}
        <p className="footer-note">
          CineVault does not host, store, or distribute any media files. All content is sourced from third-party providers. Metadata powered by TMDB and AniList.
        </p>

        {/* Contact Email Pill */}
        <a className="footer-mail hover:border-white/25 hover:bg-white/[0.06]" href="mailto:support@cinevault.stream">
          support@cinevault.stream
        </a>

        {/* Social / External links */}
        <div className="flex items-center gap-3 text-[#929093]">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow CineVault on Twitter"
            className="hover:text-[#f3f0ea] transition-colors bg-white/[0.04] hover:bg-white/[0.08] p-2 rounded-full border border-white/[0.08]"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join CineVault Discord"
            className="hover:text-[#f3f0ea] transition-colors bg-white/[0.04] hover:bg-white/[0.08] p-2 rounded-full border border-white/[0.08]"
          >
            <Discord className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CineVault on GitHub"
            className="hover:text-[#f3f0ea] transition-colors bg-white/[0.04] hover:bg-white/[0.08] p-2 rounded-full border border-white/[0.08]"
          >
            <Globe className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Legal & Info links */}
        <p className="footer-legal">
          <button
            type="button"
            onClick={() => setActiveModalKey('about')}
            className="hover:text-[#f3f0ea] transition-colors cursor-pointer"
          >
            About
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setActiveModalKey('privacy')}
            className="hover:text-[#f3f0ea] transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setActiveModalKey('terms')}
            className="hover:text-[#f3f0ea] transition-colors cursor-pointer"
          >
            Terms
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setActiveModalKey('contact')}
            className="hover:text-[#f3f0ea] transition-colors cursor-pointer"
          >
            Contact
          </button>
        </p>

        {/* Copyright */}
        <p className="text-[11px] text-[#929093]/60 font-mono tracking-wider pt-2">
          © {new Date().getFullYear()} CINEVAULT · ALL RIGHTS RESERVED
        </p>
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
              className="w-full max-w-2xl bg-[#121316] border border-white/[0.14] rounded-[20px] p-6 sm:p-8 relative shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                className="absolute top-5 right-5 text-[#929093] hover:text-[#f3f0ea] transition-colors bg-white/[0.06] hover:bg-white/[0.12] p-2 rounded-full cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-white/[0.08] pb-4">
                {modalData.icon}
                <h2 id="legal-modal-title" className="text-2xl font-display font-bold text-[#f3f0ea] tracking-tight">
                  {modalData.title}
                </h2>
              </div>

              <div className="text-[#f3f0ea]/90 space-y-6 leading-relaxed text-sm">
                {modalData.sections.map((section, idx) => (
                  <section key={idx} className="space-y-1.5">
                    <h3 className="text-base font-semibold text-[#f3f0ea] font-display">
                      {section.heading}
                    </h3>
                    <p className="text-[#929093] text-sm leading-relaxed">{section.body}</p>
                  </section>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.08] flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModalKey(null)}
                  className="px-6 py-2.5 bg-[#f3f0ea] text-[#0b0b0d] text-sm font-semibold rounded-full hover:bg-white transition-colors cursor-pointer"
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
