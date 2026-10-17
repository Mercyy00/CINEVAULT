import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Star,
  Download,
  Search,
  ArrowUpDown,
  List,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
} from 'lucide-react';
import { Movie } from '../types';
import { api } from '../api';
import { cn } from '../lib/utils';
import { LemniscateBloom } from './LemniscateBloom';

interface EpisodesSectionProps {
  id: string;
  movie: Movie;
  seasons: Array<{
    id?: number;
    season_number: number;
    name?: string;
    episode_count?: number;
    poster_path?: string | null;
  }>;
  selectedSeason: number;
  episodes: any[];
  selectedEpisode: number;
  isLoadingEpisodes: boolean;
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (episodeNumber: number) => void;
  onDownload: (seasonNumber: number, episodeNumber: number) => void;
  progressItem?: {
    season_number?: number;
    episode_number?: number;
    progress_percentage?: number;
  };
}

export function EpisodesSection({
  movie,
  seasons,
  selectedSeason,
  episodes,
  selectedEpisode,
  isLoadingEpisodes,
  onSelectSeason,
  onSelectEpisode,
  onDownload,
  progressItem,
}: EpisodesSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close season dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSeasonDropdownOpen(false);
      }
    }
    if (seasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [seasonDropdownOpen]);

  // Filter & sort episodes
  const displayedEpisodes = useMemo(() => {
    let list = [...episodes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ep) => {
        const epNum = String(ep.episode_number || '');
        const title = (ep.name || '').toLowerCase();
        const overview = (ep.overview || '').toLowerCase();
        return epNum === q || title.includes(q) || overview.includes(q);
      });
    }

    if (!sortAsc) {
      list.reverse();
    }

    return list;
  }, [episodes, searchQuery, sortAsc]);

  // Check scroll bounds for chevron buttons
  const checkScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    const el = carouselRef.current;
    if (!el) return () => clearTimeout(timer);
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [episodes, viewMode, displayedEpisodes]);

  const scroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const currentSeasonData = seasons.find((s) => s.season_number === selectedSeason);
  const seasonTitle = currentSeasonData?.name || `Season ${selectedSeason}`;
  const totalEpisodesCount = currentSeasonData?.episode_count || episodes.length;

  return (
    <section className="mb-14 w-full select-none" aria-label="Episodes">
      {/* ═══ HEADER ROW (MATCHING USER SCREENSHOT) ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Left Side: Vertical Red Accent Bar + Season Title & Episode Count */}
        <div className="flex items-center gap-3">
          {/* Vertical Red Bar */}
          <div className="w-1 sm:w-1.5 self-stretch min-h-[2.5rem] bg-red-600 rounded-full shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />

          <div className="relative" ref={dropdownRef}>
            {seasons.length > 1 ? (
              <button
                type="button"
                onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
                aria-expanded={seasonDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight group-hover:text-red-400 transition-colors">
                      {seasonTitle}
                    </h3>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-zinc-400 group-hover:text-white transition-transform duration-200',
                        seasonDropdownOpen && 'rotate-180 text-white'
                      )}
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                    {totalEpisodesCount} {totalEpisodesCount === 1 ? 'episode' : 'episodes'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                  {seasonTitle}
                </h3>
                <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {totalEpisodesCount} {totalEpisodesCount === 1 ? 'episode' : 'episodes'}
                </span>
              </div>
            )}

            {/* Season Dropdown Menu */}
            {seasonDropdownOpen && seasons.length > 1 && (
              <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 py-2 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Select Season
                </div>
                {seasons.map((s) => {
                  const isSelected = selectedSeason === s.season_number;
                  return (
                    <button
                      key={s.season_number}
                      type="button"
                      onClick={() => {
                        onSelectSeason(s.season_number);
                        setSeasonDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3.5 py-2.5 flex items-center justify-between text-sm transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-red-600/15 text-red-400 font-bold border-l-2 border-red-600'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span>{s.name || `Season ${s.season_number}`}</span>
                      {s.episode_count ? (
                        <span className="text-xs font-mono text-zinc-400">
                          {s.episode_count} eps
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Controls: Search, Sort, View Toggle (Segmented List / Grid) */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            title={showSearch ? 'Close search' : 'Search episodes'}
            className={cn(
              'w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer',
              showSearch || searchQuery
                ? 'bg-red-600/20 border-red-500 text-red-400'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
            )}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Sort Order Button */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? 'Sorting: Episode 1 to N (Click to reverse)' : 'Sorting: Episode N to 1 (Click to reverse)'}
            className={cn(
              'w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer',
              !sortAsc
                ? 'bg-red-600/20 border-red-500 text-red-400'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* View Mode Toggle (Segmented List & Grid) */}
          <div className="flex items-center bg-zinc-900/80 border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List view"
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-zinc-700/70 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid/Carousel view"
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-zinc-700/70 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Search Bar Input */}
      {showSearch && (
        <div className="mb-5 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episode by title, description or #..."
              className="w-full bg-zinc-900/90 border border-white/15 focus:border-red-500 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-400 font-mono whitespace-nowrap">
            {displayedEpisodes.length} {displayedEpisodes.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
      )}

      {/* ═══ CONTENT AREA: CAROUSEL / GRID OR LIST ═══ */}
      {isLoadingEpisodes ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <LemniscateBloom size={48} className="text-white" ariaLabel="Loading episodes" />
          <p className="text-xs text-zinc-400 font-mono">Loading season episodes...</p>
        </div>
      ) : displayedEpisodes.length === 0 ? (
        <div className="py-14 text-center border border-white/10 rounded-2xl bg-zinc-950/40 p-8">
          <p className="text-zinc-300 font-medium mb-2">No episodes found.</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-red-400 hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ═══ GRID / CAROUSEL VIEW (MATCHING USER SCREENSHOT) ═══ */
        <div className="relative group/track">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/85 hover:bg-black border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow Button (Chevron Right as in screenshot) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/85 hover:bg-black border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Horizontal Track of Episode Cards */}
          <div
            ref={carouselRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {displayedEpisodes.map((ep: any) => {
              const isSelected = selectedEpisode === ep.episode_number;
              const hasProgress =
                progressItem?.season_number === selectedSeason &&
                progressItem?.episode_number === ep.episode_number &&
                (progressItem?.progress_percentage || 0) > 0;
              const progressPercentage = hasProgress ? progressItem.progress_percentage : 0;

              const imageUrl = ep.still_path
                ? api.getImageUrl(ep.still_path, 'w500')
                : movie.backdropUrl || movie.posterUrl;

              const ratingValue = ep.vote_average
                ? Number(ep.vote_average).toFixed(1)
                : movie.rating
                ? Number(movie.rating).toFixed(1)
                : '7.5';

              const runtimeDisplay = ep.runtime ? `${ep.runtime}m` : '48m';

              return (
                <div
                  key={ep.id || `ep-${ep.episode_number}`}
                  onClick={() => onSelectEpisode(ep.episode_number)}
                  className={cn(
                    'group/card relative shrink-0 w-[280px] sm:w-[320px] md:w-[350px] lg:w-[380px] aspect-[16/10] rounded-2xl overflow-hidden border bg-zinc-950 transition-all duration-300 cursor-pointer shadow-xl select-none',
                    isSelected
                      ? 'border-red-500/80 ring-2 ring-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.35)]'
                      : 'border-white/10 hover:border-white/25 hover:shadow-2xl'
                  )}
                >
                  {/* Episode Still / Thumbnail Background */}
                  {imageUrl ? (
                    <img
                      loading="lazy"
                      src={imageUrl}
                      alt={ep.name || `Episode ${ep.episode_number}`}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                      <Play className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}

                  {/* Dark Multi-Stage Gradient Overlay (Ensures Crystal Clear Text Contrast) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20 group-hover/card:from-black group-hover/card:via-black/60 transition-colors" />

                  {/* Top-Right Download Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(selectedSeason, ep.episode_number);
                    }}
                    title={`Download S${selectedSeason} E${ep.episode_number}`}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 hover:border-white/30 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom Content Area */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end z-10 pointer-events-none">
                    {/* EPISODE N Label */}
                    <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400 uppercase font-mono mb-1">
                      EPISODE {ep.episode_number}
                    </div>

                    {/* Episode Title */}
                    <h4 className="text-base sm:text-lg font-bold text-white font-display line-clamp-1 mb-1.5 drop-shadow-md">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>

                    {/* Overview description (2 lines clamped) */}
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3 font-normal drop-shadow">
                      {ep.overview || 'Vision embarks on a journey of self-discovery and adventure.'}
                    </p>

                    {/* Meta Row: Play + Runtime on left, Star + Rating on right */}
                    <div className="flex items-center justify-between text-xs text-zinc-300 font-mono font-medium pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 fill-white text-white shrink-0" />
                        <span>{runtimeDisplay}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-300">
                        <Star className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                        <span>{ratingValue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (if watched) */}
                  {hasProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ═══ LIST VIEW ═══ */
        <div className="space-y-3">
          {displayedEpisodes.map((ep: any) => {
            const isSelected = selectedEpisode === ep.episode_number;
            const hasProgress =
              progressItem?.season_number === selectedSeason &&
              progressItem?.episode_number === ep.episode_number &&
              (progressItem?.progress_percentage || 0) > 0;
            const progressPercentage = hasProgress ? progressItem.progress_percentage : 0;

            const imageUrl = ep.still_path
              ? api.getImageUrl(ep.still_path, 'w500')
              : movie.backdropUrl || movie.posterUrl;

            const ratingValue = ep.vote_average
              ? Number(ep.vote_average).toFixed(1)
              : movie.rating
              ? Number(movie.rating).toFixed(1)
              : '7.5';

            return (
              <div
                key={ep.id || `ep-list-${ep.episode_number}`}
                onClick={() => onSelectEpisode(ep.episode_number)}
                className={cn(
                  'w-full text-left flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl transition-all group cursor-pointer border',
                  isSelected
                    ? 'bg-zinc-900/90 border-red-500/80 shadow-lg ring-1 ring-red-600/50'
                    : 'bg-zinc-950/70 border-white/10 hover:bg-zinc-900/70 hover:border-white/20'
                )}
              >
                {/* Thumbnail */}
                <div className="w-full md:w-52 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-black/50 border border-white/10">
                  {imageUrl ? (
                    <img
                      loading="lazy"
                      src={imageUrl}
                      alt={ep.name || `Episode ${ep.episode_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Play className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/70 group-hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm transition-colors">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-[11px] font-mono font-bold text-white backdrop-blur">
                    {ep.runtime || 45}m
                  </div>
                  {hasProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                        Episode {ep.episode_number}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <div className="flex items-center gap-1 text-xs text-zinc-300 font-mono">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>{ratingValue}</span>
                      </div>
                    </div>
                    <h4
                      className={cn(
                        'text-base sm:text-lg font-bold mb-1.5 truncate',
                        isSelected ? 'text-red-400' : 'text-white group-hover:text-red-400 transition-colors'
                      )}
                    >
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                      {ep.overview || 'No description available for this episode.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(selectedSeason, ep.episode_number);
                      }}
                      title={`Download S${selectedSeason} E${ep.episode_number}`}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/25 text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
