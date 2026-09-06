import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface FilterBarProps {
  onFilterChange: (filters: { type: string; providerId?: string; country: string; genreId?: string; language?: string; sortBy?: string }) => void;
  defaultType?: string;
}

export function FilterBar({ onFilterChange, defaultType = 'movie' }: FilterBarProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [type, setType] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('type');
      if (p) return p;
    }
    return defaultType;
  });
  const [country, setCountry] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('country');
      if (p) return p;
    }
    return 'US';
  });
  const [providerId, setProviderId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('provider') || '';
    }
    return '';
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('sort') || 'popularity.desc';
    }
    return 'popularity.desc';
  });

  const [showProviders, setShowProviders] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showType, setShowType] = useState(false);
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getWatchProviders(type === 'anime' ? 'tv' : type, country).then((data: any) => {
      if (isMounted && data.results) {
        const sorted = data.results.sort((a: any, b: any) => a.display_priority - b.display_priority).slice(0, 20);
        setProviders(sorted);
      }
    }).catch((err) => {
      console.error('Error fetching providers', err);
    });
    return () => { isMounted = false; };
  }, [type, country]);

  useEffect(() => {
    const filters: any = { type, country, sortBy };
    if (providerId) filters.providerId = providerId;

    if (type === 'anime') {
      filters.genreId = '16';
      filters.language = 'ja';
    }
    onFilterChange(filters);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (type && type !== defaultType) url.searchParams.set('type', type);
      else url.searchParams.delete('type');

      if (country && country !== 'US') url.searchParams.set('country', country);
      else url.searchParams.delete('country');

      if (providerId) url.searchParams.set('provider', providerId);
      else url.searchParams.delete('provider');

      if (sortBy && sortBy !== 'popularity.desc') url.searchParams.set('sort', sortBy);
      else url.searchParams.delete('sort');

      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, [type, country, providerId, sortBy]);

  const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'JP', name: 'Japan' },
  ];

  const TYPES = [
    { id: 'movie', name: 'Movies' },
    { id: 'tv', name: 'TV Shows' },
    { id: 'anime', name: 'Anime' },
  ];

  const SORT_OPTIONS = [
    { id: 'popularity.desc', name: 'Popularity' },
    { id: 'vote_average.desc', name: 'Top Rated' },
    { id: 'primary_release_date.desc', name: 'Release Date' },
  ];

  const DropdownItem = ({ active, onClick, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all flex items-center gap-2.5 cursor-pointer",
        active ? "text-brand font-bold bg-brand/10" : "text-foreground hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-5 flex flex-wrap items-center gap-3 sm:gap-6 border-b border-white/5 relative z-30 select-none">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mr-1">
        <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
        <span>Filters</span>
      </div>

      {/* Type Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowType(!showType);
            setShowCountry(false);
            setShowProviders(false);
            setShowSort(false);
          }}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-foreground border border-white/15 hover:border-brand/40 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <span className="text-muted-foreground text-xs font-normal">Type:</span>
          <span>{TYPES.find((t) => t.id === type)?.name}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <AnimatePresence>
          {showType && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-44 bg-[#12131a]/95 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50"
            >
              {TYPES.map((t) => (
                <DropdownItem
                  key={t.id}
                  active={type === t.id}
                  onClick={() => {
                    setType(t.id);
                    setShowType(false);
                  }}
                >
                  {t.name}
                </DropdownItem>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Country Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowCountry(!showCountry);
            setShowType(false);
            setShowProviders(false);
            setShowSort(false);
          }}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-foreground border border-white/15 hover:border-brand/40 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <span className="text-muted-foreground text-xs font-normal">Region:</span>
          <span>{COUNTRIES.find((c) => c.code === country)?.name}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <AnimatePresence>
          {showCountry && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-48 bg-[#12131a]/95 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50"
            >
              {COUNTRIES.map((c) => (
                <DropdownItem
                  key={c.code}
                  active={country === c.code}
                  onClick={() => {
                    setCountry(c.code);
                    setShowCountry(false);
                  }}
                >
                  {c.name}
                </DropdownItem>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Provider Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowProviders(!showProviders);
            setShowType(false);
            setShowCountry(false);
            setShowSort(false);
          }}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-foreground border border-white/15 hover:border-brand/40 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <span className="text-muted-foreground text-xs font-normal">Network:</span>
          <span className="truncate max-w-[120px]">
            {providerId ? providers.find((p) => p.provider_id.toString() === providerId)?.provider_name : 'All Networks'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <AnimatePresence>
          {showProviders && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-60 max-h-72 overflow-y-auto custom-scrollbar bg-[#12131a]/95 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50"
            >
              <DropdownItem
                active={providerId === ''}
                onClick={() => {
                  setProviderId('');
                  setShowProviders(false);
                }}
              >
                All Networks
              </DropdownItem>
              {providers.map((p) => (
                <DropdownItem
                  key={p.provider_id}
                  active={providerId === p.provider_id.toString()}
                  onClick={() => {
                    setProviderId(p.provider_id.toString());
                    setShowProviders(false);
                  }}
                >
                  {p.logo_path && (
                    <img
                      loading="lazy"
                      src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                      alt={p.provider_name}
                      className="w-4 h-4 rounded-md shadow-sm"
                    />
                  )}
                  <span className="truncate">{p.provider_name}</span>
                </DropdownItem>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sort Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowSort(!showSort);
            setShowType(false);
            setShowCountry(false);
            setShowProviders(false);
          }}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-foreground border border-white/15 hover:border-brand/40 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <span className="text-muted-foreground text-xs font-normal">Sort:</span>
          <span>{SORT_OPTIONS.find((s) => s.id === sortBy)?.name || 'Popularity'}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <AnimatePresence>
          {showSort && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-44 bg-[#12131a]/95 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50"
            >
              {SORT_OPTIONS.map((s) => (
                <DropdownItem
                  key={s.id}
                  active={sortBy === s.id}
                  onClick={() => {
                    setSortBy(s.id);
                    setShowSort(false);
                  }}
                >
                  {s.name}
                </DropdownItem>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

