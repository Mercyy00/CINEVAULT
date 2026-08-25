import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Camera, X, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

export interface PolaroidMemory {
  id: number;
  title: string;
  date: string;
  caption: string;
  note?: string;
  category: 'origins' | 'habits' | 'calls' | 'dreams' | 'wishes';
  sticker?: 'heart' | 'sunflower' | 'lily' | 'tape' | 'star' | 'luffy' | 'strawberry';
  rotation: number; // degrees
  imageUrl?: string;
  gradient: string;
}

// 40 Curated Memories & Moments based on their real story
export const INITIAL_POLAROIDS: PolaroidMemory[] = [
  // TIER 1: The Origin & First Spark (1-8)
  {
    id: 1,
    title: "The Luffy PFP Mystery",
    date: "Summer 2024",
    caption: "When I thought you were a boy on Instagram GC!",
    note: "Never in a million years did I imagine that behind that Luffy picture was the girl who would steal my whole heart.",
    category: 'origins',
    sticker: 'luffy',
    rotation: -3,
    gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20'
  },
  {
    id: 2,
    title: "Realizing You're a Girl",
    date: "Late Summer 2024",
    caption: "The moment everything changed ✨",
    note: "That sudden moment I found out... my heart literally did a complete backflip.",
    category: 'origins',
    sticker: 'heart',
    rotation: 2.5,
    gradient: 'from-pink-500/20 via-rose-500/20 to-purple-500/20'
  },
  {
    id: 3,
    title: "Secret Silent Crush",
    date: "August 2024",
    caption: "Admiring you quietly from afar",
    note: "Watching you be so sweet and genuine, hoping one day I could be the one to make you smile.",
    category: 'origins',
    sticker: 'star',
    rotation: -2,
    gradient: 'from-purple-500/20 via-indigo-500/20 to-blue-500/20'
  },
  {
    id: 4,
    title: "September 7, 2024 💖",
    date: "07-09-2024",
    caption: "The Confession & Our Day 1",
    note: "The best day of my entire life. I told you how I felt, and you chose me. Forever grateful.",
    category: 'origins',
    sticker: 'tape',
    rotation: 3,
    gradient: 'from-red-500/20 via-pink-500/20 to-rose-500/20'
  },
  {
    id: 5,
    title: "Our Very First GMeet Call",
    date: "September 2024",
    caption: "Butterflies and endless blushing 🙈",
    note: "Hands shaking, smiling so wide my cheeks hurt, hearing your adorable voice live.",
    category: 'origins',
    sticker: 'strawberry',
    rotation: -3.5,
    gradient: 'from-teal-500/20 via-emerald-500/20 to-cyan-500/20'
  },
  {
    id: 6,
    title: "The Nickname 'Goluuu'",
    date: "September 2024",
    caption: "The cutest pet name ever invented",
    note: "Because you are the squishiest, softest, most precious ball of happiness.",
    category: 'origins',
    sticker: 'sunflower',
    rotation: 2,
    gradient: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20'
  },
  {
    id: 7,
    title: "Besan Ka Ladduuu 🟡",
    date: "September 2024",
    caption: "Sweet, precious & totally mine",
    note: "Sweetest girl in the universe who brings pure joy to my ordinary days.",
    category: 'origins',
    sticker: 'heart',
    rotation: -1.5,
    gradient: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20'
  },
  {
    id: 8,
    title: "White Lilies for Divu",
    date: "September 2024",
    caption: "Her favorite flower 🌸",
    note: "Pure, elegant, gentle and radiant — just like your soul.",
    category: 'origins',
    sticker: 'lily',
    rotation: 3.5,
    gradient: 'from-pink-400/20 via-rose-300/20 to-white/20'
  },

  // TIER 2: Inside Jokes & Cute Habits (9-16)
  {
    id: 9,
    title: "Crororororoor Times",
    date: "Every Single Day",
    caption: "Not just crore... CROROROROOR!",
    note: "That's exactly how many times I miss you, think about you, and fall in love with you every single second.",
    category: 'habits',
    sticker: 'star',
    rotation: -2.5,
    gradient: 'from-sky-500/20 via-blue-500/20 to-indigo-500/20'
  },
  {
    id: 10,
    title: "The Master Researcher 🔍",
    date: "Online Shopping Time",
    caption: "1,000 YouTube reviews for a ₹50 product",
    note: "Nobody does thorough research like my Divu! Watching 50 unboxing videos before buying a keychain.",
    category: 'habits',
    sticker: 'tape',
    rotation: 3,
    gradient: 'from-emerald-500/20 via-teal-500/20 to-blue-500/20'
  },
  {
    id: 11,
    title: "Playful Teasing & Giggles",
    date: "Daily Routine",
    caption: "When I fake-get mad and you laugh 😂",
    note: "You love poking fun at me just to hear me get worked up, and your cute laugh cures all my stress.",
    category: 'habits',
    sticker: 'sunflower',
    rotation: -3,
    gradient: 'from-yellow-500/20 via-orange-500/20 to-pink-500/20'
  },
  {
    id: 12,
    title: "Chips & Chaat Masala Fanatic",
    date: "Snack O'Clock",
    caption: "Her ultimate comfort food 🍟",
    note: "A packet of spicy chips sprinkled with extra chaat masala and she's in heaven.",
    category: 'habits',
    sticker: 'strawberry',
    rotation: 2,
    gradient: 'from-red-500/20 via-orange-500/20 to-yellow-500/20'
  },
  {
    id: 13,
    title: "Sensitive Crybaby Heart 🥺",
    date: "Emotional Moments",
    caption: "Aww type girl who feels so deeply",
    note: "You cry at small cute gestures and soft movies. Your pure emotional heart is what I treasure most.",
    category: 'habits',
    sticker: 'heart',
    rotation: -2,
    gradient: 'from-pink-500/20 via-rose-500/20 to-purple-500/20'
  },
  {
    id: 14,
    title: "Dark Romance & Titan Reader",
    date: "Bookworm Nights",
    caption: "Lost in thrilling fictional worlds 📖",
    note: "Curled up in bed reading intense dark romance novels and fangirling over fictional drama.",
    category: 'habits',
    sticker: 'star',
    rotation: 3.5,
    gradient: 'from-purple-500/20 via-violet-500/20 to-indigo-500/20'
  },
  {
    id: 15,
    title: "Sunflowers in Full Bloom 🌻",
    date: "Sunny Days",
    caption: "Turning towards the light always",
    note: "Bright, warm, resilient and full of life — just like you illuminate my world.",
    category: 'habits',
    sticker: 'sunflower',
    rotation: -1.5,
    gradient: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20'
  },
  {
    id: 16,
    title: "Random Midnight Text Spams",
    date: "Late Night Hours",
    caption: "Even when busy, my thoughts find you",
    note: "Spamming you with silly texts, reels, and voice notes because you never leave my mind.",
    category: 'habits',
    sticker: 'tape',
    rotation: 2.5,
    gradient: 'from-indigo-500/20 via-blue-500/20 to-cyan-500/20'
  },

  // TIER 3: Daily Calls & College Routine (17-24)
  {
    id: 17,
    title: "The 2:00 PM College Return Call",
    date: "Every Weekday",
    caption: "'I missed you so much today!'",
    note: "I leave at 10:00 AM and come back at 2:00 PM. Hearing you pick up right away is the best moment of the day.",
    category: 'calls',
    sticker: 'heart',
    rotation: -3,
    gradient: 'from-rose-500/20 via-pink-500/20 to-red-500/20'
  },
  {
    id: 18,
    title: "Live Guitar Serenades 🎸",
    date: "Acoustic Nights",
    caption: "Singing our favorite melodies for you",
    note: "Plucking chords on the guitar and singing soft love songs over the speaker just to see you smile.",
    category: 'calls',
    sticker: 'star',
    rotation: 2,
    gradient: 'from-amber-500/20 via-orange-500/20 to-rose-500/20'
  },
  {
    id: 19,
    title: "The Sailor Song On Repeat",
    date: "Soundtrack of Us",
    caption: "Gigi Perez vibes 🌊",
    note: "Every lyric reminds me of the waves of love and comfort I feel when talking to you.",
    category: 'calls',
    sticker: 'lily',
    rotation: -2,
    gradient: 'from-cyan-500/20 via-sky-500/20 to-blue-500/20'
  },
  {
    id: 20,
    title: "Sync Watching Anime & Movies",
    date: "Screen Sharing Dates",
    caption: "Counting 3, 2, 1... Play! 🎬",
    note: "Miles apart but pressing play at the exact same second, gasping and laughing together.",
    category: 'calls',
    sticker: 'luffy',
    rotation: 3,
    gradient: 'from-purple-500/20 via-pink-500/20 to-indigo-500/20'
  },
  {
    id: 21,
    title: "Virtual Hugs & Kisses 🤗",
    date: "Whenever Distance Hurts",
    caption: "Wrapping you in invisible warm hugs",
    note: "One day soon, no screens will be needed. I'll hold you tight and never let go.",
    category: 'calls',
    sticker: 'heart',
    rotation: -3.5,
    gradient: 'from-pink-500/20 via-rose-500/20 to-amber-500/20'
  },
  {
    id: 22,
    title: "Falling Asleep on the Call",
    date: "Midnight Whispers",
    caption: "Gentle breathing through the phone 🌙",
    note: "Listening to your peaceful breathing until sleep takes over. The sweetest lullaby.",
    category: 'calls',
    sticker: 'star',
    rotation: 1.5,
    gradient: 'from-blue-500/20 via-indigo-500/20 to-violet-500/20'
  },
  {
    id: 23,
    title: "Cheering Your Study Hustle",
    date: "Exam Prep Season",
    caption: "Proudest boyfriend in the world 📚",
    note: "Watching you work tirelessly despite family pressure. Your determination inspires me constantly.",
    category: 'calls',
    sticker: 'tape',
    rotation: -2.5,
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20'
  },
  {
    id: 24,
    title: "'You Are More Than Enough'",
    date: "Reassurance Moments",
    caption: "When self-doubt creeps in 💖",
    note: "Never doubt your worth. You are extraordinary, capable, brilliant, and deeply cherished.",
    category: 'calls',
    sticker: 'heart',
    rotation: 3,
    gradient: 'from-rose-500/20 via-pink-500/20 to-purple-500/20'
  },

  // TIER 4: Future Dreams & Our World (25-32)
  {
    id: 25,
    title: "Future Government Officer 🇮🇳",
    date: "Our Goal",
    caption: "Watching you achieve your biggest dream",
    note: "I cannot wait for the day you crack your exams and stand proud in your uniform/office. I'll be in the front row clapping loudest!",
    category: 'dreams',
    sticker: 'star',
    rotation: -2,
    gradient: 'from-amber-500/20 via-orange-500/20 to-emerald-500/20'
  },
  {
    id: 26,
    title: "Our Dream Farmhouse Plot 🏡",
    date: "Future Blueprint",
    caption: "Our own cozy land and sanctuary",
    note: "A peaceful countryside home surrounded by greenery, away from all the noise and chaos.",
    category: 'dreams',
    sticker: 'sunflower',
    rotation: 2.5,
    gradient: 'from-emerald-500/20 via-green-500/20 to-teal-500/20'
  },
  {
    id: 27,
    title: "Growing Veggies & Cooking Together",
    date: "Farmhouse Life 🥕🍅",
    caption: "Fresh home-grown vegetables",
    note: "Picking fresh tomatoes and greens together in our garden, cooking delicious meals in our kitchen.",
    category: 'dreams',
    sticker: 'strawberry',
    rotation: -3,
    gradient: 'from-lime-500/20 via-emerald-500/20 to-teal-500/20'
  },
  {
    id: 28,
    title: "Exploring the Whole World ✈️",
    date: "Passport Ready",
    caption: "Japan, Switzerland & every corner",
    note: "Holding hands in Tokyo for anime spots, walking in snowy Swiss valleys, making memories everywhere.",
    category: 'dreams',
    sticker: 'tape',
    rotation: 3.5,
    gradient: 'from-sky-500/20 via-blue-500/20 to-indigo-500/20'
  },
  {
    id: 29,
    title: "The First Real Hug in Person",
    date: "Soon... ⏳",
    caption: "Airport arrival gate countdown",
    note: "Running towards you, dropping my bags, and holding you so close that all the distance disappears.",
    category: 'dreams',
    sticker: 'heart',
    rotation: -1.5,
    gradient: 'from-pink-500/20 via-rose-500/20 to-red-500/20'
  },
  {
    id: 30,
    title: "Cute Coffee & Bookstore Dates",
    date: "Weekend Dates",
    caption: "Cozy café aesthetic ☕📚",
    note: "Ordering hot lattes, browsing romance sections, and whispering over funny book titles.",
    category: 'dreams',
    sticker: 'lily',
    rotation: 2,
    gradient: 'from-amber-600/20 via-yellow-600/20 to-orange-500/20'
  },
  {
    id: 31,
    title: "A Home Filled with Lilies & Art",
    date: "Interior Decor",
    caption: "Fresh flowers on every table 🌸",
    note: "Sunflowers by the window, white lilies on the dining table, and our framed memories on every wall.",
    category: 'dreams',
    sticker: 'lily',
    rotation: -2.5,
    gradient: 'from-rose-400/20 via-pink-400/20 to-purple-400/20'
  },
  {
    id: 32,
    title: "Watching Sunsets Hand in Hand",
    date: "Golden Hour Forever",
    caption: "No more saying goodbye on calls 🌅",
    note: "Sitting together on the terrace at sunset, leaning on my shoulder, knowing we made it through everything.",
    category: 'dreams',
    sticker: 'sunflower',
    rotation: 3,
    gradient: 'from-orange-500/20 via-amber-500/20 to-pink-500/20'
  },

  // TIER 5: 21st Birthday Milestone & Eternal Promises (33-40)
  {
    id: 33,
    title: "Turning 21 Today! 🎂",
    date: "September 2, 2026",
    caption: "Official Queen Milestone ✨",
    note: "21 years of bringing sunshine into this world. I'm the luckiest guy alive to celebrate you today.",
    category: 'wishes',
    sticker: 'star',
    rotation: -3,
    gradient: 'from-pink-500/20 via-purple-500/20 to-brand/20'
  },
  {
    id: 34,
    title: "Your Smile = My Favorite View",
    date: "Always",
    caption: "Brighter than 1,000 stars",
    note: "Whenever you smile, my whole day lights up. I promise to spend my life protecting that smile.",
    category: 'wishes',
    sticker: 'heart',
    rotation: 2,
    gradient: 'from-rose-500/20 via-pink-500/20 to-amber-500/20'
  },
  {
    id: 35,
    title: "My Favorite Notification",
    date: "Ping! 📱",
    caption: "Divu is calling / Divu sent a reel",
    note: "No matter how busy life gets, seeing your name pop up on my screen makes my heart skip a beat.",
    category: 'wishes',
    sticker: 'tape',
    rotation: -2.5,
    gradient: 'from-teal-500/20 via-cyan-500/20 to-blue-500/20'
  },
  {
    id: 36,
    title: "God's Most Beautiful Creation",
    date: "Truth ✨",
    caption: "Inside and out, flawless to me",
    note: "Your heart, kindness, humor, beauty, and soul. You are pure perfection in my eyes.",
    category: 'wishes',
    sticker: 'lily',
    rotation: 3.5,
    gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20'
  },
  {
    id: 37,
    title: "Through Every High & Low",
    date: "My Unbreakable Promise",
    caption: "Always in your corner 🛡️",
    note: "On happy days I'll celebrate you. On tough days I'll be your shelter and shoulder to cry on.",
    category: 'wishes',
    sticker: 'heart',
    rotation: -1.5,
    gradient: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20'
  },
  {
    id: 38,
    title: "Our Private Movie Vault",
    date: "CineVault Special",
    caption: "Built with love, just for us 🍿",
    note: "Every line of code and every little detail was crafted to give you the most unforgettable birthday.",
    category: 'wishes',
    sticker: 'star',
    rotation: 2.5,
    gradient: 'from-brand/20 via-amber-500/20 to-rose-500/20'
  },
  {
    id: 39,
    title: "An Infinite Love Story",
    date: "Forever & Ever",
    caption: "To infinity and beyond",
    note: "21 years down, forever to go. This is only chapter one of the greatest love story ever told.",
    category: 'wishes',
    sticker: 'heart',
    rotation: -3,
    gradient: 'from-rose-500/20 via-pink-500/20 to-purple-500/20'
  },
  {
    id: 40,
    title: "Happy Birthday, My Universe 💖",
    date: "02-09-2026",
    caption: "Forever your Jay ☃︎",
    note: "I love you crororororoor times. Happy 21st Birthday, my Goluuu, my Besan ka Ladduuu, my life! 🥹✨",
    category: 'wishes',
    sticker: 'sunflower',
    rotation: 3,
    gradient: 'from-pink-500/20 via-rose-500/20 to-brand/20'
  }
];

export function HangingPolaroidsGallery() {
  const { theme } = useApp();
  const [selectedPolaroid, setSelectedPolaroid] = useState<PolaroidMemory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Split into 5 visual rope waves (8 Polaroids each for a total of 40)
  const filteredMemories = activeCategory === 'all' 
    ? INITIAL_POLAROIDS 
    : INITIAL_POLAROIDS.filter(m => m.category === activeCategory);

  const waveChunks = [
    { title: "Chapter 1: The First Spark & Mystery 👒", memories: filteredMemories.slice(0, 8) },
    { title: "Chapter 2: Inside Jokes, Habits & Giggles 😂", memories: filteredMemories.slice(8, 16) },
    { title: "Chapter 3: The 2:00 PM Calls & Sweet Days 📞", memories: filteredMemories.slice(16, 24) },
    { title: "Chapter 4: Future Farmhouse & World Travels 🏡✈️", memories: filteredMemories.slice(24, 32) },
    { title: "Chapter 5: 21st Birthday & Eternal Love 🎂💖", memories: filteredMemories.slice(32, 40) },
  ].filter(chunk => chunk.memories.length > 0);

  const renderSticker = (sticker?: string) => {
    switch (sticker) {
      case 'heart':
        return <span className="text-sm select-none">💖</span>;
      case 'sunflower':
        return <span className="text-sm select-none">🌻</span>;
      case 'lily':
        return <span className="text-sm select-none">🌸</span>;
      case 'star':
        return <span className="text-sm select-none">⭐</span>;
      case 'luffy':
        return <span className="text-sm select-none">👒</span>;
      case 'strawberry':
        return <span className="text-sm select-none">🍓</span>;
      case 'tape':
        return (
          <div className="w-8 h-3 bg-pink-300/60 dark:bg-pink-400/40 border border-white/30 backdrop-blur-sm -rotate-6 shadow-sm rounded-sm" />
        );
      default:
        return <span className="text-sm select-none">✨</span>;
    }
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto py-16 px-2 sm:px-6 overflow-hidden">
      
      {/* Section Anchor Header */}
      <div className="text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-4 shadow-sm"
        >
          <Camera className="w-4 h-4" />
          <span>Scroll for Our Memories</span>
          <Sparkles className="w-4 h-4" />
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
          className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed mb-8"
        >
          40 handpicked memories, inside jokes, and dreams hanging softly on twinkling ropes. Click any Polaroid to open its full story! 💖
        </motion.p>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {[
            { id: 'all', label: 'All 40 Polaroids 🎞️' },
            { id: 'origins', label: 'Origins & Confession 👒' },
            { id: 'habits', label: 'Inside Jokes & Habits 😂' },
            { id: 'calls', label: 'Daily Calls & Moments 📞' },
            { id: 'dreams', label: 'Farmhouse & Dreams 🏡' },
            { id: 'wishes', label: '21st Wishes 🎂' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
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

      {/* Progressive Cascading Rope Waves */}
      <div className="space-y-28 relative">
        {waveChunks.map((chunk, waveIdx) => (
          <motion.div
            key={waveIdx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {/* Wave Chapter Badge */}
            <div className="flex items-center gap-3 mb-6 px-4">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs sm:text-sm font-display font-bold text-brand bg-card/80 px-4 py-1 rounded-full border border-border/80 shadow-sm backdrop-blur-md">
                {chunk.title}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Rope Line with Blinking Fairy Light Bulbs */}
            <div className="relative w-full h-12 flex items-center justify-center pointer-events-none">
              {/* Primary Catenary Curved Rope SVG */}
              <svg className="absolute w-full h-16 top-0 left-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 40">
                {/* Shadow Rope */}
                <path
                  d="M 0 10 Q 300 35, 600 20 T 1200 15"
                  fill="transparent"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="4"
                />
                {/* Main Hemp Rope */}
                <path
                  d="M 0 8 Q 300 33, 600 18 T 1200 13"
                  fill="transparent"
                  stroke={theme.includes('light') ? '#8b5a2b' : '#c49a6c'}
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {/* Secondary Intersecting Accent String */}
                <path
                  d="M 0 25 Q 400 5, 800 28 T 1200 10"
                  fill="transparent"
                  stroke={theme.includes('light') ? 'rgba(139,90,43,0.4)' : 'rgba(196,154,108,0.35)'}
                  strokeWidth="1.5"
                />
              </svg>

              {/* Twinkling Fairy Lights Spaced Across the Rope */}
              <div className="absolute inset-x-0 top-1 flex justify-around px-4 sm:px-12 pointer-events-none">
                {[...Array(14)].map((_, lightIdx) => {
                  const delay = (lightIdx * 0.35) % 2.5;
                  const isYellow = lightIdx % 2 === 0;
                  return (
                    <div key={lightIdx} className="relative flex flex-col items-center">
                      {/* Socket / Wire Clip */}
                      <div className="w-1.5 h-2 bg-amber-950/80 rounded-t-sm" />
                      {/* Glowing Light Bulb */}
                      <motion.div
                        animate={{
                          opacity: [0.35, 1, 0.45, 0.9, 0.35],
                          scale: [0.85, 1.25, 0.9, 1.15, 0.85],
                        }}
                        transition={{
                          duration: 2.2 + (lightIdx % 3) * 0.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: delay
                        }}
                        className={cn(
                          "w-3 h-4 rounded-full shadow-lg transition-colors",
                          isYellow 
                            ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" 
                            : "bg-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.9)]"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Polaroids Row Hanging from Clothespins (Bigger, Wider Frame) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pt-4 px-2 sm:px-4">
              {chunk.memories.map((item, itemIdx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (itemIdx % 4) * 0.1 }}
                  whileHover={{ 
                    scale: 1.06, 
                    rotate: 0, 
                    zIndex: 40,
                    transition: { duration: 0.2 } 
                  }}
                  onClick={() => setSelectedPolaroid(item)}
                  style={{ rotate: `${item.rotation}deg` }}
                  className="group relative cursor-pointer select-none"
                >
                  {/* Wooden Clothespin / Peg on Top */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="w-3.5 h-6 bg-[#d4a373] rounded-sm border border-[#a77444] shadow-md relative">
                      {/* Metal Spring Wire Clip */}
                      <div className="absolute top-2 left-0 right-0 h-1 bg-zinc-400 border-y border-zinc-600 shadow-inner" />
                    </div>
                  </div>

                  {/* Polaroid Frame (Wider and More Spacious) */}
                  <div className="bg-[#fefefe] dark:bg-[#1a1a1e] border border-black/10 dark:border-white/10 rounded-2xl p-3 sm:p-4 pb-5 sm:pb-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between">
                    
                    {/* Photo Container (Wider aspect-[4/3] to prevent sides from cutting out) */}
                    <div className={cn(
                      "relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br transition-all group-hover:brightness-105",
                      item.gradient
                    )}>
                      {/* Corner Sticker */}
                      <div className="absolute top-1.5 right-1.5 z-20">
                        {renderSticker(item.sticker)}
                      </div>

                      {/* Memory Number Badge */}
                      <div className="absolute top-1.5 left-1.5 z-20 px-2 py-0.5 rounded-full bg-black/50 text-white font-mono text-[10px] font-bold backdrop-blur-sm">
                        #{item.id}
                      </div>

                      {/* Photo Content / Placeholder Art or Real Image */}
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-foreground">
                          <span className="text-3xl sm:text-4xl mb-1.5 group-hover:scale-110 transition-transform">
                            {item.sticker === 'sunflower' ? '🌻' : item.sticker === 'lily' ? '🌸' : item.sticker === 'luffy' ? '👒' : '💖'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-display font-black leading-tight max-w-full line-clamp-2 drop-shadow-sm text-foreground">
                            {item.title}
                          </h4>
                        </div>
                      )}
                    </div>

                    {/* Polaroid Bottom Chin with Handwritten Caption & Date */}
                    <div className="pt-2.5 sm:pt-3 text-center">
                      <p className="text-xs sm:text-sm font-serif italic text-zinc-800 dark:text-zinc-200 font-semibold truncate px-1">
                        "{item.caption}"
                      </p>
                      <span className="inline-block text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {item.date}
                      </span>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal when Polaroid is Clicked */}
      <AnimatePresence>
        {selectedPolaroid && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            
            {/* Modal Backdrop Click to Close */}
            <div 
              onClick={() => setSelectedPolaroid(null)} 
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative max-w-md w-full bg-[#fefefe] dark:bg-[#141416] border border-black/10 dark:border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPolaroid(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 text-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer z-30"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Polaroid Header Photo */}
              <div className={cn(
                "w-full aspect-[4/3] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br relative mb-5",
                selectedPolaroid.gradient
              )}>
                {/* Big Sticker */}
                <div className="absolute top-3 right-3 text-2xl">
                  {renderSticker(selectedPolaroid.sticker)}
                </div>

                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl mb-2 shadow-inner">
                  {selectedPolaroid.sticker === 'sunflower' ? '🌻' : selectedPolaroid.sticker === 'lily' ? '🌸' : selectedPolaroid.sticker === 'luffy' ? '👒' : '💖'}
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-black text-foreground drop-shadow-sm">
                  {selectedPolaroid.title}
                </h3>
                <span className="text-xs font-mono text-foreground/80 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedPolaroid.date}
                </span>
              </div>

              {/* Memory Story Text */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand font-bold text-xs">
                  <Heart className="w-4 h-4 fill-current text-pink-500" />
                  <span>Memory #{selectedPolaroid.id} of 40</span>
                </div>

                <p className="text-sm sm:text-base font-serif italic text-foreground leading-relaxed">
                  "{selectedPolaroid.caption}"
                </p>

                {selectedPolaroid.note && (
                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans shadow-inner">
                    <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-1">A Note From Jay ✍️</p>
                    {selectedPolaroid.note}
                  </div>
                )}
              </div>

              {/* Modal Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
                <button
                  onClick={() => {
                    const prevIdx = (selectedPolaroid.id - 2 + INITIAL_POLAROIDS.length) % INITIAL_POLAROIDS.length;
                    setSelectedPolaroid(INITIAL_POLAROIDS[prevIdx]);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:border-brand/40 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>

                <span className="text-xs font-mono text-muted-foreground">
                  {selectedPolaroid.id} / 40
                </span>

                <button
                  onClick={() => {
                    const nextIdx = selectedPolaroid.id % INITIAL_POLAROIDS.length;
                    setSelectedPolaroid(INITIAL_POLAROIDS[nextIdx]);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:border-brand/40 flex items-center gap-1 cursor-pointer transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
