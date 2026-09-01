import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, CheckCircle2, Circle, Edit3, MessageSquare, Award, Feather, Stamp, RotateCcw, Lightbulb, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { CuteHeart, CuteRing, CuteSunflower, CuteSakura, CuteCoffeeTea, CuteStar, CuteSparkles, CutePinkyPromise } from './CuteIcons';

export interface BlankPromiseSlot {
  id: string;
  slotNumber: number;
  author: 'jay' | 'divu';
  text: string;
  category: string;
  emoji: string;
  isKept: boolean;
  notes?: string;
  lastUpdated?: string;
}

const IDEA_SPARKS = [
  { author: 'jay', title: 'Daily Devotion', emoji: 'heart', text: 'Never let a day pass without telling you how loved, cherished, and gorgeous you are.' },
  { author: 'jay', title: 'Career & Exams', emoji: 'ring', text: 'Back your government officer exam prep 10,000%—making tea and testing your notes.' },
  { author: 'jay', title: 'Emotional Shelter', emoji: 'pinky', text: 'Always listen before speaking and comfort you whenever stress gets heavy.' },
  { author: 'jay', title: 'Midnight Treats', emoji: 'sunflower', text: 'Surprise you with fresh sunflowers, sweet treats, and late-night movie dates.' },
  { author: 'jay', title: 'Never Sleep Mad', emoji: 'tea', text: 'Never sleep on an unresolved argument or leave your cute messages unread.' },
  { author: 'jay', title: 'Infinite Patience', emoji: 'star', text: 'Be endlessly patient with mood swings and pamper you with forehead kisses.' },
  { author: 'divu', title: 'Open Communication', emoji: 'sakura', text: 'Share my deepest worries and silly thoughts directly instead of overthinking alone.' },
  { author: 'divu', title: 'Warm Hugs Rule', emoji: 'pinky', text: 'Never stay mad for more than 10 minutes without asking for a warm comforting hug.' },
  { author: 'divu', title: 'Self-Care & Sleep', emoji: 'heart', text: 'Drink water, sleep on time during exam prep, and take good care of my health.' },
  { author: 'divu', title: 'Cheerleader', emoji: 'star', text: 'Always be your number one cheerleader, celebrating all your coding & life wins.' },
  { author: 'divu', title: 'Random Cuties', emoji: 'sunflower', text: 'Send you cute random selfies, outfit reviews, and honest review ratings!' },
  { author: 'divu', title: 'Vulnerability', emoji: 'tea', text: 'Let you pamper me when I am tired and never bottle up my emotions.' },
];

const STORAGE_KEY = 'cv_custom_promises_2026';
const SEAL_STORAGE_KEY = 'cv_custom_promises_sealed_2026';

function renderCuteVowIcon(iconKey: string, author: 'jay' | 'divu') {
  switch (iconKey) {
    case 'ring':
    case '💍':
      return <CuteRing className="w-4 h-4 text-amber-500" />;
    case 'heart':
    case '💖':
      return <CuteHeart className="w-4 h-4 text-pink-500" />;
    case 'flower':
    case 'sakura':
    case '🌸':
      return <CuteSakura className="w-4 h-4 text-pink-400" />;
    case 'sunflower':
    case '🌻':
      return <CuteSunflower className="w-4 h-4 text-amber-400" />;
    case 'tea':
    case 'coffee':
    case '☕':
      return <CuteCoffeeTea className="w-4 h-4 text-amber-600" />;
    case 'pinky':
    case '🤝':
    case '🫂':
      return <CutePinkyPromise className="w-4 h-4 text-rose-400" />;
    case 'star':
    case '✨':
    case '⭐':
      return <CuteStar className="w-4 h-4 text-yellow-400" />;
    default:
      return author === 'jay' ? <CuteRing className="w-4 h-4 text-blue-400" /> : <CuteSakura className="w-4 h-4 text-pink-400" />;
  }
}

function createDefaultSlots(): BlankPromiseSlot[] {
  const slots: BlankPromiseSlot[] = [];
  for (let i = 1; i <= 10; i++) {
    slots.push({
      id: `jay-slot-${i}`,
      slotNumber: i,
      author: 'jay',
      text: '',
      category: 'Unwritten Vow',
      emoji: 'ring',
      isKept: false,
    });
  }
  for (let i = 1; i <= 10; i++) {
    slots.push({
      id: `divu-slot-${i}`,
      slotNumber: i,
      author: 'divu',
      text: '',
      category: 'Unwritten Vow',
      emoji: 'sakura',
      isKept: false,
    });
  }
  return slots;
}

export function YearlyPromisesNotebookSection() {
  const [slots, setSlots] = useState<BlankPromiseSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 20) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return createDefaultSlots();
  });

  const [isSealed, setIsSealed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SEAL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'both' | 'jay' | 'divu'>('both');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [showIdeaSparks, setShowIdeaSparks] = useState(false);
  const [showSealEffect, setShowSealEffect] = useState(false);

  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editEmoji, setEditEmoji] = useState('heart');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch {
      // ignore
    }
  }, [slots]);

  const handleStartEdit = (slot: BlankPromiseSlot) => {
    setEditingSlotId(slot.id);
    setEditText(slot.text);
    setEditCategory(slot.category === 'Unwritten Vow' ? '' : slot.category);
    setEditEmoji(slot.emoji || (slot.author === 'jay' ? 'ring' : 'sakura'));
  };

  const handleSaveEdit = (slotId: string) => {
    setSlots(prev =>
      prev.map(s =>
        s.id === slotId
          ? {
              ...s,
              text: editText.trim(),
              category: editCategory.trim() || (s.author === 'jay' ? "Jay's Sacred Vow" : "Divu's Sweet Vow"),
              emoji: editEmoji,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );
    setEditingSlotId(null);
  };

  const togglePromiseKept = (slotId: string) => {
    setSlots(prev =>
      prev.map(s => (s.id === slotId ? { ...s, isKept: !s.isKept } : s))
    );
  };

  const handleUpdateNote = (slotId: string, notes: string) => {
    setSlots(prev =>
      prev.map(s => (s.id === slotId ? { ...s, notes } : s))
    );
  };

  const handleSealPinkyPromise = () => {
    setShowSealEffect(true);
    setIsSealed(true);
    try {
      localStorage.setItem(SEAL_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setTimeout(() => {
      setShowSealEffect(false);
    }, 2800);
  };

  const handleResetNotebook = () => {
    if (window.confirm('Clear all written promises and start a fresh discussion?')) {
      setSlots(createDefaultSlots());
      setIsSealed(false);
      localStorage.removeItem(SEAL_STORAGE_KEY);
    }
  };

  const jaySlots = slots.filter(s => s.author === 'jay');
  const divuSlots = slots.filter(s => s.author === 'divu');

  const writtenJayCount = jaySlots.filter(s => s.text.trim().length > 0).length;
  const writtenDivuCount = divuSlots.filter(s => s.text.trim().length > 0).length;
  const totalWritten = writtenJayCount + writtenDivuCount;
  const keptCount = slots.filter(s => s.isKept).length;

  return (
    <div className="relative w-full max-w-7xl mx-auto py-16 px-3 sm:px-6 select-none">
      
      {/* Ambient Romantic Background Glows */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[600px] rounded-full blur-[160px] opacity-15 pointer-events-none transition-all duration-700 -z-10"
        style={{ background: 'var(--theme-accent, #e8852a)' }}
      />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-bold mb-4 shadow-md backdrop-blur-md"
        >
          <BookOpen className="w-4 h-4 text-pink-500 animate-bounce" />
          <span>Section 9 • Live Sacred Promise Journal</span>
          <CuteHeart className="w-4 h-4" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-foreground tracking-tight leading-tight mb-4"
        >
          Our <span className="bg-gradient-to-r from-brand via-pink-500 to-brand bg-clip-text text-transparent">2026–2027</span> Promise Notebook 📖✍️
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed"
        >
          An open diary waiting for our words. We will sit, talk, discuss, and write 10 promises each for the year we will spend together! Click on any line below to write your vow. 💖
        </motion.p>

        {/* Counter & Action Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <div className="px-4 py-1.5 rounded-full glass border border-white/10 text-xs font-mono font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
            <span>{totalWritten} of 20 Vows Written ✍️</span>
          </div>

          {totalWritten > 0 && (
            <div className="px-4 py-1.5 rounded-full glass border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{keptCount} Honored</span>
            </div>
          )}

          {isSealed ? (
            <div className="px-4 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-400 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5 text-pink-500" />
              <span>Pinky Pact Sealed with Love 💍</span>
            </div>
          ) : (
            <button
              onClick={handleSealPinkyPromise}
              className="px-4 py-1.5 rounded-full bg-brand text-background text-xs font-bold font-display shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Seal Our Pinky Promise 🤝</span>
            </button>
          )}

          <button
            onClick={() => setShowIdeaSparks(!showIdeaSparks)}
            className="px-4 py-1.5 rounded-full glass border border-amber-500/30 hover:border-amber-500 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showIdeaSparks ? 'Hide Sparks' : 'Prompt Sparks 💡'}</span>
          </button>
        </div>
      </div>

      {/* Idea Sparks Drawer */}
      <AnimatePresence>
        {showIdeaSparks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-5xl mx-auto mb-8 rounded-2xl p-4 sm:p-6 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Need Inspiration While Discussing? Click any prompt idea:</span>
              </div>
              <button
                onClick={() => setShowIdeaSparks(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {IDEA_SPARKS.map((spark, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-card/70 border border-border hover:border-brand/50 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1 font-bold">
                    <span className="flex items-center gap-1.5">
                      {renderCuteVowIcon(spark.emoji, spark.author as 'jay' | 'divu')}
                      <span className={spark.author === 'jay' ? 'text-blue-400' : 'text-pink-400'}>
                        {spark.title}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {spark.author === 'jay' ? 'Jay' : 'Divu'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                    "{spark.text}"
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Switcher Tabs (For Mobile/Tablet) */}
      <div className="flex items-center justify-center gap-2 mb-8 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('both')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border",
            activeTab === 'both'
              ? "bg-brand text-background border-brand shadow-md"
              : "glass border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          📖 Open Book Spread
        </button>
        <button
          onClick={() => setActiveTab('jay')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5",
            activeTab === 'jay'
              ? "bg-blue-500 text-white border-blue-500 shadow-md"
              : "glass border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          <CuteRing className="w-3.5 h-3.5" />
          <span>Jay's Page ({writtenJayCount}/10)</span>
        </button>
        <button
          onClick={() => setActiveTab('divu')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5",
            activeTab === 'divu'
              ? "bg-pink-500 text-white border-pink-500 shadow-md"
              : "glass border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          <CuteSakura className="w-3.5 h-3.5" />
          <span>Divu's Page ({writtenDivuCount}/10)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* THE MAIN LEATHER-BOUND DUAL-PAGE NOTEBOOK SPREAD                          */}
      {/* ========================================================================= */}
      <div className="relative max-w-6xl mx-auto rounded-[32px] p-3 sm:p-6 md:p-8 bg-[#1e1713] dark:bg-[#12100e] border-4 border-[#3a2c22] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Leather Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-stone-900/60 to-black pointer-events-none" />
        
        {/* Golden Bookmark Ribbon */}
        <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-5 h-28 bg-gradient-to-b from-brand via-pink-500 to-rose-600 shadow-lg z-30 rounded-b-md pointer-events-none" />

        {/* Notebook Inner Spread */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 rounded-2xl bg-[#faf7f2] dark:bg-[#181614] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8 shadow-inner border border-stone-300 dark:border-stone-800">
          
          {/* Spine Shadow */}
          <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-stone-400/20 via-black/30 to-stone-400/20 pointer-events-none z-20" />

          {/* LEFT PAGE: JAY'S 10 PROMISES */}
          {(activeTab === 'both' || activeTab === 'jay') && (
            <div className="relative flex flex-col justify-between pr-0 lg:pr-4">
              <div>
                <div className="border-b-2 border-stone-300 dark:border-stone-700 pb-4 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 font-bold shadow-inner">
                      <CuteRing className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400 block">
                        Left Side • 10 Vows
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">
                        Jay's 10 Promises to Divu
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {writtenJayCount}/10 Written
                  </span>
                </div>

                <p className="text-xs italic text-stone-600 dark:text-stone-400 font-serif mb-6 leading-relaxed bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
                  "Discussed and written with all my heart for my angel Divyanshi." — Jay 💙
                </p>

                <div className="space-y-3">
                  {jaySlots.map((slot) => (
                    <EditableSlotRow
                      key={slot.id}
                      slot={slot}
                      accent="blue"
                      isEditing={editingSlotId === slot.id}
                      editText={editText}
                      editCategory={editCategory}
                      editEmoji={editEmoji}
                      onStartEdit={() => handleStartEdit(slot)}
                      onCancelEdit={() => setEditingSlotId(null)}
                      onSaveEdit={() => handleSaveEdit(slot.id)}
                      onTextChange={setEditText}
                      onCategoryChange={setEditCategory}
                      onEmojiChange={setEditEmoji}
                      onToggleKept={() => togglePromiseKept(slot.id)}
                      isExpandedNote={expandedNoteId === slot.id}
                      onToggleNote={() => setExpandedNoteId(expandedNoteId === slot.id ? null : slot.id)}
                      onUpdateNote={(note) => handleUpdateNote(slot.id, note)}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-stone-300 dark:border-stone-800 mt-8 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span className="flex items-center gap-1">
                  <Feather className="w-3.5 h-3.5 text-blue-500" /> Jay's Vows • 2026–2027
                </span>
                <span>Page 01 of 02</span>
              </div>
            </div>
          )}

          {/* RIGHT PAGE: DIVU'S 10 PROMISES */}
          {(activeTab === 'both' || activeTab === 'divu') && (
            <div className="relative flex flex-col justify-between pl-0 lg:pl-4 mt-8 lg:mt-0">
              <div>
                <div className="border-b-2 border-stone-300 dark:border-stone-700 pb-4 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500 font-bold shadow-inner">
                      <CuteSakura className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-pink-600 dark:text-pink-400 block">
                        Right Side • 10 Vows
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display font-black text-foreground">
                        Divu's 10 Promises to Jay
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {writtenDivuCount}/10 Written
                  </span>
                </div>

                <p className="text-xs italic text-stone-600 dark:text-stone-400 font-serif mb-6 leading-relaxed bg-pink-500/5 p-2.5 rounded-lg border border-pink-500/10">
                  "Promised with all my love, laughter, and future dreams for us." — Divu 💖
                </p>

                <div className="space-y-3">
                  {divuSlots.map((slot) => (
                    <EditableSlotRow
                      key={slot.id}
                      slot={slot}
                      accent="pink"
                      isEditing={editingSlotId === slot.id}
                      editText={editText}
                      editCategory={editCategory}
                      editEmoji={editEmoji}
                      onStartEdit={() => handleStartEdit(slot)}
                      onCancelEdit={() => setEditingSlotId(null)}
                      onSaveEdit={() => handleSaveEdit(slot.id)}
                      onTextChange={setEditText}
                      onCategoryChange={setEditCategory}
                      onEmojiChange={setEditEmoji}
                      onToggleKept={() => togglePromiseKept(slot.id)}
                      isExpandedNote={expandedNoteId === slot.id}
                      onToggleNote={() => setExpandedNoteId(expandedNoteId === slot.id ? null : slot.id)}
                      onUpdateNote={(note) => handleUpdateNote(slot.id, note)}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-stone-300 dark:border-stone-800 mt-8 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span className="flex items-center gap-1">
                  <CuteHeart className="w-3.5 h-3.5" /> Divu's Vows • 2026–2027
                </span>
                <span>Page 02 of 02</span>
              </div>
            </div>
          )}

        </div>

        {/* Notebook Bottom Action Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono">
          <button
            onClick={handleResetNotebook}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / Clear Notebook</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIdeaSparks(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Prompt Ideas 💡</span>
            </button>
            <button
              onClick={handleSealPinkyPromise}
              className="px-5 py-2 rounded-xl bg-brand hover:opacity-95 text-background font-display font-black shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Stamp className="w-4 h-4" />
              <span>{isSealed ? 'Pinky Pact Sealed 💖' : 'Seal Our 20 Vows ✨'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Seal Modal */}
      <AnimatePresence>
        {showSealEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-md bg-card border-2 border-brand rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(232,133,42,0.6)] relative overflow-hidden"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center mb-4 shadow-lg animate-bounce">
                <CuteHeart className="w-10 h-10" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
                Pinky Pact Sealed! 🤝💖
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-serif">
                "Our sacred promises for 2026–2027 are officially etched into eternity. Here's to love, patience, laughter, and conquering every goal together, my angel!"
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand font-mono font-bold text-xs mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Certified on 2nd September 2026</span>
              </div>

              <button
                onClick={() => setShowSealEffect(false)}
                className="w-full py-3 bg-brand text-background font-display font-black rounded-xl text-sm hover:opacity-95 transition-all shadow-md cursor-pointer"
              >
                Cherish Our Promises 💖
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ========================================================================= */
/* INDIVIDUAL EDITABLE SLOT ROW                                              */
/* ========================================================================= */
interface EditableSlotRowProps {
  slot: BlankPromiseSlot;
  accent: 'blue' | 'pink';
  isEditing: boolean;
  editText: string;
  editCategory: string;
  editEmoji: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTextChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onEmojiChange: (val: string) => void;
  onToggleKept: () => void;
  isExpandedNote: boolean;
  onToggleNote: () => void;
  onUpdateNote: (note: string) => void;
}

function EditableSlotRow({
  slot,
  accent,
  isEditing,
  editText,
  editCategory,
  editEmoji,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTextChange,
  onCategoryChange,
  onEmojiChange,
  onToggleKept,
  isExpandedNote,
  onToggleNote,
  onUpdateNote,
}: EditableSlotRowProps) {
  const hasContent = slot.text.trim().length > 0;
  const [noteInput, setNoteInput] = useState(slot.notes || '');

  const SVG_OPTIONS: Array<{ key: string; icon: React.ReactNode }> = [
    { key: 'heart', icon: <CuteHeart className="w-4 h-4" /> },
    { key: 'ring', icon: <CuteRing className="w-4 h-4" /> },
    { key: 'sakura', icon: <CuteSakura className="w-4 h-4" /> },
    { key: 'sunflower', icon: <CuteSunflower className="w-4 h-4" /> },
    { key: 'tea', icon: <CuteCoffeeTea className="w-4 h-4" /> },
    { key: 'star', icon: <CuteStar className="w-4 h-4" /> },
    { key: 'pinky', icon: <CutePinkyPromise className="w-4 h-4" /> },
  ];

  if (isEditing) {
    return (
      <div
        className={cn(
          "rounded-xl p-3 sm:p-4 border-2 transition-all shadow-md",
          accent === 'blue'
            ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-500"
            : "bg-pink-50/90 dark:bg-pink-950/40 border-pink-500"
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            ✍️ Editing Promise #{slot.slotNumber}
          </span>
          <div className="flex items-center gap-1">
            {SVG_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onEmojiChange(opt.key)}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all p-1",
                  editEmoji === opt.key ? "bg-white dark:bg-black shadow scale-110 border border-brand" : "hover:bg-white/40 dark:hover:bg-white/10"
                )}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={editText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Write vow #${slot.slotNumber} here (e.g. Promise to always...)...`}
          rows={2}
          autoFocus
          className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand mb-2"
        />

        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={editCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="Category tag (e.g. Care, Habits, Dreams)"
            className="p-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 flex-1"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelEdit}
              className="px-2.5 py-1 text-xs rounded-lg glass border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={onSaveEdit}
              className="px-3 py-1 text-xs rounded-lg bg-brand text-background font-bold shadow-sm hover:opacity-95 cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save Vow
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl p-2.5 sm:p-3 border transition-all duration-300",
        slot.isKept
          ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm"
          : hasContent
          ? "bg-white/80 dark:bg-stone-900/70 border-stone-200 dark:border-stone-800 hover:border-brand/40 shadow-sm"
          : "bg-stone-100/60 dark:bg-stone-900/30 border-dashed border-stone-300 dark:border-stone-800 hover:border-brand/40"
      )}
    >
      <div className="flex items-start gap-2.5">
        {hasContent ? (
          <button
            onClick={onToggleKept}
            className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
            title={slot.isKept ? "Mark as in-progress" : "Mark as Honored & Kept"}
          >
            {slot.isKept ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle className="w-4 h-4 text-stone-400 hover:text-brand transition-colors" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 mt-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-[9px] font-mono font-bold flex items-center justify-center text-stone-500 shrink-0">
            {slot.slotNumber}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              {renderCuteVowIcon(slot.emoji, slot.author)}
              <span className={cn(
                "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                accent === 'blue'
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-pink-500/15 text-pink-600 dark:text-pink-400"
              )}>
                {slot.category}
              </span>
            </div>

            <button
              onClick={onStartEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-brand hover:underline flex items-center gap-1 cursor-pointer font-mono font-bold"
            >
              <Edit3 className="w-2.5 h-2.5" />
              <span>{hasContent ? 'Edit' : 'Write'}</span>
            </button>
          </div>

          {hasContent ? (
            <p
              onClick={onStartEdit}
              className={cn(
                "text-xs sm:text-sm font-medium leading-relaxed font-sans cursor-pointer",
                slot.isKept
                  ? "text-stone-600 dark:text-stone-400 line-through decoration-emerald-500/60"
                  : "text-stone-900 dark:text-stone-100"
              )}
            >
              {slot.text}
            </p>
          ) : (
            <p
              onClick={onStartEdit}
              className="text-xs italic text-stone-400 dark:text-stone-500 cursor-pointer hover:text-brand transition-colors font-serif py-0.5 flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3 text-stone-400" />
              <span>Slot #{slot.slotNumber}: Click to write our vow...</span>
            </p>
          )}

          {hasContent && (
            <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 font-mono">
              <button
                onClick={onToggleNote}
                className="hover:text-brand transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{slot.notes ? 'View Notes 💬' : 'Add Note +'}</span>
              </button>

              {slot.isKept && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[9px]">
                  <CuteSparkles className="w-2.5 h-2.5" /> Honored
                </span>
              )}
            </div>
          )}

          <AnimatePresence>
            {isExpandedNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800"
              >
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onBlur={() => onUpdateNote(noteInput)}
                  placeholder="Write thoughts, cute memories, or discussions about this vow..."
                  rows={2}
                  className="w-full p-2 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <div className="text-[9px] text-stone-400 text-right mt-0.5">
                  (Auto-saved on blur)
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
