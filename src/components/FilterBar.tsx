import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface FilterBarProps {
  onFilterChange: (filters: { type: string; providerId?: string; country: string; genreId?: string; language?: string }) => void;
  defaultType?: string;
}

export function FilterBar({ onFilterChange, defaultType = 'movie' }: FilterBarProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [type, setType] = useState(defaultType);
  const [country, setCountry] = useState('US');
  const [providerId, setProviderId] = useState<string>('');

  const [showProviders, setShowProviders] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showType, setShowType] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getWatchProviders(type === 'anime' ? 'tv' : type, country).then(data => {
      if (isMounted && data.results) {
        // Sort and slice top 20 providers
        const sorted = data.results.sort((a: any, b: any) => a.display_priority - b.display_priority).slice(0, 20);
        setProviders(sorted);
        setProviderId(''); // Reset provider on type/country change
      }
    }).catch(err => {
      console.error('Error fetching providers', err);
    });
    return () => { isMounted = false; };
  }, [type, country]);

  useEffect(() => {
    let filters: any = { type, country };
    if (providerId) filters.providerId = providerId;
    
    // Auto-apply logic for Anime (TV + JA + Gen 16) or Bollywood (hi) based on selections
    if (type === 'anime') {
      filters.genreId = '16';
      filters.language = 'ja';
    } else if (country === 'IN' && type === 'movie') {
      // For India, we could optionally filter by hindi, but let's just pass country and let the user pick
    }
    onFilterChange(filters);
  }, [type, country, providerId]);

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

  const DropdownItem = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2",
        active ? "text-brand font-bold bg-brand/5" : "text-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="px-4 md:px-10 py-6 flex flex-wrap items-center gap-4 md:gap-8 border-b border-brand/10 relative z-30">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Type:</span>
        <div className="relative">
          <button 
            onClick={() => setShowType(!showType)} 
            onBlur={() => setTimeout(() => setShowType(false), 200)}
            className="glass px-4 py-2 rounded-full text-sm font-medium text-foreground border border-white/10 hover:border-brand flex items-center gap-2 transition-colors"
          >
            {TYPES.find(t => t.id === type)?.name}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <AnimatePresence>
            {showType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-40 glass rounded-xl py-2 border border-brand/20 shadow-xl"
              >
                {TYPES.map(t => (
                  <DropdownItem key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
                    {t.name}
                  </DropdownItem>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Country:</span>
        <div className="relative">
          <button 
            onClick={() => setShowCountry(!showCountry)} 
            onBlur={() => setTimeout(() => setShowCountry(false), 200)}
            className="glass px-4 py-2 rounded-full text-sm font-medium text-foreground border border-white/10 hover:border-brand flex items-center gap-2 transition-colors"
          >
            {COUNTRIES.find(c => c.code === country)?.name}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <AnimatePresence>
            {showCountry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-48 glass rounded-xl py-2 border border-brand/20 shadow-xl"
              >
                {COUNTRIES.map(c => (
                  <DropdownItem key={c.code} active={country === c.code} onClick={() => setCountry(c.code)}>
                    {c.name}
                  </DropdownItem>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Streaming On:</span>
        <div className="relative">
          <button 
            onClick={() => setShowProviders(!showProviders)} 
            onBlur={() => setTimeout(() => setShowProviders(false), 200)}
            className="glass px-4 py-2 rounded-full text-sm font-medium text-foreground border border-white/10 hover:border-brand flex items-center gap-2 transition-colors"
          >
            {providerId ? providers.find(p => p.provider_id.toString() === providerId)?.provider_name : 'Any Provider'}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <AnimatePresence>
            {showProviders && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto glass rounded-xl py-2 border border-brand/20 shadow-xl scrollbar-hide"
              >
                <DropdownItem active={providerId === ''} onClick={() => setProviderId('')}>
                  Any Provider
                </DropdownItem>
                {providers.map(p => (
                  <DropdownItem key={p.provider_id} active={providerId === p.provider_id.toString()} onClick={() => setProviderId(p.provider_id.toString())}>
                    {p.logo_path && (
                      <img loading="lazy" src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-5 h-5 rounded-sm" />
                    )}
                    <span className="truncate">{p.provider_name}</span>
                  </DropdownItem>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
