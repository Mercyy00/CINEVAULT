import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronLeft, ChevronRight, Compass, Disc3, Maximize2, Stars, Play, Pause, Clapperboard, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface UniverseItem {
  id: number;
  image: string;
  universeName: string;
  sourceTitle: string;
  characters: string;
  tagline: string;
  story: string;
  probability: string;
  coordinates: string;
  vibe: string;
}

const UNIVERSE_DATA: UniverseItem[] = [
  {
    id: 1,
    image: "/images/us-in-another-universe/1.jpg",
    universeName: "Universe-01: Bikini Bottom Romance 🧽🍍",
    sourceTitle: "SpongeBob SquarePants",
    characters: "SpongeBob & Sandy",
    tagline: "Jellyfish catching, karate practice, and bubbles of endless laughter",
    story: "Deep underwater in Bikini Bottom, we flip Krabby Patties, wear giant karate helmets, and laugh until bubbles fill the whole ocean. Even under the deep blue sea, you are the sunshine that lights up my world.",
    probability: "100.00% 💖",
    coordinates: "BIKINI-BOTTOM #0907",
    vibe: "Playful & Pure Joy"
  },
  {
    id: 2,
    image: "/images/us-in-another-universe/2.jpg",
    universeName: "Universe-02: WALL-E & EVE • A Cosmic Romance 🤖🌱",
    sourceTitle: "Disney Pixar's WALL-E",
    characters: "WALL-E & EVE",
    tagline: "Holding hands across infinite galaxies and dancing among the stars",
    story: "A little lonely robot kept a tiny green sprout safe in an old boot, waiting across lightyears for his brilliant, angelic probe to arrive. When our hands clicked together in space, the whole universe lit up with life.",
    probability: "100.00% 💖",
    coordinates: "AXIOM-SPACE #2005",
    vibe: "Cosmic & Eternal Devotion"
  },
  {
    id: 3,
    image: "/images/us-in-another-universe/3.jpg",
    universeName: "Universe-03: The Amazing Spider-Man & Gwen Stacy 🕷️✨",
    sourceTitle: "The Amazing Spider-Man 2",
    characters: "Peter Parker & Gwen Stacy",
    tagline: "Webs across the bridge, rooftop kisses, and promises kept forever",
    story: "Standing high above the New York skyline, I wrote 'I LOVE YOU' in glowing spiderweb lines on the bridge. In this universe, Peter catches his Gwen every single time — holding you close and never letting you go.",
    probability: "100.00% 💖",
    coordinates: "EARTH-120703 #NYC",
    vibe: "Romantic & Unbreakable Bond"
  },
  {
    id: 4,
    image: "/images/us-in-another-universe/4.jpg",
    universeName: "Universe-04: Tangled • Kingdom of Floating Lanterns 👑🏮",
    sourceTitle: "Disney's Tangled",
    characters: "Rapunzel & Flynn Rider (Eugene)",
    tagline: "'And at last I see the light...' glowing over the night waters",
    story: "Floating on a wooden rowboat in the kingdom lagoon as thousands of golden lanterns rise into the starry night sky. All those years searching for a dream, only to realize my whole world was sitting right in front of me.",
    probability: "100.00% 💖",
    coordinates: "CORONA-LAGOON #0209",
    vibe: "Enchanted Fairytale Magic"
  },
  {
    id: 5,
    image: "/images/us-in-another-universe/5.jpg",
    universeName: "Universe-05: Zootopia • Nick Wilde & Judy Hopps 🦊🐰",
    sourceTitle: "Disney's Zootopia",
    characters: "Nick Wilde & Officer Judy Hopps",
    tagline: "'You know you love me.' • 'Do I know that? Yes, yes I do.'",
    story: "The clever, smooth-talking fox and the ambitious, hard-working bunny officer studying tirelessly for her civil service exams. No matter how tough the city gets, Nick is always right beside his officer with snacks and pride.",
    probability: "100.00% 💖",
    coordinates: "ZOOTOPIA-PD #101",
    vibe: "Witty, Loyal & Heartwarming"
  },
  {
    id: 6,
    image: "/images/us-in-another-universe/6.jpg",
    universeName: "Universe-06: Two Dancing Cats in the Rain 🐾🌧️",
    sourceTitle: "Rainy Paws Romance",
    characters: "The Midnight & Moonlight Felines",
    tagline: "Splashing through puddle ripples and purring under matching umbrellas",
    story: "A sleek black cat and a soft white kitten dancing waltz steps in the monsoon rain. Warm drops tapping on the cobblestones while we share sweet pastries and stay cozy under one giant leaf.",
    probability: "100.00% 💖",
    coordinates: "RAINY-PAWS #0709",
    vibe: "Cozy & Soft Whispers"
  },
  {
    id: 7,
    image: "/images/us-in-another-universe/7.jpg",
    universeName: "Universe-07: The Minions • Bananas & Pure Love 🍌💛",
    sourceTitle: "Illumination's Minions",
    characters: "Minions Sweethearts",
    tagline: "'Tulaliloo ti amo!' • Speaking our own secret adorable language",
    story: "Wearing tiny blue overalls and goofy round goggles, trading sweet yellow bananas, laughing at silly inside jokes, and creating hilarious little chaos together. Even in gibberish, my heart only shouts your name!",
    probability: "100.00% 💖",
    coordinates: "BANANA-LAB #2024",
    vibe: "Hilarious, Sweet & Chaotic"
  },
  {
    id: 8,
    image: "/images/us-in-another-universe/8.jpg",
    universeName: "Universe-08: Spider-Verse • Miles & Gwen 🕷️🎧",
    sourceTitle: "Spider-Man: Across the Spider-Verse",
    characters: "Miles Morales & Gwen Stacy (Spider-Gwen)",
    tagline: "Sitting upside down over Brooklyn sharing one pair of headphones",
    story: "Suspended upside down from a Manhattan bank tower, feet dangling over the glowing clouds of the city, sharing one headphone cable. Across all 5,000 dimensions of the Spider-Verse, my web always anchors to you.",
    probability: "100.00% 💖",
    coordinates: "EARTH-1610 #MULTIVERSE",
    vibe: "Iconic, Cool & Deep Connection"
  },
  {
    id: 9,
    image: "/images/us-in-another-universe/9.jpg",
    universeName: "Universe-09: Hotel Transylvania • The Eternal 'Zing!' 🦇🖤",
    sourceTitle: "Sony's Hotel Transylvania",
    characters: "Mavis & Johnny (The Zing)",
    tagline: "You only 'Zing' once in an entire lifetime... and you are mine",
    story: "They say monsters and humans only experience the legendary 'Zing' once in their entire existence. The very second I confessed my feelings on September 7, 2024, my soul locked into that unforgettable, sparkling Zing.",
    probability: "100.00% 💖",
    coordinates: "TRANSYLVANIA #ZING",
    vibe: "Destined Soulmate Spark"
  },
  {
    id: 10,
    image: "/images/us-in-another-universe/10.jpg",
    universeName: "Universe-10: Ratatouille • Paris Kitchen of Dreams 🥖🧀",
    sourceTitle: "Disney Pixar's Ratatouille",
    characters: "Paris Bistro Chefs & Remy",
    tagline: "Baking fresh baguettes, gourmet sauces, and secret spices in Paris",
    story: "Cooking together in a candlelit Parisian kitchen with Chef Remy guiding our recipes. You taste-testing every dish with a big smile, adding a dash of chaat masala to French cuisine, and dining by the Seine river.",
    probability: "100.00% 💖",
    coordinates: "GUSTEAU-PARIS #0822",
    vibe: "Delicious, Warm & Passionate"
  },
  {
    id: 11,
    image: "/images/us-in-another-universe/11.jpg",
    universeName: "Universe-11: The Lion King • Pride Rock Royalty 🦁👑",
    sourceTitle: "Disney's The Lion King",
    characters: "Simba & Nala",
    tagline: "'Can you feel the love tonight?' under the savannah stars",
    story: "Tumbling down lush grassy savannah hills, gazing at constellations of the great kings of the past, and ruling our future kingdom together with courage, unconditional kindness, and infinite royalty.",
    probability: "100.00% 💖",
    coordinates: "PRIDE-LANDS #0021",
    vibe: "Majestic, Loyal & Timeless"
  },
  {
    id: 12,
    image: "/images/us-in-another-universe/12.jpg",
    universeName: "Universe-12: Two Woodland Foxes in Autumn 🦊🍁",
    sourceTitle: "Autumn Forest Sweethearts",
    characters: "The Red Fox & The Vixen",
    tagline: "Nuzzling noses beneath golden maple leaves and forest breezes",
    story: "Two wild foxes curled up in a snug burrow surrounded by fiery red maple leaves, keeping each other warm through winter snowstorms and running free across the sunlit meadows of our future plot of land.",
    probability: "100.00% 💖",
    coordinates: "MAPLE-WOODS #FARM",
    vibe: "Natural, Cozy & Free-Spirited"
  },
  {
    id: 13,
    image: "/images/us-in-another-universe/13.jpg",
    universeName: "Universe-13: Oggy & Olivia • Sweet Backyard Romance 🐱🌸",
    sourceTitle: "Oggy and the Cockroaches",
    characters: "Oggy & Olivia",
    tagline: "Gardening white lilies, cute giggles, and protecting our cozy home",
    story: "Oggy wearing his finest bow tie, planting sunflowers and white lilies in the backyard just to see sweet Olivia smile with a flower in her ear. Even when crazy cockroaches cause mischief, our sweet love wins every single time.",
    probability: "100.00% 💖",
    coordinates: "OGGY-GARDEN #FOREVER",
    vibe: "Wholesome, Cute & Forever"
  }
];

export function MultiverseFilmReel() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isAutoRolling, setIsAutoRolling] = useState<boolean>(true);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const reelScrollRef = useRef<HTMLDivElement | null>(null);

  const activeUniverse = UNIVERSE_DATA[activeIndex];

  // Auto-roll reel smoothly every 4.8s
  useEffect(() => {
    if (!isAutoRolling) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % UNIVERSE_DATA.length);
    }, 4800);
    return () => clearInterval(interval);
  }, [isAutoRolling]);

  // Center active film frame in the horizontal strip
  useEffect(() => {
    if (reelScrollRef.current) {
      const container = reelScrollRef.current;
      const targetCard = container.children[activeIndex] as HTMLElement;
      if (targetCard) {
        const scrollLeft = targetCard.offsetLeft - container.offsetWidth / 2 + targetCard.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  const handleNext = () => {
    setIsAutoRolling(false);
    setActiveIndex(prev => (prev + 1) % UNIVERSE_DATA.length);
  };

  const handlePrev = () => {
    setIsAutoRolling(false);
    setActiveIndex(prev => (prev - 1 + UNIVERSE_DATA.length) % UNIVERSE_DATA.length);
  };

  const handleSelectUniverse = (idx: number) => {
    setIsAutoRolling(false);
    setActiveIndex(idx);
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto py-16 px-2 sm:px-6 select-none overflow-hidden">
      
      {/* Background Cosmic Multiverse Nebula Aura */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none transition-all duration-700 -z-10"
        style={{ background: 'radial-gradient(circle, var(--theme-accent, #e8852a) 0%, #ec4899 50%, #8b5cf6 100%)' }}
      />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-bold mb-4 shadow-md backdrop-blur-md"
        >
          <Clapperboard className="w-4 h-4 text-pink-500 animate-pulse" />
          <span>Multiverse Cinema Reel • 35mm Celluloid</span>
          <Stars className="w-4 h-4 text-amber-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-foreground tracking-tight leading-tight mb-4"
        >
          Us In <span className="bg-gradient-to-r from-brand via-pink-500 to-purple-500 bg-clip-text text-transparent">Another Universe</span> 🌌🎬
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-xs sm:text-base font-medium leading-relaxed"
        >
          Across infinite dimensions, cartoon worlds, and movie timelines... in every single one of them, Jay will always fall head-over-heels in love with his Divu.
        </motion.p>
      </div>

      {/* MAIN CINEMA SPOTLIGHT PROJECTOR STAGE */}
      <div className="relative glass bg-card/85 border border-border rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl mb-12 overflow-hidden">
        
        {/* Top Viewfinder HUD Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-border/50 text-xs font-mono">
          <div className="flex items-center gap-2 text-brand font-bold">
            <Compass className="w-4 h-4 text-pink-500 animate-pulse" />
            <span className="tracking-wider">TIMELINE COORD: {activeUniverse.coordinates}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-500 text-[11px] font-bold">
              MATCH PROBABILITY: {activeUniverse.probability}
            </span>
            <span className="hidden sm:inline-block text-muted-foreground">
              FRAME {activeIndex + 1} / {UNIVERSE_DATA.length}
            </span>
          </div>
        </div>

        {/* Projector Center Content: Large Spotlight Display & Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Spotlight Cinema Screen / 35mm Slide Frame (7 Cols - Wider & Bigger) */}
          <div className="lg:col-span-7 relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-4 border-card/90 bg-black/95 aspect-[16/11] sm:aspect-[4/3] max-h-[520px] w-full mx-auto flex items-center justify-center">
              
              {/* Authentic 35mm Film Sprockets along border */}
              <div className="absolute top-0 inset-x-0 h-4 bg-black/90 flex items-center justify-between px-3 z-20">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2 bg-white/30 rounded-xs" />
                ))}
              </div>
              <div className="absolute bottom-0 inset-x-0 h-4 bg-black/90 flex items-center justify-between px-3 z-20">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2 bg-white/30 rounded-xs" />
                ))}
              </div>

              {/* Main Universe Slide Image (Full width object-contain to prevent side clipping) */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeUniverse.id}
                  initial={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  src={activeUniverse.image}
                  alt={activeUniverse.universeName}
                  className="w-full h-full object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                />
              </AnimatePresence>

              {/* Vintage Film Light Sheen & Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Expand Lightbox Button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-6 right-4 p-2.5 rounded-full bg-black/70 hover:bg-brand text-white border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg backdrop-blur-md cursor-pointer z-30"
                title="Expand fullscreen view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Universe Badge on bottom of image */}
              <div className="absolute bottom-6 left-4 z-30">
                <span className="px-3 py-1 rounded-full bg-black/80 border border-white/20 text-white text-[11px] font-mono backdrop-blur-md font-bold">
                  {activeUniverse.sourceTitle}
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Multiverse Narrative & Controls (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            
            <div>
              {/* Universe Title */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold font-mono mb-3">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>MULTIVERSE TIMELINE #{activeUniverse.id < 10 ? `0${activeUniverse.id}` : activeUniverse.id} • {activeUniverse.sourceTitle}</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-display font-black text-foreground tracking-tight leading-snug mb-2">
                {activeUniverse.universeName}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground font-mono">
                  Characters: <strong className="text-foreground">{activeUniverse.characters}</strong>
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-brand italic mb-4">
                "{activeUniverse.tagline}"
              </p>

              {/* Heartfelt Universe Story Box */}
              <div className="glass bg-card/90 border border-border/80 rounded-2xl p-5 sm:p-6 shadow-inner relative">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2.5 pb-2 border-b border-border/50">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
                  <span>A Note From Jay In This Timeline:</span>
                </div>
                <p className="text-xs sm:text-sm font-serif italic text-foreground/90 leading-relaxed">
                  "{activeUniverse.story}"
                </p>
              </div>
            </div>

            {/* Quick Universe Badges / Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-card/75 border border-border p-2.5 rounded-xl">
                <span className="text-[10px] text-muted-foreground uppercase block font-sans">Probability</span>
                <span className="font-bold text-pink-500">{activeUniverse.probability}</span>
              </div>
              <div className="bg-card/75 border border-border p-2.5 rounded-xl">
                <span className="text-[10px] text-muted-foreground uppercase block font-sans">Timeline Vibe</span>
                <span className="font-bold text-brand">{activeUniverse.vibe}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-card/75 border border-border p-2.5 rounded-xl">
                <span className="text-[10px] text-muted-foreground uppercase block font-sans">Universal Rule</span>
                <span className="font-bold text-emerald-400">Eternal Love 💖</span>
              </div>
            </div>

            {/* Navigation Buttons & Auto-Roll Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl glass border border-border hover:border-brand/50 text-foreground hover:text-brand font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev Universe
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2.5 rounded-xl bg-brand text-background font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Next Universe <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsAutoRolling(!isAutoRolling)}
                className={cn(
                  "px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                  isAutoRolling 
                    ? "bg-pink-500/15 border-pink-500/30 text-pink-500" 
                    : "glass border-border text-muted-foreground hover:text-foreground"
                )}
                title={isAutoRolling ? "Pause auto-rolling" : "Resume auto-rolling"}
              >
                {isAutoRolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoRolling ? "Auto-Rolling" : "Paused"}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* CONTINUOUS 35MM HORIZONTAL ROLLING FILMSTRIP */}
      <div className="relative">
        
        {/* Vintage Film Roll Header with Dual Spinning Brass Reels */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground">
            <Disc3 className={cn("w-5 h-5 text-brand", isAutoRolling && "animate-spin-slow")} />
            <span>35MM MULTIVERSE FILM ROLL • DRAG OR CLICK TO EXPLORE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <span>CONTINUOUS REEL</span>
            <Disc3 className={cn("w-5 h-5 text-pink-500", isAutoRolling && "animate-spin-slow")} />
          </div>
        </div>

        {/* Film Strip Housing with Authentic Celluloid Border */}
        <div className="relative bg-black/95 rounded-3xl p-3 sm:p-5 border-2 border-neutral-800 shadow-2xl overflow-hidden">
          
          {/* Top Continuous Sprocket Holes */}
          <div className="w-full flex items-center justify-between pb-3 overflow-hidden border-b border-neutral-800">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="w-3 h-2 bg-neutral-800 rounded-xs shrink-0 mx-1.5" />
            ))}
          </div>

          {/* Scrollable Film Reel Track */}
          <div 
            ref={reelScrollRef}
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto custom-scrollbar py-4 px-2 snap-x"
            style={{ scrollbarWidth: 'none' }}
          >
            {UNIVERSE_DATA.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <motion.div
                  key={item.id}
                  onClick={() => handleSelectUniverse(idx)}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative shrink-0 w-44 sm:w-56 md:w-64 aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 snap-center border-2 bg-black",
                    isActive 
                      ? "border-brand shadow-[0_0_25px_rgba(232,133,42,0.6)] ring-2 ring-brand/50 scale-105" 
                      : "border-neutral-800 opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={item.image}
                    alt={item.universeName}
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Frame Number Tag (Authentic Film Code) */}
                  <div className="absolute top-2 left-2 text-[9px] font-mono font-bold text-white/85 bg-black/70 px-1.5 py-0.5 rounded-xs backdrop-blur-xs">
                    #{item.id < 10 ? `0${item.id}` : item.id}
                  </div>

                  {/* Source movie pill on top-right */}
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-pink-400 bg-black/70 px-1.5 py-0.5 rounded-xs backdrop-blur-xs truncate max-w-[80px]">
                    {item.sourceTitle}
                  </div>

                  {/* Title on Bottom */}
                  <div className="absolute bottom-2 inset-x-2 text-left">
                    <p className="text-[10px] sm:text-xs font-bold text-white truncate leading-tight">
                      {item.characters}
                    </p>
                    <p className="text-[8px] font-mono text-brand truncate mt-0.5">
                      {item.coordinates}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Continuous Sprocket Holes */}
          <div className="w-full flex items-center justify-between pt-3 overflow-hidden border-t border-neutral-800">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="w-3 h-2 bg-neutral-800 rounded-xs shrink-0 mx-1.5" />
            ))}
          </div>

        </div>

      </div>

      {/* EXPANDED FULLSCREEN CINEMA LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full glass bg-card/95 border border-brand/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
                <div>
                  <span className="text-xs font-mono text-brand font-bold">MULTIVERSE PROJECTION #{activeUniverse.id < 10 ? `0${activeUniverse.id}` : activeUniverse.id} • {activeUniverse.sourceTitle}</span>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">{activeUniverse.universeName}</h3>
                </div>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="w-9 h-9 rounded-full glass border border-white/15 flex items-center justify-center text-foreground hover:bg-white/10 transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="rounded-2xl overflow-hidden shadow-2xl max-h-[420px] bg-black flex items-center justify-center">
                  <img
                    src={activeUniverse.image}
                    alt={activeUniverse.universeName}
                    className="w-full h-full object-contain max-h-[420px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-brand/15 text-brand text-xs font-mono font-bold">
                      {activeUniverse.characters}
                    </span>
                  </div>
                  <p className="text-base font-serif italic text-brand">
                    "{activeUniverse.tagline}"
                  </p>
                  <p className="text-sm font-sans leading-relaxed text-foreground/90">
                    {activeUniverse.story}
                  </p>
                  <div className="p-4 rounded-xl bg-card border border-border text-xs font-mono space-y-1">
                    <p className="text-muted-foreground">COORDINATES: <span className="text-foreground font-bold">{activeUniverse.coordinates}</span></p>
                    <p className="text-muted-foreground">LOVE PROBABILITY: <span className="text-pink-500 font-bold">{activeUniverse.probability}</span></p>
                    <p className="text-muted-foreground">UNIVERSAL LAW: <span className="text-brand font-bold">Jay + Divu Forever</span></p>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
