import { useEffect, useState, useMemo } from 'react';
import {
  Download,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  HardDrive,
  Film,
  Sparkles,
  Layers,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowUpDown,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react';
import { api, anilistApi } from '../api';
import { fetchDownloads, type DownloadResponse } from '../services/downloadService';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { updateSeoMetadata } from '../lib/seo';
import { goToDetail, goToWatch } from '../lib/navigation';

export function DownloadPage() {
  const { showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DownloadResponse | null>(null);
  const [mediaInfo, setMediaInfo] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeScreenScapeUrl, setActiveScreenScapeUrl] = useState<string | null>(null);

  // Filters for Movie/TV
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'oneclick' | 'bollywood' | 'cloud' | 'classic' | 'hub'>('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | '4K' | '1080p' | '720p' | '480p'>('all');
  const [audioFilter, setAudioFilter] = useState<'all' | 'hindi' | 'english' | 'dual' | 'sub'>('all');
  const [sortBy, setSortBy] = useState<'quality' | 'size'>('quality');

  // URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const rawType = (searchParams.get('type') || 'movie').toLowerCase();
  const type: 'movie' | 'tv' | 'anime' = rawType === 'anime' || rawType === 'ani' ? 'anime' : rawType === 'tv' ? 'tv' : 'movie';
  const id = searchParams.get('id') || '';
  const imdbParam = searchParams.get('imdb') || '';
  const malParam = searchParams.get('mal') || '';
  const season = parseInt(searchParams.get('season') || '1', 10);
  const initialEpisode = parseInt(searchParams.get('episode') || '1', 10);
  const initialTrack = (searchParams.get('track') || 'sub').toLowerCase() === 'dub' ? 'dub' : 'sub';

  // Dedicated Anime State (ZokoAnime)
  const [animeEpisode, setAnimeEpisode] = useState<number>(initialEpisode);
  const [animeTrack, setAnimeTrack] = useState<'sub' | 'dub'>(initialTrack);
  const [animeEpisodes, setAnimeEpisodes] = useState<any[]>([]);
  const [animeEpSearch, setAnimeEpSearch] = useState<string>('');

  // Fetch media details and live downloads
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setError('Missing title identifier');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let title = '';
        let resolvedImdb = imdbParam;
        let resolvedTmdb = id;
        let poster = '';
        let backdrop = '';
        let year = '';
        let infoObj: any = null;

        if (type === 'anime') {
          // Dedicated Anime Loading via AniList & ZokoAnime
          const [aniDetail, aniEps] = await Promise.all([
            anilistApi.getDetails(id),
            anilistApi.getEpisodes(id).catch(() => []),
          ]);

          if (aniDetail?.movie) {
            const aniMovie = aniDetail.movie;
            title = aniMovie.title;
            poster = aniMovie.posterUrl || '';
            backdrop = aniMovie.backdropUrl || '';
            year = aniMovie.year ? String(aniMovie.year) : '';
            infoObj = aniMovie;
          }

          if (cancelled) return;

          setAnimeEpisodes(Array.isArray(aniEps) ? aniEps : []);
          setMediaInfo({
            title,
            poster,
            backdrop,
            year,
            info: infoObj,
            resolvedTmdb: id,
            resolvedImdb: malParam || infoObj?.malId || '',
          });

          updateSeoMetadata({
            title: `Download ${title} via ZokoAnime | CineVault`,
            description: `High-speed 1080p anime downloads for ${title} with Sub and Dub audio on CineVault.`,
            ogImage: backdrop || poster,
            ogType: 'video.other',
          });

          // Resolve official title logo for anime
          api.resolveTitleLogo(title, 'anime').then((logo) => {
            if (!cancelled && logo) setLogoUrl(logo);
          }).catch(() => {});

          setLoading(false);
          return;
        }

        let originalLanguage = '';
        let productionCountries: string[] = [];
        let releaseYearNum = 0;

        // Movie or TV Series (Multi-Provider: NxSha, Febbox, Bollyflix, 4KHDHub, VidGod)
        if (type === 'tv') {
          const details = await api.getDetails('tv', id);
          const show = api.mapToInternalMovie({ ...details, media_type: 'tv' });
          if (show) {
            title = show.title || 'TV Series';
            poster = show.posterUrl || '';
            backdrop = show.backdropUrl || '';
            year = show.year ? String(show.year) : '';
            resolvedImdb = details.external_ids?.imdb_id || imdbParam;
            infoObj = show;
            originalLanguage = details.original_language || '';
            productionCountries = details.production_countries?.map((c: any) => c.iso_3166_1) || [];
            releaseYearNum = show.year || 0;
          }
        } else {
          const details = await api.getDetails('movie', id);
          const mov = api.mapToInternalMovie({ ...details, media_type: 'movie' });
          if (mov) {
            title = mov.title || 'Movie';
            poster = mov.posterUrl || '';
            backdrop = mov.backdropUrl || '';
            year = mov.year ? String(mov.year) : '';
            resolvedImdb = details.imdb_id || details.external_ids?.imdb_id || imdbParam;
            infoObj = mov;
            originalLanguage = details.original_language || '';
            productionCountries = details.production_countries?.map((c: any) => c.iso_3166_1) || [];
            releaseYearNum = mov.year || 0;
          }
        }

        if (cancelled) return;

        setMediaInfo({
          title,
          poster,
          backdrop,
          year,
          info: infoObj,
          resolvedTmdb,
          resolvedImdb,
          originalLanguage,
          productionCountries,
        });

        // Resolve official title logo for movie / series
        api.resolveTmdbLogo(type === 'tv' ? 'tv' : 'movie', resolvedTmdb).then(async (logo) => {
          const finalLogo = logo || (await api.resolveTitleLogo(title, type === 'tv' ? 'tv' : 'movie'));
          if (!cancelled && finalLogo) setLogoUrl(finalLogo);
        }).catch(() => {});

        updateSeoMetadata({
          title: `Download ${title} High-Speed | CineVault`,
          description: `Download ${title} in 4K UHD, 1080p, and 720p with multi-audio options on CineVault.`,
          ogImage: backdrop || poster,
          ogType: 'video.other',
        });

        // Query multi-provider download API for movies and series
        const dlRes = await fetchDownloads({
          type: type === 'tv' ? 'tv' : 'movie',
          id: resolvedTmdb,
          season,
          episode: initialEpisode,
          imdbId: resolvedImdb,
          title,
          originalLanguage,
          productionCountries,
          releaseYear: releaseYearNum,
        });

        if (!cancelled) {
          setData(dlRes);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Download fetch failed:', err);
          setError(err?.message || 'Could not fetch downloads at this time.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, type, season, initialEpisode, imdbParam, malParam]);

  // Keyboard Shortcuts: S for Sub, D for Dub, Escape to go back
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 's' || e.key === 'S') {
        if (type === 'anime') {
          setAnimeTrack('sub');
          showToast('ZokoAnime: Subtitles Track (S)');
        } else {
          setAudioFilter((prev) => (prev === 'english' ? 'all' : 'english'));
          showToast('Filter: Sub / English Audio');
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (type === 'anime') {
          setAnimeTrack('dub');
          showToast('ZokoAnime: English Dub Track (D)');
        } else {
          setAudioFilter((prev) => (prev === 'hindi' ? 'all' : 'hindi'));
          showToast('Filter: Dub / Hindi Audio');
        }
      } else if (e.key === 'Escape') {
        window.history.back();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [type, showToast]);

  const filteredLinks = useMemo(() => {
    if (!data?.downloads) return [];

    let list = [...data.downloads];

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'oneclick') {
        list = list.filter((item) => item.isOneClick);
      } else {
        list = list.filter((item) => (item.category || 'cloud') === categoryFilter);
      }
    }

    if (qualityFilter !== 'all') {
      list = list.filter((item) => item.quality === qualityFilter);
    }

    if (audioFilter !== 'all') {
      list = list.filter((item) => {
        const audio = item.audio.toLowerCase();
        if (audioFilter === 'hindi') return audio.includes('hindi') || audio.includes('hin') || audio.includes('dual');
        if (audioFilter === 'english') return audio.includes('english') || audio.includes('sub');
        if (audioFilter === 'dual') return audio.includes('dual') || audio.includes('+');
        if (audioFilter === 'sub') return audio.includes('sub');
        return true;
      });
    }

    if (sortBy === 'size') {
      list.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
    }

    return list;
  }, [data, categoryFilter, qualityFilter, audioFilter, sortBy]);

  const hasOneClick = useMemo(() => {
    return data?.downloads?.some((d) => d.isOneClick) ?? false;
  }, [data]);

  const availableCategories = useMemo(() => {
    if (!data?.downloads) return new Set<string>();
    return new Set(data.downloads.map((d) => d.category || 'cloud'));
  }, [data]);

  const handleCopyLink = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      showToast('Download link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Failed to copy link');
    }
  };

  // Anime Helpers (ZokoAnime)
  const effectiveMalId = malParam && malParam !== '0' ? malParam : (mediaInfo?.info?.malId || '');
  const zokoSource = effectiveMalId ? 'mal' : 'anilist';
  const zokoTargetId = effectiveMalId || id;
  const zokoDownloadUrl = `https://zokoanime.video/download/${zokoSource}/${zokoTargetId}/${animeEpisode}/${animeTrack}`;
  const selectedAnimeEp = animeEpisodes.find((ep) => ep.number === animeEpisode || ep.episode === animeEpisode);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden pt-20 pb-28 select-none">
      {/* Dynamic Background Glow */}
      {mediaInfo?.backdrop && (
        <div
          className="absolute top-0 left-0 right-0 h-[480px] overflow-hidden pointer-events-none -z-10 opacity-25 filter blur-[90px] scale-105"
          aria-hidden="true"
        >
          <img src={mediaInfo.backdrop} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Breadcrumb & Return Nav */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                goToDetail(id, type);
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-white/10 hover:border-brand/40 text-xs font-semibold text-foreground/80 hover:text-brand transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (type === 'anime') {
                  goToWatch(id, 'anime', undefined, animeEpisode, effectiveMalId);
                } else if (type === 'tv') {
                  goToWatch(id, 'tv', season, initialEpisode);
                } else {
                  goToWatch(id, 'movie');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-background text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-lg shadow-brand/20"
            >
              <Film className="w-3.5 h-3.5 fill-current" />
              <span>Watch Online</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Download className="w-6 h-6 text-brand animate-bounce" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                {type === 'anime' ? 'Connecting to ZokoAnime Cloud...' : 'Querying High-Speed Cloud Providers...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {type === 'anime'
                  ? 'Preparing 1080p anime download nodes for Sub & Dub tracks'
                  : 'Aggregating Febbox, Bollyflix, NxSha, 4KHDHub, Defe, Films365, and VidGod mirrors'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-card/60 border border-white/10 text-center max-w-md mx-auto my-12 space-y-4">
            <p className="text-sm text-red-400 font-semibold">{error}</p>
            <p className="text-xs text-muted-foreground">
              Direct links may be temporarily throttled. You can try again or open direct mirrors:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {type === 'anime' && (
                <a
                  href={zokoDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-background text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open ZokoAnime Directly</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SEPARATE ANIME DOWNLOAD STUDIO (POWERED BY ZOKOANIME)              */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && type === 'anime' && (
          <div className="space-y-8">
            {/* Anime Hero Header Card */}
            <div className="relative rounded-3xl bg-card/85 backdrop-blur-2xl border border-white/15 p-6 sm:p-8 shadow-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {mediaInfo?.poster && (
                  <div className="w-24 h-36 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-xl bg-black/40 relative">
                    <img src={mediaInfo.poster} alt={mediaInfo?.title || 'Anime'} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-brand text-background text-[10px] font-black uppercase font-mono">
                      EP {animeEpisode}
                    </div>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-brand/15 border border-brand/30 text-brand text-[10px] font-mono font-bold uppercase tracking-wider">
                      ZokoAnime High-Speed
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-foreground/90 text-[10px] font-mono font-bold">
                      Episode {animeEpisode}
                    </span>
                    {mediaInfo?.year && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {mediaInfo.year}
                      </span>
                    )}
                  </div>

                  {logoUrl ? (
                    <div className="mb-2">
                      <h1 className="sr-only">{mediaInfo?.title || 'Anime Download'}</h1>
                      <img
                        src={logoUrl}
                        alt={mediaInfo?.title || ''}
                        className="max-w-[min(70vw,22rem)] max-h-16 sm:max-h-20 object-contain object-left drop-shadow-xl"
                      />
                    </div>
                  ) : (
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight mb-2">
                      {mediaInfo?.title || 'Anime Download'}
                    </h1>
                  )}

                  {selectedAnimeEp?.title && !selectedAnimeEp.title.toLowerCase().startsWith('episode') && (
                    <p className="text-xs sm:text-sm text-brand font-medium truncate mb-3">
                      Episode {animeEpisode} — {selectedAnimeEp.title}
                    </p>
                  )}

                  {/* Sub / Dub Track Selector with Keyboard Shortcuts */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setAnimeTrack('sub');
                          showToast('Track set to Subtitles');
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          animeTrack === 'sub'
                            ? "bg-brand text-background shadow-md shadow-brand/20 font-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>Subtitles</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-mono">S</kbd>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAnimeTrack('dub');
                          showToast('Track set to English Dub');
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          animeTrack === 'dub'
                            ? "bg-brand text-background shadow-md shadow-brand/20 font-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>English Dub</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-mono">D</kbd>
                      </button>
                    </div>

                    <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
                      (Press <kbd className="text-foreground font-bold">S</kbd> for Sub, <kbd className="text-foreground font-bold">D</kbd> for Dub)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href={zokoDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-2xl bg-brand hover:bg-brand/90 text-background font-black text-sm flex items-center gap-2.5 transition-all shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 cursor-pointer"
                      title="Download anime episode via ZokoAnime high-speed CDN"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Ep {animeEpisode} [{animeTrack.toUpperCase()}]</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(zokoDownloadUrl, 'zoko-dl')}
                      className="px-4 py-3.5 rounded-2xl glass border border-white/10 hover:border-brand/40 text-foreground font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      {copiedId === 'zoko-dl' ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'zoko-dl' ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToWatch(id, 'anime', undefined, animeEpisode, effectiveMalId)}
                      className="px-4 py-3.5 rounded-2xl glass border border-white/10 hover:border-brand/40 text-foreground font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 text-brand fill-current" />
                      <span>Watch Online</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Episode Navigator Strip */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={animeEpisode <= 1}
                  onClick={() => setAnimeEpisode((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-foreground border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Ep</span>
                </button>

                <button
                  type="button"
                  disabled={animeEpisodes.length > 0 && animeEpisode >= animeEpisodes.length}
                  onClick={() => setAnimeEpisode((prev) => prev + 1)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-foreground border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-xs text-muted-foreground font-mono ml-2">
                  Active: <strong>Episode {animeEpisode}</strong>
                  {animeEpisodes.length > 0 && ` of ${animeEpisodes.length}`}
                </span>
              </div>

              {/* Quick filter for episodes */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter episode..."
                  value={animeEpSearch}
                  onChange={(e) => setAnimeEpSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand/50"
                />
              </div>
            </div>

            {/* All Anime Episodes Grid for Quick Downloading */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>All Episodes — Click to Select or Download</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(animeEpisodes.length > 0
                  ? animeEpisodes.filter((ep: any) => {
                      if (!animeEpSearch.trim()) return true;
                      const q = animeEpSearch.toLowerCase().trim();
                      return (
                        String(ep.number || ep.episode).includes(q) ||
                        (ep.title && ep.title.toLowerCase().includes(q))
                      );
                    })
                  : Array.from({ length: 12 }, (_, i) => ({ number: i + 1, title: `Episode ${i + 1}` }))
                ).map((ep: any) => {
                  const epNum = ep.number || ep.episode;
                  const isCurrent = epNum === animeEpisode;
                  const epUrl = `https://zokoanime.video/download/${zokoSource}/${zokoTargetId}/${epNum}/${animeTrack}`;

                  return (
                    <div
                      key={epNum}
                      onClick={() => setAnimeEpisode(epNum)}
                      className={cn(
                        "group p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                        isCurrent
                          ? "bg-brand/10 border-brand/50 shadow-md shadow-brand/10"
                          : "bg-card/70 border-white/10 hover:border-white/20 hover:bg-card"
                      )}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border",
                            isCurrent
                              ? "bg-brand text-background border-brand font-black"
                              : "bg-white/5 border-white/10 text-foreground"
                          )}
                        >
                          {epNum}
                        </div>

                        <div className="min-w-0">
                          <p className={cn("text-xs sm:text-sm font-bold truncate", isCurrent ? "text-brand" : "text-foreground group-hover:text-brand transition-colors")}>
                            {ep.title && !ep.title.toLowerCase().startsWith('episode') ? ep.title : `Episode ${epNum}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ZokoAnime • {animeTrack.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <a
                        href={epUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-brand text-background hover:bg-brand/90 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                        title={`Download Episode ${epNum} via ZokoAnime`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SEPARATE MOVIES & TV SERIES DOWNLOAD CENTER                        */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && type !== 'anime' && (
          <div>
            {/* Media Hero Card */}
            <div className="relative rounded-3xl bg-card/85 backdrop-blur-2xl border border-white/15 p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {mediaInfo?.poster && (
                  <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg bg-black/40">
                    <img src={mediaInfo.poster} alt={mediaInfo?.title || 'Media'} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-[10px] font-mono font-bold uppercase tracking-wider">
                      {type.toUpperCase()}
                    </span>
                    {type === 'tv' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-foreground/90 text-[10px] font-mono font-bold">
                        S{season} • E{initialEpisode}
                      </span>
                    )}
                    {mediaInfo?.year && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {mediaInfo.year}
                      </span>
                    )}
                  </div>

                  {logoUrl ? (
                    <div className="mb-2">
                      <h1 className="sr-only">{mediaInfo?.title || 'Download Media'}</h1>
                      <img
                        src={logoUrl}
                        alt={mediaInfo?.title || ''}
                        className="max-w-[min(70vw,22rem)] max-h-16 sm:max-h-20 object-contain object-left drop-shadow-xl"
                      />
                    </div>
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight mb-2 truncate">
                      {mediaInfo?.title || 'Download Media'}
                    </h1>
                  )}

                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl line-clamp-2">
                    Fast multi-provider downloads with direct cloud streams, resume support, and multi-language audio tracks.
                  </p>

                  {/* Status Stats Pill */}
                  {data && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-foreground/80">
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <strong>{data.downloads.length}</strong> downloads from <strong>{data.totalProviders}</strong> cloud hosts
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-foreground/80">
                        <HardDrive className="w-3.5 h-3.5 text-brand" />
                        Total bandwidth: <strong>{data.totalSizeLabel}</strong>
                      </span>
                      {data.nxshaDlUrl && (
                        <a
                          href={data.nxshaDlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all font-sans font-semibold cursor-pointer"
                          title="Open full interactive NxSha download hub"
                        >
                          <ExternalLink className="w-3 h-3 text-purple-400" />
                          NxSha Direct Hub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dedicated Bollywood & Indian Cinema Notice Banner */}
            {data?.isIndian && (
              <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-card border border-orange-500/30 flex items-center justify-between gap-4 flex-wrap shadow-lg">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-3xl shrink-0">🇮🇳</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">
                        Bollywood & Indian Regional Cinema Verified Gateways
                      </p>
                      {data.isClassic && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                          Remastered Vintage Classic
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                      Connected to dedicated high-speed cloud repositories (Bollyflix FastDL, VegaMovies V-Cloud, HDHub4u, MoviesMod) featuring original Hindi DD+ 5.1 & Atmos audio tracks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAudioFilter((a) => (a === 'hindi' ? 'all' : 'hindi'));
                      showToast(audioFilter === 'hindi' ? 'Showing all audio tracks' : 'Filtered to Hindi Audio tracks');
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5",
                      audioFilter === 'hindi'
                        ? "bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20 font-black"
                        : "bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border-orange-500/30"
                    )}
                  >
                    <span>{audioFilter === 'hindi' ? '✓ Showing Hindi Audio' : 'Filter Hindi Only'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter and Control Bar */}
            <div className="flex flex-col gap-2.5 mb-6 bg-card/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 shadow-sm">
              {/* Category selector row */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border",
                    categoryFilter === 'all'
                      ? "bg-brand text-background border-brand shadow-sm shadow-brand/20 font-bold"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                  )}
                >
                  All ({data?.downloads.length || 0})
                </button>

                {hasOneClick && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('oneclick')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5",
                      categoryFilter === 'oneclick'
                        ? "bg-emerald-500 text-black border-emerald-400 shadow-sm shadow-emerald-500/20 font-bold"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    )}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>⚡ 1-Click ({data?.downloads.filter((d) => d.isOneClick).length || 0})</span>
                  </button>
                )}

                {availableCategories.has('bollywood') && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('bollywood')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1",
                      categoryFilter === 'bollywood'
                        ? "bg-orange-500 text-black border-orange-400 shadow-sm shadow-orange-500/20 font-bold"
                        : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                    )}
                  >
                    <span>🇮🇳 Bollywood</span>
                  </button>
                )}

                {availableCategories.has('classic') && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('classic')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1",
                      categoryFilter === 'classic'
                        ? "bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/20 font-bold"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                    )}
                  >
                    <span>🏛️ Classics</span>
                  </button>
                )}

                {availableCategories.has('cloud') && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('cloud')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border",
                      categoryFilter === 'cloud'
                        ? "bg-brand text-background border-brand shadow-sm shadow-brand/20 font-bold"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Cloud Nodes
                  </button>
                )}

                {availableCategories.has('hub') && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('hub')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border",
                      categoryFilter === 'hub'
                        ? "bg-brand text-background border-brand shadow-sm shadow-brand/20 font-bold"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Cloud Hubs
                  </button>
                )}
              </div>

              {/* Resolution, Audio & Sort row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-0.5">
                {/* Resolution filter chips */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground mr-1 shrink-0">
                    Quality:
                  </span>
                  {(['all', '4K', '1080p', '720p'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQualityFilter(q)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 border",
                        qualityFilter === q
                          ? "bg-white/20 text-foreground border-white/30 font-bold"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      )}
                    >
                      {q === 'all' ? 'All' : q}
                    </button>
                  ))}
                </div>

                {/* Audio filter chips */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground mr-1 shrink-0">
                    Audio:
                  </span>
                  {(['all', 'hindi', 'english', 'dual'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAudioFilter(a)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 border capitalize",
                        audioFilter === a
                          ? "bg-white/20 text-foreground border-white/30 font-bold"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      )}
                    >
                      {a === 'all' ? 'All' : a === 'dual' ? 'Dual' : a}
                    </button>
                  ))}
                </div>

                {/* Sort toggle */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => setSortBy((s) => (s === 'quality' ? 'size' : 'quality'))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10 hover:border-brand/40 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                    title="Toggle sorting between quality and file size"
                  >
                    <ArrowUpDown className="w-3 h-3 text-brand" />
                    <span>Sort: <strong className="capitalize text-brand">{sortBy}</strong></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Empty Search Result */}
            {filteredLinks.length === 0 && data?.downloads && data.downloads.length > 0 && (
              <div className="p-12 text-center rounded-3xl bg-card/40 border border-white/5 my-6 space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No downloads match your active filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setQualityFilter('all');
                    setAudioFilter('all');
                  }}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Reset all filters to view all {data.downloads.length} downloads
                </button>
              </div>
            )}

            {/* Empty filter message */}
            {filteredLinks.length === 0 && (!data?.downloads || data.downloads.length === 0) && (
              <div className="p-12 rounded-3xl bg-card/40 border border-white/10 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No downloads available at this time.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setQualityFilter('all');
                    setAudioFilter('all');
                  }}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* Downloads List */}
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              {filteredLinks.map((item) => {
                const isScreenScape = item.providerCode === 'screenscape';
                const isHub = item.category === 'hub' || item.providerCode === 'nxsha';
                const isStream = !isScreenScape && (item.providerCode === 'videasy' || item.providerCode === 'autoembed' || item.providerCode === '2embed');
                const hasWebDl = Boolean(item.webtorUrl || item.directUrl);
                const webDlUrl = item.webtorUrl || item.directUrl;
                const isHindi = item.audio.toLowerCase().includes('hindi');
                const isDual = item.audio.toLowerCase().includes('dual');

                return (
                  <div
                    key={item.id}
                    className="group p-3 sm:p-4 rounded-2xl bg-card/60 hover:bg-card/95 border border-white/[0.07] hover:border-brand/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm hover:shadow-lg"
                  >
                    {/* Left: Quality Badge & Clean File Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Refined Quality Badge */}
                      <div
                        className={cn(
                          "w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-mono font-bold text-xs shrink-0 flex flex-col items-center justify-center border text-center transition-transform group-hover:scale-105",
                          item.quality === '4K'
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/25 shadow-sm shadow-amber-500/10"
                            : item.quality === '1080p'
                            ? "bg-brand/10 text-brand border-brand/25 shadow-sm shadow-brand/10"
                            : item.quality === '720p'
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/25"
                            : "bg-white/5 text-muted-foreground border-white/10"
                        )}
                      >
                        <span className="text-xs font-black leading-tight tracking-tight">{item.quality}</span>
                        <span className="text-[8px] font-sans opacity-60 uppercase mt-0.5">{item.format}</span>
                      </div>

                      {/* File Title & Specs */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-brand transition-colors truncate max-w-2xl" title={item.name}>
                            {item.name}
                          </p>
                          {isScreenScape && (
                            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                              IN-PLAYER DOWNLOADER
                            </span>
                          )}
                          {item.isOneClick && !isScreenScape && (
                            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                              1-CLICK
                            </span>
                          )}
                          {isHindi && !isScreenScape && (
                            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 shrink-0">
                              HINDI
                            </span>
                          )}
                        </div>

                        {/* Minimal Specs Row */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono flex-wrap">
                          {item.size && (
                            <span className="font-semibold text-foreground/90 flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-brand opacity-80" />
                              {item.size}
                            </span>
                          )}
                          {item.audio && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className={cn("text-[11px]", isHindi ? "text-orange-300/90 font-medium" : isDual ? "text-amber-300/90" : "text-foreground/75")}>
                                {item.audio}
                              </span>
                            </>
                          )}
                          {item.seeders !== undefined && item.seeders > 0 && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-emerald-400 font-sans text-[11px] font-medium">
                                {item.seeders} seeds
                              </span>
                            </>
                          )}
                          <span className="text-white/20">•</span>
                          <span className="text-[11px] text-muted-foreground/60">{item.provider}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions with Top Priority to Web Download */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap justify-end">
                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(webDlUrl || item.magnetUrl || item.url, item.id)}
                        aria-label="Copy download link"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Copy download link"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Secondary: Subtle Magnet Button for Torrent Client Users */}
                      {item.magnetUrl && (
                        <a
                          href={item.magnetUrl}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground border border-white/10 font-medium transition-all hover:scale-105 cursor-pointer"
                          title="Open Magnet in 1DM, IDM, or qBittorrent"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                          <span className="hidden sm:inline">Magnet</span>
                        </a>
                      )}

                      {/* ScreenScape Dedicated In-Player Downloader Action */}
                      {isScreenScape ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveScreenScapeUrl(item.url)}
                            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold transition-all hover:scale-105 cursor-pointer shadow-md shadow-amber-500/25"
                            title="Launch ScreenScape with built-in Download Sources (Sealx / HDHub / Mamba)"
                          >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Launch Downloader</span>
                            <Sparkles className="w-3 h-3 opacity-70" />
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Open ScreenScape in a new browser tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : hasWebDl ? (
                        <a
                          href={webDlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.directUrl ? item.name : undefined}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-brand text-background hover:bg-brand/90 font-bold transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/25"
                          title="Direct web download in your browser via cloud stream"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{item.directUrl ? 'Download MP4' : 'Web Download'}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : isHub ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs bg-purple-600/80 hover:bg-purple-600 text-white font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm"
                          title="Open cloud mirrors hub"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Open Hub</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : isStream ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs bg-cyan-600/80 hover:bg-cyan-600 text-black font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm"
                          title="Watch video stream"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Stream</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-brand text-background hover:bg-brand/90 font-bold transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/25"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Download & IDM Pro-Tips Guide */}
            <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-muted-foreground space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Working Download Methods — Fast & Reliable</span>
              </div>
              <p>
                To provide genuine, working one-click downloads without broken links or ISP blocking, CineVault connects to verified sources for{' '}
                <strong>{mediaInfo?.title}</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" /> 1. Web Download & Swarms
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Click <strong>Web Download</strong> to stream and save files directly in your browser without any apps, or use <strong>Magnet</strong> for 1DM / IDM.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-amber-400" /> 2. ScreenScape In-Player
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Click <strong>Launch Downloader</strong> to open the player. Click the <strong>Download (⬇️)</strong> button in the bottom control bar to access <strong>Sealx</strong> & <strong>HDHub</strong> direct MP4 links.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" /> 3. Archive.org Direct MP4
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    For vintage and classic cinema, <strong>📥 1-Click Direct MP4</strong> streams and downloads genuine high-bitrate video files directly to your storage with resume support.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" /> 4. Multi-Host Cloud Hubs
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    <strong>NxSha Cloud Hub</strong> provides global CDN-backed direct drive mirrors (Google Drive, PixelDrain, Telegram) with rapid edge failover.
                  </p>
                </div>
              </div>
            </div>

            {/* ScreenScape In-Player Downloader Modal */}
            {activeScreenScapeUrl && (
              <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
                <div className="bg-card border border-white/15 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Download className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">ScreenScape In-Player Downloader</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Live Sources
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Direct 1-click download sources built right into the player</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={activeScreenScapeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all"
                        title="Open full screen in a new browser tab"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveScreenScapeUrl(null)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Close modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Step-by-Step Instruction Ribbon */}
                  <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>How to grab download:</strong> Once the player loads, click the <strong>Download (⬇️)</strong> button on the bottom control bar to open <strong>"DOWNLOAD SOURCES"</strong> (Sealx, Mamba, HDHub) with instant 1-click download links!
                    </span>
                  </div>

                  {/* Embedded Player Frame */}
                  <div className="relative w-full aspect-video bg-black flex-1 min-h-[300px] sm:min-h-[440px]">
                    <iframe
                      src={activeScreenScapeUrl}
                      title="ScreenScape Downloader Player"
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
