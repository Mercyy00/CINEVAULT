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
  Radio,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowUpDown,
  SlidersHorizontal,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters for Movie/TV
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

          setLoading(false);
          return;
        }

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
        });

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

    if (qualityFilter !== 'all') {
      list = list.filter((item) => item.quality === qualityFilter);
    }

    if (audioFilter !== 'all') {
      list = list.filter((item) => {
        const audio = item.audio.toLowerCase();
        if (audioFilter === 'hindi') return audio.includes('hindi');
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
  }, [data, qualityFilter, audioFilter, sortBy]);

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
            {data?.mirrorUrl && (
              <a
                href={data.mirrorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-xs font-semibold text-foreground hover:text-brand transition-all cursor-pointer shadow-sm"
                title="Open download page mirror on TheOGPirateBot"
              >
                <ExternalLink className="w-3.5 h-3.5 text-brand" />
                <span className="hidden sm:inline">TheOGPirateBot Mirror</span>
                <span className="sm:hidden">Mirror</span>
              </a>
            )}

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

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight mb-2">
                    {mediaInfo?.title || 'Anime Download'}
                  </h1>

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

                  <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight mb-2 truncate">
                    {mediaInfo?.title || 'Download Media'}
                  </h1>

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

            {/* Filter and Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-md">
              {/* Resolution filter chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-brand" /> Quality:
                </span>
                {(['all', '4K', '1080p', '720p', '480p'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQualityFilter(q)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
                      qualityFilter === q
                        ? "bg-brand text-background border-brand shadow-sm shadow-brand/20"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    {q === 'all' ? 'All Qualities' : q}
                  </button>
                ))}
              </div>

              {/* Audio filter chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-brand" /> Audio:
                </span>
                {(['all', 'hindi', 'english', 'dual'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudioFilter(a)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border capitalize",
                      audioFilter === a
                        ? "bg-brand text-background border-brand shadow-sm shadow-brand/20"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    {a === 'all' ? 'All Audio' : a === 'dual' ? 'Dual Audio' : `${a} Audio`}
                  </button>
                ))}
              </div>

              {/* Sort toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSortBy(s => s === 'quality' ? 'size' : 'quality')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:border-brand/40 text-foreground hover:text-brand transition-all cursor-pointer"
                  title="Toggle sorting between quality and file size"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
                  <span>Sort: <strong className="text-brand capitalize">{sortBy}</strong></span>
                </button>
              </div>
            </div>

            {/* Empty Search Result */}
            {filteredLinks.length === 0 && data?.downloads && data.downloads.length > 0 && (
              <div className="p-12 text-center rounded-2xl bg-card/40 border border-white/5 my-6 space-y-2">
                <p className="text-sm font-bold text-foreground">No downloads match your active filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQualityFilter('all');
                    setAudioFilter('all');
                  }}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* Empty filter message */}
            {filteredLinks.length === 0 && (!data?.downloads || data.downloads.length === 0) && (
              <div className="p-12 rounded-3xl bg-card/40 border border-white/10 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No downloads match your active filters.</p>
                <button
                  type="button"
                  onClick={() => {
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
            <div className="grid grid-cols-1 gap-3">
              {filteredLinks.map((item) => (
                <div
                  key={item.id}
                  className="group p-4 sm:p-5 rounded-2xl bg-card/80 hover:bg-card border border-white/10 hover:border-brand/40 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Quality Pill & File details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "px-3 py-2 rounded-xl font-mono font-bold text-xs shrink-0 flex flex-col items-center justify-center border",
                        item.quality === '4K'
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : item.quality === '1080p'
                          ? "bg-brand/20 text-brand border-brand/40"
                          : item.quality === '720p'
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                          : "bg-white/10 text-muted-foreground border-white/10"
                      )}
                    >
                      <span>{item.quality}</span>
                      <span className="text-[9px] opacity-75">{item.format}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-brand transition-colors truncate">
                          {item.name}
                        </span>
                        {item.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold font-mono">
                            STABLE DRIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap font-mono">
                        <span className="font-semibold text-foreground/80">{item.provider}</span>
                        {item.audio && (
                          <>
                            <span>•</span>
                            <span className="text-brand/90">{item.audio}</span>
                          </>
                        )}
                        {item.size && (
                          <>
                            <span>•</span>
                            <span>{item.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.url, item.id)}
                      aria-label="Copy direct download link"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title="Copy link"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-background font-bold text-xs transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/20"
                      title="Start direct download"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Note & Disclaimer */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p>
                <strong>Tip:</strong> Pinned links open the release's permanent drive page. Third-party provider links rotate without notice — if one stalls, grab another quality tier.
              </p>
              {data?.mirrorUrl && (
                <a
                  href={data.mirrorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  Open TheOGPirateBot Mirror <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
