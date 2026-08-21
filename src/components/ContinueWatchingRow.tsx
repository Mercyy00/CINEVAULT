import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { useApp } from '../store';
import { api } from '../api';
import { cn } from '../lib/utils';

export function ContinueWatchingRow() {
  const { continueWatching } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Touch drag variables
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDown.current = true;
    if (scrollContainerRef.current) {
      startX.current = 'touches' in e ? e.touches[0].pageX - scrollContainerRef.current.offsetLeft : e.pageX - scrollContainerRef.current.offsetLeft;
      scrollLeft.current = scrollContainerRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    const x = 'touches' in e ? e.touches[0].pageX - scrollContainerRef.current.offsetLeft : e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  if (continueWatching.length === 0) return null;

  return (
    <div className="mb-12 md:mb-16">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 font-display">Continue Watching</h2>
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleMouseMove}
        className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-4 select-none"
      >
        {continueWatching.map((item) => (
          <div 
            key={`${item.id}-${item.season_number}-${item.episode_number}`}
            className="flex-shrink-0 w-[260px] sm:w-[320px] aspect-video rounded-xl bg-white/5 relative border border-white/5 group cursor-pointer snap-start overflow-hidden transition-all hover:scale-[1.02] hover:border-brand/50"
            onClick={() => {
              if (item.media_type === 'anime') {
                window.location.hash = `#watch/ani/${item.id}/${item.mal_id || '0'}/${item.episode_number || 1}`;
              } else if (item.media_type === 'tv') {
                window.location.hash = `#watch/tv/${item.id}/${item.season_number || 1}/${item.episode_number || 1}`;
              } else {
                window.location.hash = `#watch/movie/${item.id}`;
              }
            }}
          >
            <img loading="lazy" 
              src={item.backdrop_path ? (item.backdrop_path?.startsWith('http') ? item.backdrop_path : api.getImageUrl(item.backdrop_path)) : (item.poster_path ? (item.poster_path?.startsWith('http') ? item.poster_path : api.getImageUrl(item.poster_path)) : undefined)} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
            />
            
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-black/40 to-transparent">
              <div className="flex items-center justify-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center backdrop-blur-md border border-brand">
                  <Play className="w-6 h-6 text-brand fill-current ml-1" />
                </div>
              </div>
              <h3 className="text-white font-bold truncate drop-shadow-md z-10">{item.title}</h3>
              {(item.media_type === 'tv') && item.season_number && item.episode_number && (
                <p className="text-brand text-xs font-medium z-10">S{item.season_number} E{item.episode_number}</p>
              )}
              {item.media_type === 'anime' && item.episode_number && (
                <p className="text-brand text-xs font-medium z-10">Continue E{item.episode_number}</p>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-full">
              <div 
                className="h-full bg-primary shadow-sm rounded-full"
                style={{ width: `${item.progress_percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
