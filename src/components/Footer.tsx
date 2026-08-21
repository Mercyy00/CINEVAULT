import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Twitter, DiscIcon as Discord, X } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

export function Footer() {
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);
  const { userProfile } = useApp();

  const openModal = (title: string) => {
    setModalContent({
      title,
      content: `This is placeholder text for the ${title} page. CineVault is a premium streaming interface built for demonstration purposes. All content is powered by external APIs and no videos are hosted on our servers.`
    });
  };

  return (
    <>
      <footer className="w-full glass border-t border-white/10 mt-20 relative z-20 bg-card/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-12 pb-32">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2.5 justify-center md:justify-start mb-2">
                <div 
                  className={cn(
                    "w-7 h-7 bg-brand transition-all shrink-0 drop-shadow-md",
                    userProfile.logoStyle === 'cat' ? "brand-logo-cat" : "brand-logo-vault"
                  )} 
                />
                <h2 className="text-3xl font-display font-bold text-brand tracking-wider drop-shadow-md">CineVault</h2>
              </div>
              <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} CineVault. All rights reserved.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-foreground">
              <button onClick={() => openModal('About Us')} className="hover:text-brand transition-colors">About</button>
              <button onClick={() => openModal('Privacy Policy')} className="hover:text-brand transition-colors">Privacy Policy</button>
              <button onClick={() => openModal('Terms of Service')} className="hover:text-brand transition-colors">Terms of Service</button>
              <button onClick={() => openModal('Contact')} className="hover:text-brand transition-colors">Contact</button>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end gap-4 text-muted-foreground">
            <a href="#" className="hover:text-brand transition-colors bg-white/5 p-2 rounded-full border border-white/10 hover:border-brand/50"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-brand transition-colors bg-white/5 p-2 rounded-full border border-white/10 hover:border-brand/50"><Discord className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setModalContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass border border-brand/30 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(255,255,255,)] max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setModalContent(null)}
                className="absolute top-6 right-6 text-muted-foreground hover:text-brand transition-colors bg-white/5 p-1 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-3xl font-display font-bold text-brand mb-6 border-b border-white/10 pb-4">
                {modalContent.title}
              </h3>
              
              <div className="text-foreground/90 leading-relaxed space-y-4">
                <p>{modalContent.content}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
