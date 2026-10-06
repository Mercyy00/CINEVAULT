import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowDownUp, Film, Play, Trash2, GripVertical, CheckCircle, Clock, History, Bookmark, Tv, X } from 'lucide-react';
import { useApp } from '../store';
import { WatchStatus } from '../types';
import { cn } from '../lib/utils';
import { PosterImage } from './PosterImage';
import { api, POSTER_SIZES, BACKDROP_SIZES } from '../api';
import { goToWatch, goToHome } from '../lib/navigation';

type Tab = 'watchlist' | 'history';
type SortKey = 'custom' | 'year' | 'rating' | 'title';
type TypeFilter = 'all' | 'movie' | 'tv' | 'anime';

export function MyList({ onMovieSelect }: { onMovieSelect: (id: string, type: string) => void }) {
  const {
    watchlist,
    replaceWatchlist,
    removeFromWatchlist,
    updateStatus,
    showToast,
    continueWatching,
    removeContinueWatchingItem,
    clearContinueWatching,
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('watchlist');
  const [sortKey, setSortKey] = useState<SortKey>('custom');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // Local state for dragging to immediately reflect changes visually
  const [items, setItems] = useState(() =>
    watchlist.filter(i => i.movie)
  );

  React.useEffect(() => {
    setItems(watchlist.filter(i => i.movie));
  }, [watchlist]);

  /** Sorted + filtered view of the watchlist. */
  const displayedItems = useMemo(() => {
    let filtered = items;
    if (typeFilter !== 'all') {
      filtered = items.filter((item) => item.movie?.type === typeFilter);
    }
    if (sortKey === 'custom') return filtered;

    return [...filtered].sort((a, b) => {
      const am = a.movie;
      const bm = b.movie;
      if (!am || !bm) return 0;
      switch (sortKey) {
        case 'year':
          return (Number(bm.year) || 0) - (Number(am.year) || 0);
        case 'rating':
          return (bm.rating ?? 0) - (am.rating ?? 0);
        case 'title':
          return am.title.localeCompare(bm.title);
        default:
          return 0;
      }
    });
  }, [items, sortKey, typeFilter]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
    replaceWatchlist(newItems); // Persist to context
    showToast('Watchlist order updated');
  };

  const statusIcons: Record<WatchStatus, React.ReactNode> = {
    'Not Started': <Clock className="w-4 h-4 text-muted-foreground" />,
    'In Progress': <Play className="w-4 h-4 text-brand" />,
    'Watched': <CheckCircle className="w-4 h-4 text-green-500" />,
  };

  const handleResumeWatch = (item: typeof continueWatching[number]) => {
    goToWatch(
      item.id,
      item.media_type,
      item.season_number || 1,
      item.episode_number || 1,
      item.mal_id
    );
  };

  const renderEmptyWatchlist = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#141417] border border-white/10 flex items-center justify-center mb-6 shadow-xl">
        <Bookmark className="w-8 h-8 text-[#929093]" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3 tracking-tight">Your Watchlist is Empty</h2>
      <p className="text-[#929093] mb-8 max-w-md text-sm leading-relaxed">Keep track of movies and TV shows you want to watch. Add items to your list by clicking the plus icon on any title.</p>
      <button
        onClick={() => goToHome()}
        className="px-7 py-3 bg-[#f3f0ea] text-[#0b0b0d] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-md cursor-pointer"
      >
        Start Exploring
      </button>
    </div>
  );

  const renderEmptyHistory = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#141417] border border-white/10 flex items-center justify-center mb-6 shadow-xl">
        <History className="w-8 h-8 text-[#929093]" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3 tracking-tight">No Watch History Yet</h2>
      <p className="text-[#929093] mb-8 max-w-md text-sm leading-relaxed">Start watching movies, TV shows, or anime — your progress will appear here automatically, even without an account.</p>
      <button
        onClick={() => goToHome()}
        className="px-7 py-3 bg-[#f3f0ea] text-[#0b0b0d] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-md cursor-pointer"
      >
        Browse Catalogue
      </button>
    </div>
  );

  const renderWatchlist = () => {
    if (items.length === 0) return renderEmptyWatchlist();

    // When sorted or filtered, DnD doesn't make sense — the order is algorithmic.
    const isDragEnabled = sortKey === 'custom' && typeFilter === 'all';

    if (displayedItems.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-display font-semibold mb-2">No matches</p>
          <p className="text-sm">Try adjusting your filters.</p>
        </div>
      );
    }

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="watchlist">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-3.5"
            >
              <AnimatePresence>
                {displayedItems.map((item, index) => (
                  <Draggable key={item.movieId} draggableId={item.movieId} index={index} isDragDisabled={!isDragEnabled}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, y: 25, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.4,
                          delay: Math.min(index * 0.05, 0.3),
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={cn(
                          "bg-[#141417] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4 group transition-all duration-300 ease-in-out",
                          snapshot.isDragging ? "dragging-card shadow-2xl border-white/20" : "hover:border-white/20 hover:bg-[#18191e]"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground/40 hover:text-foreground p-2 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div
                          className="w-16 md:w-20 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer shrink-0 border border-white/10"
                          onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                        >
                          <PosterImage
                            src={item.movie.posterUrl}
                            srcSet={item.movie.posterSrcSet}
                            thumbSrc={item.movie.posterThumbUrl}
                            sizes={POSTER_SIZES}
                            title={item.movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-display text-base md:text-lg font-bold text-foreground truncate cursor-pointer hover:text-white transition-colors inline-block tracking-tight"
                            onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                          >
                            {item.movie.title}
                          </h3>
                          <div className="flex items-center gap-2.5 text-xs font-mono text-[#929093] mt-1">
                            <span>{item.movie.year}</span>
                            <span>•</span>
                            <span>{item.movie.duration}</span>
                          </div>

                          <div className="mt-3 flex gap-2">
                            {(['Not Started', 'In Progress', 'Watched'] as WatchStatus[]).map(status => (
                              <button
                                key={status}
                                onClick={() => {
                                  updateStatus(item.movieId, status);
                                  setItems(items.map(i => i.movieId === item.movieId ? { ...i, status } : i));
                                }}
                                className={cn(
                                  "text-[10px] md:text-xs px-2.5 md:px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer font-mono",
                                  item.status === status
                                    ? "bg-[#f3f0ea]/15 border-[#f3f0ea]/40 text-[#f3f0ea] font-medium"
                                    : "bg-white/[0.03] border-white/10 text-[#929093] hover:bg-white/[0.08] hover:text-[#f3f0ea]"
                                )}
                              >
                                {statusIcons[status]}
                                <span className="hidden sm:inline">{status}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                            className="p-3 bg-[#f3f0ea] text-[#0b0b0d] rounded-xl hover:bg-white transition-colors shadow-md cursor-pointer"
                            aria-label="Play"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => {
                              removeFromWatchlist(item.movieId);
                              setItems(items.filter(i => i.movieId !== item.movieId));
                            }}
                            className="p-3 bg-white/[0.04] text-[#929093] hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  const renderHistory = () => {
    if (continueWatching.length === 0) return renderEmptyHistory();

    return (
      <div className="grid gap-3.5">
        {/* Clear All button */}
        <div className="flex justify-end">
          <button
            onClick={() => clearContinueWatching()}
            className="text-xs px-3.5 py-1.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-2 font-mono cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        </div>

        <AnimatePresence>
          {continueWatching.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.media_type}-${item.season_number ?? 0}-${item.episode_number ?? 0}`}
              initial={{ opacity: 0, y: 25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.05, 0.3),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-[#141417] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex items-center gap-4 group hover:bg-[#18191e] transition-all"
            >
              {/* Thumbnail — landscape for backdrop, portrait fallback */}
              <div
                className="w-28 md:w-36 aspect-video rounded-xl overflow-hidden cursor-pointer shrink-0 relative border border-white/10"
                onClick={() => handleResumeWatch(item)}
              >
                <PosterImage
                  src={
                    (item.backdrop_path
                      ? item.backdrop_path?.startsWith('http')
                        ? item.backdrop_path
                        : api.getImageUrl(item.backdrop_path)
                      : item.poster_path
                      ? item.poster_path?.startsWith('http')
                        ? item.poster_path
                        : api.getImageUrl(item.poster_path)
                      : undefined) ?? undefined
                  }
                  srcSet={
                    item.backdrop_path && !item.backdrop_path.startsWith('http')
                      ? api.getBackdropSrcSet(item.backdrop_path)
                      : item.poster_path && !item.poster_path.startsWith('http')
                      ? api.getPosterSrcSet(item.poster_path)
                      : undefined
                  }
                  sizes={item.backdrop_path ? BACKDROP_SIZES : POSTER_SIZES}
                  thumbSrc={
                    item.backdrop_path && !item.backdrop_path.startsWith('http')
                      ? api.getImageUrl(item.backdrop_path, 'w300')
                      : item.poster_path && !item.poster_path.startsWith('http')
                      ? api.getImageUrl(item.poster_path, 'w92')
                      : undefined
                  }
                  title={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-[#f3f0ea] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 text-[#0b0b0d] fill-current ml-0.5" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80">
                  <div
                    className="h-full bg-[#f3f0ea] rounded-r-full transition-all"
                    style={{ width: `${Math.max(4, Math.min(100, item.progress_percentage || 0))}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-display text-base md:text-lg font-bold text-foreground truncate cursor-pointer hover:text-white transition-colors tracking-tight"
                  onClick={() => handleResumeWatch(item)}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-[#929093] mt-1 flex-wrap">
                  {item.media_type === 'tv' && item.season_number && item.episode_number && (
                    <span className="text-[#f3f0ea] font-semibold">S{item.season_number} E{item.episode_number}</span>
                  )}
                  {item.media_type === 'anime' && item.episode_number && (
                    <span className="text-[#f3f0ea] font-semibold">EP {item.episode_number}</span>
                  )}
                  {item.progress_percentage > 0 && (
                    <>
                      <span>•</span>
                      <span>{Math.round(item.progress_percentage)}% watched</span>
                    </>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-semibold tracking-wide">
                    {item.media_type}
                  </span>
                </div>
                {item.timestamp && (
                  <p className="text-[10px] font-mono text-[#929093]/70 mt-1.5">
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleResumeWatch(item)}
                  className="p-3 bg-[#f3f0ea] text-[#0b0b0d] rounded-xl hover:bg-white transition-colors shadow-md cursor-pointer"
                  aria-label={`Resume ${item.title}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={() => removeContinueWatchingItem(item.id, item.media_type)}
                  className="p-3 bg-white/[0.04] text-[#929093] hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  aria-label={`Remove ${item.title} from history`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="pt-28 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer",
            activeTab === 'watchlist'
              ? "bg-[#f3f0ea] text-[#0b0b0d] font-bold border-[#f3f0ea] shadow-md"
              : "bg-white/[0.04] text-[#929093] border-white/10 hover:text-[#f3f0ea] hover:bg-white/[0.08]"
          )}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Watchlist
          {items.length > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              activeTab === 'watchlist' ? "bg-black/20 text-[#0b0b0d]" : "bg-white/10 text-[#929093]"
            )}>
              {items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer",
            activeTab === 'history'
              ? "bg-[#f3f0ea] text-[#0b0b0d] font-bold border-[#f3f0ea] shadow-md"
              : "bg-white/[0.04] text-[#929093] border-white/10 hover:text-[#f3f0ea] hover:bg-white/[0.08]"
          )}
        >
          <History className="w-3.5 h-3.5" />
          Watch History
          {continueWatching.length > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              activeTab === 'history' ? "bg-black/20 text-[#0b0b0d]" : "bg-white/10 text-[#929093]"
            )}>
              {continueWatching.length}
            </span>
          )}
        </button>
      </div>

      {/* Sort & Filter Controls (watchlist tab only) */}
      {activeTab === 'watchlist' && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Type filter pills */}
          <div className="flex items-center gap-1.5 bg-[#141417] border border-white/10 rounded-full p-1">
            {([
              { key: 'all' as TypeFilter, label: 'All', icon: null },
              { key: 'movie' as TypeFilter, label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
              { key: 'tv' as TypeFilter, label: 'TV', icon: <Tv className="w-3.5 h-3.5" /> },
              { key: 'anime' as TypeFilter, label: 'Anime', icon: null },
            ]).map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer',
                  typeFilter === key
                    ? 'bg-[#f3f0ea] text-[#0b0b0d] font-semibold shadow-sm'
                    : 'text-[#929093] hover:text-[#f3f0ea] hover:bg-white/5'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowDownUp className="w-3.5 h-3.5 text-[#929093]" aria-hidden="true" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-[#141417] border border-white/10 rounded-full px-3 py-1.5 text-xs font-mono text-[#f3f0ea] appearance-none cursor-pointer pr-8 hover:bg-[#18191e] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              aria-label="Sort watchlist"
            >
              <option value="custom">Custom order</option>
              <option value="year">Release year</option>
              <option value="rating">Highest rated</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'watchlist' ? (
          <motion.div
            key="watchlist-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {renderWatchlist()}
          </motion.div>
        ) : (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {renderHistory()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
