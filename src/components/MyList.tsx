import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Play, Trash2, GripVertical, CheckCircle, Clock, History, Bookmark, X } from 'lucide-react';
import { useApp } from '../store';
import { WatchStatus } from '../types';
import { cn } from '../lib/utils';
import { PosterImage } from './PosterImage';
import { api } from '../api';
import { goToWatch, goToHome } from '../lib/navigation';

type Tab = 'watchlist' | 'history';

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

  // Local state for dragging to immediately reflect changes visually
  const [items, setItems] = useState(() =>
    watchlist.filter(i => i.movie)
  );

  React.useEffect(() => {
    setItems(watchlist.filter(i => i.movie));
  }, [watchlist]);

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
      <div className="w-24 h-24 rounded-full bg-card border border-brand/20 flex items-center justify-center mb-6">
        <Bookmark className="w-10 h-10 text-brand opacity-50" />
      </div>
      <h2 className="text-3xl font-display font-bold text-foreground mb-4">Your Watchlist is Empty</h2>
      <p className="text-muted-foreground mb-8 max-w-md">Keep track of movies and TV shows you want to watch. Add items to your list by clicking the plus icon on any title.</p>
      <button
        onClick={() => goToHome()}
        className="px-8 py-3 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors"
      >
        Start Exploring
      </button>
    </div>
  );

  const renderEmptyHistory = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-24 h-24 rounded-full bg-card border border-brand/20 flex items-center justify-center mb-6">
        <History className="w-10 h-10 text-brand opacity-50" />
      </div>
      <h2 className="text-3xl font-display font-bold text-foreground mb-4">No Watch History Yet</h2>
      <p className="text-muted-foreground mb-8 max-w-md">Start watching movies, TV shows, or anime — your progress will appear here automatically, even without an account.</p>
      <button
        onClick={() => goToHome()}
        className="px-8 py-3 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors"
      >
        Browse Catalogue
      </button>
    </div>
  );

  const renderWatchlist = () => {
    if (items.length === 0) return renderEmptyWatchlist();

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="watchlist">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4"
            >
              <AnimatePresence>
                {items.map((item, index) => (
                  <Draggable key={item.movieId} draggableId={item.movieId} index={index}>
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
                          "glass rounded-xl p-4 flex items-center gap-4 group transition-transform duration-300 ease-in-out",
                          snapshot.isDragging ? "dragging-card" : "hover:border-brand/50 hover:bg-white/5"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground/40 hover:text-foreground p-2 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div
                          className="w-16 md:w-24 aspect-[2/3] rounded overflow-hidden cursor-pointer shrink-0"
                          onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                        >
                          <PosterImage
                            src={item.movie.posterUrl}
                            title={item.movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-display text-lg md:text-xl font-bold text-foreground truncate cursor-pointer hover:text-brand transition-colors inline-block"
                            onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                          >
                            {item.movie.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground mt-1">
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
                                  "text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full border transition-all flex items-center gap-1",
                                  item.status === status
                                    ? "bg-brand/20 border-brand/50 text-brand"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
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
                            className="p-3 bg-brand text-background rounded-xl hover:bg-brand-light transition-colors shadow-lg"
                            aria-label="Play"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                          <button
                            onClick={() => {
                              removeFromWatchlist(item.movieId);
                              setItems(items.filter(i => i.movieId !== item.movieId));
                            }}
                            className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-5 h-5" />
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
      <div className="grid gap-4">
        {/* Clear All button */}
        <div className="flex justify-end">
          <button
            onClick={() => clearContinueWatching()}
            className="text-xs px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-2"
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
              className="glass rounded-xl p-4 flex items-center gap-4 group hover:border-brand/50 hover:bg-white/5 transition-all"
            >
              {/* Thumbnail — landscape for backdrop, portrait fallback */}
              <div
                className="w-28 md:w-36 aspect-video rounded-lg overflow-hidden cursor-pointer shrink-0 relative"
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
                  title={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center backdrop-blur-md border border-brand">
                    <Play className="w-5 h-5 text-brand fill-current ml-0.5" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80">
                  <div
                    className="h-full bg-brand shadow-[0_0_6px_var(--brand)] rounded-r-full transition-all"
                    style={{ width: `${Math.max(4, Math.min(100, item.progress_percentage || 0))}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-display text-base md:text-lg font-bold text-foreground truncate cursor-pointer hover:text-brand transition-colors"
                  onClick={() => handleResumeWatch(item)}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  {item.media_type === 'tv' && item.season_number && item.episode_number && (
                    <span className="text-brand font-semibold">S{item.season_number} E{item.episode_number}</span>
                  )}
                  {item.media_type === 'anime' && item.episode_number && (
                    <span className="text-brand font-semibold">Episode {item.episode_number}</span>
                  )}
                  {item.progress_percentage > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{Math.round(item.progress_percentage)}% watched</span>
                    </>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-semibold tracking-wide">
                    {item.media_type}
                  </span>
                </div>
                {item.timestamp && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
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
                  className="p-3 bg-brand text-background rounded-xl hover:bg-brand-light transition-colors shadow-lg"
                  aria-label={`Resume ${item.title}`}
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={() => removeContinueWatchingItem(item.id, item.media_type)}
                  className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  aria-label={`Remove ${item.title} from history`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
            activeTab === 'watchlist'
              ? "bg-brand text-background border-brand shadow-lg shadow-brand/20"
              : "bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10"
          )}
        >
          <Bookmark className="w-4 h-4" />
          Watchlist
          {items.length > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              activeTab === 'watchlist' ? "bg-background/20" : "bg-white/10"
            )}>
              {items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border",
            activeTab === 'history'
              ? "bg-brand text-background border-brand shadow-lg shadow-brand/20"
              : "bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10"
          )}
        >
          <History className="w-4 h-4" />
          Watch History
          {continueWatching.length > 0 && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              activeTab === 'history' ? "bg-background/20" : "bg-white/10"
            )}>
              {continueWatching.length}
            </span>
          )}
        </button>
      </div>

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
