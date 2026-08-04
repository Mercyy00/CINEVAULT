import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Play, Trash2, GripVertical, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../store';
import { WatchStatus } from '../types';
import { cn } from '../lib/utils';

export function MyList({ onMovieSelect }: { onMovieSelect: (id: string, type: string) => void }) {
  const { watchlist, setWatchlist, removeFromWatchlist, updateStatus, showToast } = useApp();
  
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
    setWatchlist(newItems); // Persist to context
    showToast('Watchlist order updated');
  };

  const statusIcons: Record<WatchStatus, React.ReactNode> = {
    'Not Started': <Clock className="w-4 h-4 text-cv-slate" />,
    'In Progress': <Play className="w-4 h-4 text-cv-gold" />,
    'Watched': <CheckCircle className="w-4 h-4 text-green-500" />,
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 rounded-full bg-cv-panel border border-cv-gold/20 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-cv-gold opacity-50" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-cv-cream mb-4">Your Watchlist is Empty</h2>
        <p className="text-cv-slate mb-8 max-w-md">Keep track of movies and TV shows you want to watch. Add items to your list by clicking the plus icon on any title.</p>
        <button 
          onClick={() => window.location.hash = '#home'}
          className="px-8 py-3 bg-cv-gold text-cv-gold-content font-bold rounded-lg hover:bg-cv-gold-light transition-colors"
        >
          Start Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-cv-cream">My Watchlist</h2>
        <span className="text-cv-slate bg-white/5 px-4 py-1.5 rounded-full text-sm border border-white/10">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

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
                  // @ts-ignore - React 19 type mismatch for key
                  <Draggable key={item.movieId} draggableId={item.movieId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "glass-panel rounded-xl p-4 flex items-center gap-4 group transition-transform duration-300 ease-in-out",
                          snapshot.isDragging ? "dragging-card" : "hover:border-cv-gold/50 hover:bg-white/5"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <div {...provided.dragHandleProps} className="text-cv-slate/40 hover:text-cv-cream p-2 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        
                        <div 
                          className="w-16 md:w-24 aspect-[2/3] rounded overflow-hidden cursor-pointer shrink-0"
                          onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                        >
                          <img loading="lazy" src={item.movie.posterUrl || undefined} alt={item.movie.title} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-serif text-lg md:text-xl font-bold text-cv-cream truncate cursor-pointer hover:text-cv-gold transition-colors inline-block"
                            onClick={() => onMovieSelect(item.movieId, item.movie.type)}
                          >
                            {item.movie.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs md:text-sm text-cv-slate mt-1">
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
                                    ? "bg-cv-gold/20 border-cv-gold/50 text-cv-gold" 
                                    : "bg-white/5 border-white/10 text-cv-slate hover:bg-white/10"
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
                            className="p-3 bg-cv-gold text-cv-gold-content rounded-lg hover:bg-cv-gold-light transition-colors shadow-lg"
                            aria-label="Play"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                          <button 
                            onClick={() => {
                              removeFromWatchlist(item.movieId);
                              setItems(items.filter(i => i.movieId !== item.movieId));
                            }}
                            className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
