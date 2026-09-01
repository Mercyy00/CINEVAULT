import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, ChevronRight, ChevronLeft, Maximize2 } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { CuteHeart, CuteSunflower, CuteSakura, CuteStar, CuteSparkles } from './CuteIcons';

export interface PolaroidMemory {
  id: number;
  title: string;
  date: string;
  category: 'origins' | 'habits' | 'calls' | 'dreams' | 'wishes';
  sticker?: 'heart' | 'sunflower' | 'lily' | 'star' | 'tape' | 'sparkle';
  rotation: number; // degrees
  imageUrl: string;
  gradient: string;
}

const REAL_IMAGE_FILES = [
  '31c307e4-9b82-425a-a1af-97b47927a28b.jpeg',
  'di.vyanshi7583_14030622_143828445.jpg',
  'di.vyanshi7583_14031107_144434932.jpg',
  'di.vyanshi7583_14031107_144436649.jpg',
  'di.vyanshi7583_14031107_144458156.jpg',
  'di.vyanshi7583_14031107_144501668.jpg',
  'di.vyanshi7583_14040121_172823596.jpg',
  'f1b62dd379a8ded792709f8dc43e73d8.jpg',
  'IMG_20240910_010100.jpg',
  'IMG_20241009_164041_0459.jpg',
  'IMG_20241016_134736.jpg',
  'IMG_20241030_010240_0051.jpg',
  'IMG_20241127_174423_0152.jpg',
  'IMG_20241127_174556_0054.jpg',
  'IMG_20241127_174640_0019.jpg',
  'IMG_20241231_185121.jpg',
  'IMG_20241231_185236.jpg',
  'IMG_20250202_225839_0195.jpg',
  'IMG_20250311_191606_0167.jpg',
  'IMG_20250517_193742.jpg',
  'IMG_20250809_222359_0135.jpg',
  'IMG-20250506-WA0028.jpg',
  'IMG-20250506-WA0029.jpg',
  'IMG-20250722-WA0008.jpg',
  'IMG-20250811-WA0035.jpg',
  'IMG-20250828-WA0012.jpg',
  'IMG-20250923-WA0032.jpg',
  'IMG-20250923-WA0038.jpg',
  'IMG-20250925-WA0056.jpg',
  'IMG-20250925-WA0059.jpg',
  'IMG-20260111-WA0020.jpg',
  'IMG-20260111-WA0035.jpg',
  'IMG-20260111-WA0039.jpg',
  'IMG-20260404-WA0035.jpg',
  'IMG-20260404-WA0041.jpg',
  'IMG-20260404-WA0042.jpg',
  'IMG-20260404-WA0046.jpg',
  'Screenshot_2024-10-10-10-52-05-97_99c04817c0de5652397fc8b56c3b3817.jpg',
  'Screenshot_2025-07-15-18-12-33-43_965bbf4d18d205f782c6b8409c5773a4.jpg',
  'Screenshot_2025-07-20-13-03-50-16_8ceee6849b8c4820d6837a47f7055a8f.jpg',
];

const MEMORY_TITLES = [
  "The First Glimpse",
  "That Unforgettable Smile",
  "Late Night Talks",
  "Our Secret Confession",
  "Goluuu Moment",
  "Besan Ka Ladduuu",
  "Endless Giggles",
  "Warm Forehead Kiss",
  "First Video Call Blushes",
  "Morning Sunshine Vibe",
  "Cutest Selfie Ever",
  "Holding Your Hand",
  "The 2:00 PM Routine",
  "Sweet Voice Notes",
  "Study Partner Forever",
  "Sunflower Bloom",
  "Inside Jokes & Memes",
  "The Way You Look At Me",
  "Pure Happiness",
  "Matching Vibes",
  "Midnight Craving Dates",
  "Our Cozy Talks",
  "Softest Hugs",
  "Dreaming of Our Future",
  "Farmhouse Sunset Wish",
  "Kashmir Snow Dream",
  "Anime Marathon Night",
  "Little Things I Love",
  "Your Silly Laugh",
  "My Favorite Human",
  "Safe Shelter in You",
  "Everyday Magic",
  "Soul Connection",
  "Counting the Stars",
  "Walking Together",
  "Forever Cheering You",
  "My Guardian Angel",
  "Sweetest 21st Birthday",
  "An Infinite Love Story",
  "Happy Birthday, My Universe",
];

const ROTATIONS = [-2.5, 2, -1.5, 3, -3, 1.5, -2, 2.5];
const STICKERS: Array<'heart' | 'sunflower' | 'lily' | 'star' | 'tape' | 'sparkle'> = [
  'heart', 'sunflower', 'lily', 'star', 'tape', 'sparkle'
];
const GRADIENTS = [
  'from-amber-500/15 to-orange-500/10',
  'from-pink-500/15 to-rose-500/10',
  'from-purple-500/15 to-blue-500/10',
  'from-red-500/15 to-pink-500/10',
  'from-teal-500/15 to-emerald-500/10',
];

// Generate 40 Polaroids strictly using the real photos
const INITIAL_POLAROIDS: PolaroidMemory[] = REAL_IMAGE_FILES.map((filename, idx) => {
  const categoryIndex = Math.floor(idx / 8);
  const categories: Array<'origins' | 'habits' | 'calls' | 'dreams' | 'wishes'> = [
    'origins', 'habits', 'calls', 'dreams', 'wishes'
  ];

  return {
    id: idx + 1,
    title: MEMORY_TITLES[idx] || `Our Moment #${idx + 1}`,
    date: `Memory #${idx + 1}`,
    category: categories[categoryIndex] || 'wishes',
    sticker: STICKERS[idx % STICKERS.length],
    rotation: ROTATIONS[idx % ROTATIONS.length],
    imageUrl: `/images/us/${filename}`,
    gradient: GRADIENTS[idx % GRADIENTS.length],
  };
});

export function HangingPolaroidsGallery() {
  const { theme } = useApp();
  const [selectedPolaroid, setSelectedPolaroid] = useState<PolaroidMemory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredMemories = useMemo(() => {
    if (activeCategory === 'all') return INITIAL_POLAROIDS;
    return INITIAL_POLAROIDS.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  const waveChunks = useMemo(() => {
    return [
      { title: "Chapter 1: The First Spark & Mystery", memories: filteredMemories.slice(0, 8) },
      { title: "Chapter 2: Inside Jokes, Habits & Giggles", memories: filteredMemories.slice(8, 16) },
      { title: "Chapter 3: Daily Calls & Sweet Moments", memories: filteredMemories.slice(16, 24) },
      { title: "Chapter 4: Future Dreams & Adventures", memories: filteredMemories.slice(24, 32) },
      { title: "Chapter 5: 21st Birthday & Eternal Vows", memories: filteredMemories.slice(32, 40) },
    ].filter(chunk => chunk.memories.length > 0);
  }, [filteredMemories]);

  const renderSticker = (sticker?: string) => {
    switch (sticker) {
      case 'heart':
        return <CuteHeart className="w-4 h-4" />;
      case 'sunflower':
        return <CuteSunflower className="w-4 h-4" />;
      case 'lily':
        return <CuteSakura className="w-4 h-4" />;
      case 'star':
        return <CuteStar className="w-4 h-4" />;
      case 'sparkle':
        return <CuteSparkles className="w-4 h-4" />;
      case 'tape':
      default:
        return (
          <div className="w-7 h-2.5 bg-pink-300/70 dark:bg-pink-400/50 border border-white/40 -rotate-6 shadow-sm rounded-sm backdrop-blur-sm" />
        );
    }
  };

  const handleNextModal = () => {
    if (!selectedPolaroid) return;
    const currentIdx = INITIAL_POLAROIDS.findIndex(p => p.id === selectedPolaroid.id);
    const nextIdx = (currentIdx + 1) % INITIAL_POLAROIDS.length;
    setSelectedPolaroid(INITIAL_POLAROIDS[nextIdx]);
  };

  const handlePrevModal = () => {
    if (!selectedPolaroid) return;
    const currentIdx = INITIAL_POLAROIDS.findIndex(p => p.id === selectedPolaroid.id);
    const prevIdx = (currentIdx - 1 + INITIAL_POLAROIDS.length) % INITIAL_POLAROIDS.length;
    setSelectedPolaroid(INITIAL_POLAROIDS[prevIdx]);
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto py-16 px-2 sm:px-6 select-none">
      
      {/* Section Header */}
      <div className="text-center mb-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-4 shadow-sm backdrop-blur-md"
        >
          <Camera className="w-4 h-4 text-pink-500" />
          <span>Our 40 Real Captured Memories</span>
          <CuteHeart className="w-4 h-4" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-foreground tracking-tight mb-3"
        >
          Hanging Polaroids on <span className="text-brand bg-gradient-to-r from-brand via-pink-500 to-brand bg-clip-text text-transparent">Fairy Lights</span> 💡✨
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed mb-6"
        >
          40 of our real photos and memories hanging on warm glowing ropes. Click any Polaroid to zoom in full screen! 💖
        </motion.p>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {[
            { id: 'all', label: 'All 40 Polaroids' },
            { id: 'origins', label: 'Origins & Spark' },
            { id: 'habits', label: 'Inside Jokes' },
            { id: 'calls', label: 'Daily Calls' },
            { id: 'dreams', label: 'Future Dreams' },
            { id: 'wishes', label: '21st Wishes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                activeCategory === tab.id
                  ? "bg-brand text-background shadow-md shadow-brand/20 scale-105"
                  : "glass text-foreground/80 hover:text-foreground border border-white/10 hover:border-brand/30"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cascading Rope Waves with Performance Optimizations */}
      <div className="space-y-20 sm:space-y-24 relative">
        {waveChunks.map((chunk, waveIdx) => (
          <div
            key={waveIdx}
            className="relative will-change-transform"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '500px' }}
          >
            {/* Wave Chapter Badge */}
            <div className="flex items-center gap-3 mb-6 px-4">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs sm:text-sm font-display font-bold text-brand bg-card/90 px-4 py-1 rounded-full border border-border/80 shadow-sm backdrop-blur-md flex items-center gap-1.5">
                <CuteStar className="w-3.5 h-3.5" />
                <span>{chunk.title}</span>
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Rope Line with Lightweight Twinkling Fairy Lights */}
            <div className="relative w-full h-10 flex items-center justify-center pointer-events-none">
              <svg className="absolute w-full h-12 top-0 left-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 30">
                <path
                  d="M 0 8 Q 300 28, 600 15 T 1200 10"
                  fill="transparent"
                  stroke={theme.includes('light') ? '#8b5a2b' : '#c49a6c'}
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              </svg>

              {/* Lightweight CSS Fairy Lights */}
              <div className="absolute inset-x-0 top-1 flex justify-around px-4 sm:px-12 pointer-events-none">
                {[...Array(12)].map((_, lightIdx) => (
                  <div key={lightIdx} className="relative flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-amber-950/80 rounded-t-sm" />
                    <div
                      className={cn(
                        "w-2.5 h-3 rounded-full shadow-md transition-opacity animate-pulse",
                        lightIdx % 2 === 0
                          ? "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]"
                          : "bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.8)]"
                      )}
                      style={{ animationDuration: `${2 + (lightIdx % 3) * 0.5}s` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Clean Clutter-Free Polaroid Grid (No Captions, Pure Visual Beauty) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pt-3 px-2 sm:px-4">
              {chunk.memories.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPolaroid(item)}
                  style={{
                    transform: `rotate(${item.rotation}deg) translateZ(0)`,
                  }}
                  className="group relative cursor-pointer select-none transition-transform duration-300 hover:scale-105 hover:rotate-0 hover:z-30 will-change-transform"
                >
                  {/* Wooden Clothespin / Peg on Top */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                    <div className="w-3 h-5 bg-[#d4a373] rounded-sm border border-[#a77444] shadow-sm relative">
                      <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-zinc-400 border-y border-zinc-600" />
                    </div>
                  </div>

                  {/* Clean Polaroid Card Frame */}
                  <div className="bg-[#fefefe] dark:bg-[#1c1a18] border border-black/10 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 pb-3 sm:pb-3.5 shadow-md hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
                    
                    {/* Photo Container with Lazy Loading */}
                    <div className={cn(
                      "relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-neutral-900 border border-black/5 dark:border-white/5 flex items-center justify-center",
                      item.gradient
                    )}>
                      {/* Corner Cute Sticker */}
                      <div className="absolute top-1.5 right-1.5 z-10 drop-shadow-md pointer-events-none">
                        {renderSticker(item.sticker)}
                      </div>

                      {/* Photo Image */}
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />

                      {/* Hover Zoom Icon */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/80 text-black flex items-center justify-center shadow-lg">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Subtle, Clean Bottom Chin (No Cluttered Caption) */}
                    <div className="pt-2 px-1 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      <span className="font-bold text-foreground truncate max-w-[120px]">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        #{item.id}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* Lightbox Modal for Crisp Full View */}
      <AnimatePresence>
        {selectedPolaroid && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            
            <div 
              onClick={() => setSelectedPolaroid(null)} 
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-lg bg-card border-2 border-brand/40 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPolaroid(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-brand transition-colors flex items-center justify-center shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Full Image */}
              <div className="relative w-full aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-black mb-4 border border-white/10 shadow-inner">
                <img
                  src={selectedPolaroid.imageUrl}
                  alt={selectedPolaroid.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Modal Details */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-display font-black text-foreground">
                    {selectedPolaroid.title}
                  </h3>
                  <p className="text-xs text-brand font-mono font-bold mt-0.5">
                    Captured Memory #{selectedPolaroid.id} of 40 💖
                  </p>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevModal}
                    className="w-8 h-8 rounded-full glass border border-white/10 hover:border-brand flex items-center justify-center text-foreground cursor-pointer"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextModal}
                    className="w-8 h-8 rounded-full glass border border-white/10 hover:border-brand flex items-center justify-center text-foreground cursor-pointer"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
