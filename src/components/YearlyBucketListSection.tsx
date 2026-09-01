import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, CheckCircle2, Circle, Plus, Trash2, Edit3, MessageSquare, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { CuteHeart, CutePlane, CuteCoffeeTea, CuteBookMilestone, CuteGift, CuteStar, CuteSparkles } from './CuteIcons';

export interface BucketListItem {
  id: string;
  number: number;
  title: string;
  category: 'travel' | 'food' | 'dates' | 'growth' | 'dreams';
  targetDate?: string;
  location?: string;
  isCompleted: boolean;
  notes?: string;
  dateCompleted?: string;
}

const BUCKET_SPARKS = [
  { category: 'travel' as const, title: 'Watch sunrise together from a hilltop with hot chai 🌄☕', location: 'Hill Station' },
  { category: 'travel' as const, title: 'Take our dream snow vacation to Kashmir or Manali ❄️🏔️', location: 'Mountains' },
  { category: 'food' as const, title: 'Cook a 3-course Italian dinner together from scratch 🍝🍕', location: 'At Home' },
  { category: 'food' as const, title: 'Explore the 5 best cozy dessert cafes in the city 🍰🍨', location: 'City Cafes' },
  { category: 'dates' as const, title: 'Binge-watch all Studio Ghibli anime on CineVault with fairy lights 🎬🏮', location: 'CineVault Room' },
  { category: 'dates' as const, title: 'Late-night stargazing picnic with soft acoustic music 🌌✨', location: 'Open Park' },
  { category: 'growth' as const, title: 'Celebrate clearing Divu\'s government officer exam with a grand feast 📚👑', location: 'Celebration Feast' },
  { category: 'growth' as const, title: 'Read and discuss one uplifting book together every season 📖🤍', location: 'Study Corner' },
  { category: 'dreams' as const, title: 'Pick out our matching engraved promise rings 💍💫', location: 'Jewelry Studio' },
  { category: 'dreams' as const, title: 'Design the blueprint of our future dream farmhouse 🏡🌿', location: 'Dream Journal' },
];

const INITIAL_BUCKET_ITEMS: BucketListItem[] = [
  {
    id: 'bl-1',
    number: 1,
    title: 'Sunrise hill date with warm thermos chai & blankets',
    category: 'dates',
    location: 'Scenic Viewpoint',
    isCompleted: false,
  },
  {
    id: 'bl-2',
    number: 2,
    title: 'Celebrate Divu crushing her government officer exams',
    category: 'growth',
    location: 'Victory Dinner',
    isCompleted: false,
  },
  {
    id: 'bl-3',
    number: 3,
    title: 'Weekend getaway to snow mountains & pine forests',
    category: 'travel',
    location: 'Manali / Kashmir',
    isCompleted: false,
  },
  {
    id: 'bl-4',
    number: 4,
    title: 'Cook homemade pasta & baked cheesecake together',
    category: 'food',
    location: 'Our Cozy Kitchen',
    isCompleted: false,
  },
  {
    id: 'bl-5',
    number: 5,
    title: 'All-night CineVault anime marathon under cozy fairy lights',
    category: 'dates',
    location: 'Starlight Theater',
    isCompleted: false,
  },
  {
    id: 'bl-6',
    number: 6,
    title: 'Wear matching couple hoodies on an outdoor date',
    category: 'dates',
    location: 'City Walk',
    isCompleted: false,
  },
  {
    id: 'bl-7',
    number: 7,
    title: 'Plant a little sunflower pot together and watch it bloom',
    category: 'dreams',
    location: 'Balcony Garden',
    isCompleted: false,
  },
  {
    id: 'bl-8',
    number: 8,
    title: 'Visit an amusement park and hold hands on the big Ferris wheel',
    category: 'travel',
    location: 'Theme Park',
    isCompleted: false,
  },
  {
    id: 'bl-9',
    number: 9,
    title: 'Midnight ice cream drive when the whole city is asleep',
    category: 'food',
    location: 'Midnight Gelato Spot',
    isCompleted: false,
  },
  {
    id: 'bl-10',
    number: 10,
    title: 'Frame our favorite couple Polaroid from this birthday vault',
    category: 'dreams',
    location: 'Bedside Table',
    isCompleted: false,
  },
  {
    id: 'bl-11',
    number: 11,
    title: 'Surprise each other with handmade gifts & written letters',
    category: 'dates',
    location: 'Special Anniversary',
    isCompleted: false,
  },
  {
    id: 'bl-12',
    number: 12,
    title: 'Spend a whole rainy afternoon listening to our 18 mixtape tracks',
    category: 'dates',
    location: 'Window Seat',
    isCompleted: false,
  },
  {
    id: 'bl-13',
    number: 13,
    title: 'Take a spontaneous road trip with windows down singing loudly',
    category: 'travel',
    location: 'Highway Sunset',
    isCompleted: false,
  },
  {
    id: 'bl-14',
    number: 14,
    title: 'Complete our 2026-2027 Promise Diary goals with 100% devotion',
    category: 'growth',
    location: 'Our Sacred Pact',
    isCompleted: false,
  },
  {
    id: 'bl-15',
    number: 15,
    title: 'Try 5 street food specialties we have never tasted before',
    category: 'food',
    location: 'Food Street Market',
    isCompleted: false,
  },
  {
    id: 'bl-16',
    number: 16,
    title: 'Go shopping and pick out each other\'s complete dinner date outfits',
    category: 'dates',
    location: 'Shopping Mall',
    isCompleted: false,
  },
  {
    id: 'bl-17',
    number: 17,
    title: 'Make a full scrapbook album of our 21st year adventures',
    category: 'dreams',
    location: 'Memory Scrapbook',
    isCompleted: false,
  },
  {
    id: 'bl-18',
    number: 18,
    title: 'Have a peaceful sunset walk by a calm lakeside holding hands',
    category: 'travel',
    location: 'Lakeside Promenade',
    isCompleted: false,
  },
  {
    id: 'bl-19',
    number: 19,
    title: 'Celebrate our next anniversary with an unforgettable surprise',
    category: 'growth',
    location: 'Candlelight Dinner',
    isCompleted: false,
  },
  {
    id: 'bl-20',
    number: 20,
    title: 'Write our 2030 Time Capsule letters together',
    category: 'dreams',
    location: 'Secret Time Box',
    isCompleted: false,
  },
  {
    id: 'bl-21',
    number: 21,
    title: 'Step into her 22nd year more deeply in love than ever before',
    category: 'dreams',
    location: 'Forever in My Heart',
    isCompleted: false,
  },
];

const STORAGE_KEY = 'cv_bucket_list_2026';

export function YearlyBucketListSection() {
  const [items, setItems] = useState<BucketListItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_BUCKET_ITEMS;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [showSparks, setShowSparks] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Buffer
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState<BucketListItem['category']>('dates');

  // New Item Form
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<BucketListItem['category']>('dates');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const handleStartEdit = (item: BucketListItem) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditLocation(item.location || '');
    setEditCategory(item.category);
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editTitle.trim()) return;
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              title: editTitle.trim(),
              location: editLocation.trim() || undefined,
              category: editCategory,
            }
          : i
      )
    );
    setEditingItemId(null);
  };

  const handleToggleComplete = (itemId: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              isCompleted: !i.isCompleted,
              dateCompleted: !i.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
            }
          : i
      )
    );
  };

  const handleUpdateNote = (itemId: string, notes: string) => {
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, notes } : i))
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: BucketListItem = {
      id: `custom-bl-${Date.now()}`,
      number: items.length + 1,
      title: newTitle.trim(),
      category: newCategory,
      location: newLocation.trim() || undefined,
      isCompleted: false,
    };

    setItems(prev => [...prev, newItem]);
    setNewTitle('');
    setNewLocation('');
    setShowAddModal(false);
  };

  const handleApplySpark = (spark: typeof BUCKET_SPARKS[0]) => {
    const newItem: BucketListItem = {
      id: `custom-bl-${Date.now()}`,
      number: items.length + 1,
      title: spark.title,
      category: spark.category,
      location: spark.location,
      isCompleted: false,
    };
    setItems(prev => [...prev, newItem]);
    setShowSparks(false);
  };

  const completedCount = items.filter(i => i.isCompleted).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(i => i.category === activeCategory);

  const renderCategoryIcon = (category: BucketListItem['category']) => {
    switch (category) {
      case 'travel':
        return <CutePlane className="w-4 h-4 text-sky-400" />;
      case 'food':
        return <CuteCoffeeTea className="w-4 h-4 text-amber-400" />;
      case 'dates':
        return <CuteHeart className="w-4 h-4 text-pink-400" />;
      case 'growth':
        return <CuteBookMilestone className="w-4 h-4 text-emerald-400" />;
      case 'dreams':
      default:
        return <CuteStar className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-16 px-3 sm:px-6 select-none">
      
      {/* Background Ambient Glows */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[160px] opacity-15 pointer-events-none -z-10"
        style={{ background: 'var(--theme-accent, #e8852a)' }}
      />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-4 shadow-sm backdrop-blur-md"
        >
          <Compass className="w-4 h-4 text-brand animate-spin" style={{ animationDuration: '20s' }} />
          <span>Our 2026–2027 Adventure Roadmap</span>
          <CuteSparkles className="w-4 h-4" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-foreground tracking-tight leading-tight mb-4"
        >
          Our <span className="bg-gradient-to-r from-brand via-pink-500 to-brand bg-clip-text text-transparent">21st Year</span> Couple Bucket List 🗺️✨
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed mb-6"
        >
          21 magical adventures and milestones for our 21st year. We can add our own goals, write discussion notes, and check them off together as we live them! 💖
        </motion.p>

        {/* Live Progress Bar & Action Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="px-4 py-2 rounded-full glass border border-white/10 text-xs font-mono font-bold text-foreground flex items-center gap-2.5">
            <div className="w-16 h-2 rounded-full bg-stone-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand to-pink-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{completedCount} of {items.length} Completed ({progressPercent}%)</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-brand text-background text-xs font-display font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Adventure ✍️</span>
          </button>

          <button
            onClick={() => setShowSparks(!showSparks)}
            className="px-4 py-2 rounded-full glass border border-amber-500/30 hover:border-amber-500 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showSparks ? 'Hide Sparks' : 'Adventure Sparks 💡'}</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {[
            { id: 'all', label: 'All 21 Goals', icon: <CuteStar className="w-3.5 h-3.5" /> },
            { id: 'travel', label: 'Trips & Roadtrips', icon: <CutePlane className="w-3.5 h-3.5" /> },
            { id: 'food', label: 'Food & Cooking', icon: <CuteCoffeeTea className="w-3.5 h-3.5" /> },
            { id: 'dates', label: 'Cute Dates', icon: <CuteHeart className="w-3.5 h-3.5" /> },
            { id: 'growth', label: 'Exams & Growth', icon: <CuteBookMilestone className="w-3.5 h-3.5" /> },
            { id: 'dreams', label: 'Future Dreams', icon: <CuteGift className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
                activeCategory === tab.id
                  ? "bg-brand text-background border-brand shadow-md scale-105"
                  : "glass text-foreground/80 hover:text-foreground border-white/10 hover:border-brand/30"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sparks Drawer */}
      <AnimatePresence>
        {showSparks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-4xl mx-auto mb-8 rounded-2xl p-4 sm:p-6 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Click any spark idea to add it directly to your bucket list:</span>
              </div>
              <button
                onClick={() => setShowSparks(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {BUCKET_SPARKS.map((spark, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplySpark(spark)}
                  className="p-3 rounded-xl bg-card/70 border border-border hover:border-brand/50 transition-all cursor-pointer group text-xs flex items-center justify-between gap-2"
                >
                  <p className="font-medium text-foreground group-hover:text-brand transition-colors">
                    {spark.title}
                  </p>
                  <span className="text-[10px] font-mono text-brand shrink-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 21 Bucket List Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {filteredItems.map((item, idx) => (
          <BucketItemCard
            key={item.id}
            item={item}
            displayIndex={idx + 1}
            isEditing={editingItemId === item.id}
            editTitle={editTitle}
            editLocation={editLocation}
            editCategory={editCategory}
            onStartEdit={() => handleStartEdit(item)}
            onCancelEdit={() => setEditingItemId(null)}
            onSaveEdit={() => handleSaveEdit(item.id)}
            onTitleChange={setEditTitle}
            onLocationChange={setEditLocation}
            onCategoryChange={setEditCategory}
            onToggleComplete={() => handleToggleComplete(item.id)}
            isExpandedNote={expandedNoteId === item.id}
            onToggleNote={() => setExpandedNoteId(expandedNoteId === item.id ? null : item.id)}
            onUpdateNote={(note) => handleUpdateNote(item.id, note)}
            onDelete={item.id.startsWith('custom-bl-') ? () => handleDeleteItem(item.id) : undefined}
            renderCategoryIcon={renderCategoryIcon}
          />
        ))}
      </div>

      {/* Add New Adventure Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center text-xl">
                    🗺️
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-black text-foreground">
                      Add a New Adventure
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Write a goal we want to accomplish together in 2026–2027
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold text-foreground block mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BucketListItem['category'])}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="travel">✈️ Trips & Roadtrips</option>
                    <option value="food">🍜 Food & Cooking</option>
                    <option value="dates">💖 Cute Dates</option>
                    <option value="growth">📚 Exams & Career Growth</option>
                    <option value="dreams">🏡 Future Dreams & Life</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-foreground block mb-1.5">
                    Adventure Description
                  </label>
                  <textarea
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Go on a hot air balloon sunrise ride together..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-foreground block mb-1.5">
                    Location / Place (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Jaipur, Mountains, Home"
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl glass border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-brand text-background font-display font-black text-xs hover:opacity-95 shadow-md"
                  >
                    Add to Roadmap 🗺️
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ========================================================================= */
/* BUCKET ITEM CARD COMPONENT                                                */
/* ========================================================================= */
interface BucketItemCardProps {
  item: BucketListItem;
  displayIndex: number;
  isEditing: boolean;
  editTitle: string;
  editLocation: string;
  editCategory: BucketListItem['category'];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTitleChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onCategoryChange: (val: BucketListItem['category']) => void;
  onToggleComplete: () => void;
  isExpandedNote: boolean;
  onToggleNote: () => void;
  onUpdateNote: (note: string) => void;
  onDelete?: () => void;
  renderCategoryIcon: (category: BucketListItem['category']) => React.ReactNode;
}

function BucketItemCard({
  item,
  displayIndex,
  isEditing,
  editTitle,
  editLocation,
  editCategory,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTitleChange,
  onLocationChange,
  onCategoryChange,
  onToggleComplete,
  isExpandedNote,
  onToggleNote,
  onUpdateNote,
  onDelete,
  renderCategoryIcon,
}: BucketItemCardProps) {
  const [noteInput, setNoteInput] = useState(item.notes || '');

  if (isEditing) {
    return (
      <div className="rounded-2xl p-4 bg-card border-2 border-brand shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-brand">
            Editing Goal #{item.number}
          </span>
          <select
            value={editCategory}
            onChange={(e) => onCategoryChange(e.target.value as BucketListItem['category'])}
            className="p-1 text-xs rounded bg-background border border-border text-foreground"
          >
            <option value="travel">Trips</option>
            <option value="food">Food</option>
            <option value="dates">Dates</option>
            <option value="growth">Growth</option>
            <option value="dreams">Dreams</option>
          </select>
        </div>

        <textarea
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          rows={2}
          className="w-full p-2 text-xs rounded-lg bg-background border border-border text-foreground mb-2 focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <input
          type="text"
          value={editLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Location / Place"
          className="w-full p-1.5 text-xs rounded-lg bg-background border border-border text-foreground mb-3"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="px-2.5 py-1 text-xs rounded-lg glass text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onSaveEdit}
            className="px-3 py-1 text-xs rounded-lg bg-brand text-background font-bold"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between",
        item.isCompleted
          ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
          : "bg-card/70 hover:bg-card/90 border-border/80 hover:border-brand/50 shadow-sm hover:shadow-md backdrop-blur-md"
      )}
    >
      <div>
        {/* Card Top Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleComplete}
              className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
              title={item.isCompleted ? "Mark as in progress" : "Mark as Completed"}
            >
              {item.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/60 hover:text-brand transition-colors" />
              )}
            </button>
            
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              {renderCategoryIcon(item.category)}
              <span>{item.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <span>#{displayIndex}</span>
            <button
              onClick={onStartEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-brand hover:underline p-0.5"
              title="Edit Goal"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Goal Description */}
        <p className={cn(
          "text-xs sm:text-sm font-medium leading-relaxed font-sans mt-1",
          item.isCompleted
            ? "text-muted-foreground line-through decoration-emerald-500/60"
            : "text-foreground"
        )}>
          {item.title}
        </p>

        {/* Location Tag */}
        {item.location && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono mt-2">
            <MapPin className="w-3 h-3 text-brand/70 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <button
          onClick={onToggleNote}
          className="hover:text-brand transition-colors flex items-center gap-1 cursor-pointer"
        >
          <MessageSquare className="w-3 h-3" />
          <span>{item.notes ? 'View Notes 💬' : 'Add Note +'}</span>
        </button>

        <div className="flex items-center gap-2">
          {item.isCompleted && (
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" /> Done
            </span>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-500 transition-colors p-0.5"
              title="Delete Custom Goal"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Note Drawer */}
      <AnimatePresence>
        {isExpandedNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 pt-2 border-t border-border/60"
          >
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={() => onUpdateNote(noteInput)}
              placeholder="Write a sweet memory or date details when we complete this..."
              rows={2}
              className="w-full p-2 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <div className="text-[9px] text-muted-foreground text-right mt-0.5">
              (Auto-saved on blur)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
