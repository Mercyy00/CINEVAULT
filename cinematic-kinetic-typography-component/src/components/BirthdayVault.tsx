import { motion } from 'framer-motion';

export default function BirthdayVault() {
  const sections = [
    { icon: '📸', title: 'Photo Gallery', desc: 'A collection of our most beautiful moments together', color: '#e8852a', gradient: 'from-amber-500/10 to-orange-600/5' },
    { icon: '💌', title: 'Love Letters', desc: 'Words from the deepest part of my heart to yours', color: '#ff4d6d', gradient: 'from-rose-500/10 to-pink-600/5' },
    { icon: '🎵', title: 'Our Songs', desc: 'The soundtrack of our love story, every note matters', color: '#f5a623', gradient: 'from-yellow-500/10 to-amber-600/5' },
    { icon: '🎁', title: 'Hidden Surprises', desc: 'Secret treasures waiting for you to discover', color: '#ff6b8a', gradient: 'from-pink-400/10 to-rose-500/5' },
  ];

  return (
    <motion.div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{ background: '#0b0c10', fontFamily: "'Inter', system-ui, sans-serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main radial glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(232,133,42,0.06) 0%, rgba(255,77,109,0.03) 35%, transparent 60%)',
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Secondary glow */}
          <div
            className="absolute top-1/3 left-2/3 rounded-full"
            style={{
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255,77,109,0.03) 0%, transparent 60%)',
            }}
          />
          {/* Floating particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                width: 1 + Math.random() * 2,
                height: 1 + Math.random() * 2,
                background: i % 2 === 0 ? 'rgba(232,133,42,0.15)' : 'rgba(255,77,109,0.1)',
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.1, 0.6, 0.1],
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                delay: Math.random() * 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 text-center space-y-5 sm:space-y-7"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Crown emoji */}
          <motion.div
            className="text-4xl sm:text-5xl md:text-6xl"
            animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            👑
          </motion.div>

          {/* Main title */}
          <div>
            <motion.h1
              className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <span className="gradient-text-shimmer">Happy Birthday</span>
            </motion.h1>
          </div>

          {/* Name with dramatic reveal */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <h2
              className="text-3xl sm:text-5xl md:text-7xl font-light italic tracking-wide"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              <span className="gradient-text">Divyanshi</span>
            </h2>
            {/* Glow behind name */}
            <motion.div
              className="absolute inset-0 -z-10 blur-2xl"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: 'radial-gradient(circle, rgba(255,77,109,0.15), rgba(232,133,42,0.1), transparent)' }}
            />
          </motion.div>

          {/* Decorative divider */}
          <motion.div
            className="flex items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <div className="h-px w-16 sm:w-24" style={{ background: 'linear-gradient(90deg, transparent, #e8852a)' }} />
            <motion.span
              style={{ color: '#e8852a' }}
              className="text-base"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ✦
            </motion.span>
            <div className="h-px w-16 sm:w-24" style={{ background: 'linear-gradient(90deg, #ff4d6d, transparent)' }} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed font-light"
            style={{ color: 'rgba(200,200,200,0.6)', fontFamily: "'Playfair Display', Georgia, serif" }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            Every moment of this universe was crafted with love, just for you.
            Welcome to your birthday celebration, my angel. 🌟
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: 'rgba(232,133,42,0.3)' }}>
              <motion.div
                className="w-1 h-1.5 rounded-full"
                style={{ background: '#e8852a' }}
                animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
          <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'rgba(232,133,42,0.3)' }}>
            Scroll
          </span>
        </motion.div>
      </div>

      {/* Vault Sections */}
      <div className="relative z-10 px-6 sm:px-12 md:px-20 pb-24 max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="h-px w-10" style={{ background: 'rgba(232,133,42,0.2)' }} />
            <span style={{ color: 'rgba(232,133,42,0.4)' }}>✦</span>
            <div className="h-px w-10" style={{ background: 'rgba(255,77,109,0.2)' }} />
          </motion.div>
          <h3
            className="text-2xl sm:text-3xl md:text-4xl font-semibold gradient-text mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your Birthday Vaults
          </h3>
          <p className="text-xs sm:text-sm font-light" style={{ color: 'rgba(200,200,200,0.4)' }}>
            Each vault holds a special piece of our story
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className="group relative rounded-2xl p-6 sm:p-8 border cursor-pointer overflow-hidden"
              style={{
                borderColor: `${section.color}20`,
                background: 'rgba(255,255,255,0.015)',
              }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{
                scale: 1.04,
                y: -6,
                borderColor: `${section.color}50`,
                background: 'rgba(255,255,255,0.03)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${section.color}0a, transparent 70%)`,
                }}
              />

              {/* Corner accent */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 100% 0%, ${section.color}, transparent 70%)` }}
              />

              <div className="relative z-10">
                <motion.span
                  className="text-3xl sm:text-4xl block mb-4"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                >
                  {section.icon}
                </motion.span>
                <h4
                  className="text-lg sm:text-xl font-semibold mb-2"
                  style={{ color: section.color, fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {section.title}
                </h4>
                <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'rgba(200,200,200,0.45)' }}>
                  {section.desc}
                </p>
                <motion.div
                  className="mt-5 inline-flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-medium"
                  style={{ color: `${section.color}80` }}
                  whileHover={{ x: 4 }}
                >
                  Coming Soon
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special message card */}
        <motion.div
          className="mt-10 sm:mt-14 rounded-2xl p-8 sm:p-10 md:p-12 text-center border overflow-hidden relative"
          style={{
            borderColor: 'rgba(232,133,42,0.15)',
            background: 'rgba(255,255,255,0.01)',
          }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(232,133,42,0.03) 0%, rgba(255,77,109,0.02) 30%, transparent 60%)',
            }}
          />
          <div className="relative z-10">
            <p
              className="text-base sm:text-lg md:text-xl italic leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'rgba(200,200,200,0.6)', fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              &ldquo;In a world of billions, you are the one I chose — not because I had to,
              but because my heart never gave me another option. Happy Birthday, my love.&rdquo;
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px w-6" style={{ background: 'rgba(232,133,42,0.2)' }} />
              <span className="text-xs" style={{ color: 'rgba(232,133,42,0.4)' }}>♡</span>
              <div className="h-px w-6" style={{ background: 'rgba(255,77,109,0.2)' }} />
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-16 sm:mt-20 pb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <p
            className="text-xs sm:text-sm italic font-light"
            style={{ color: 'rgba(200,200,200,0.25)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Made with all the love in the universe, for the one who holds my heart. 💖
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-8" style={{ background: 'rgba(232,133,42,0.15)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(232,133,42,0.2)' }}>✦</span>
            <div className="h-px w-8" style={{ background: 'rgba(255,77,109,0.15)' }} />
          </div>
        </motion.div>
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(11,12,16,0.4) 80%, rgba(11,12,16,0.7) 100%)' }}
      />
    </motion.div>
  );
}
