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
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { api, anilistApi } from '../api';
import { fetchDownloads, type UnifiedDownloadLink, type DownloadResponse } from '../services/downloadService';
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

  // Filters
  const [qualityFilter, setQualityFilter] = useState<'all' | '4K' | '1080p' | '720p' | '480p'>('all');
  const [audioFilter, setAudioFilter] = useState<'all' | 'hindi' | 'english' | 'dual' | 'sub'>('all');
  const [sortBy, setSortBy] = useState<'quality' | 'size'>('quality');

  // URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const rawType = (searchParams.get('type') || 'movie').toLowerCase();
  const type: 'movie' | 'tv' | 'anime' = rawType === 'anime' || rawType === 'ani' ? 'anime' : rawType === 'tv' ? 'tv' : 'movie';
  const id = searchParams.get('id') || '';
  const imdbParam = searchParams.get('imdb') || '';
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);

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
          // Anime: fetch from AniList
          const { movie: aniMovie } = await anilistApi.getDetails(id);
          if (aniMovie) {
            title = aniMovie.title;
            poster = aniMovie.posterUrl || '';
            backdrop = aniMovie.backdropUrl || '';
            year = aniMovie.year ? String(aniMovie.year) : '';
            infoObj = aniMovie;

            // Resolve TMDB ID for anime to query multi-provider downloads
            try {
              const tvRes = await api.searchTv(title);
              const match = tvRes.results?.[0];
              if (match?.id) {
                resolvedTmdb = String(match.id);
              }
            } catch {}
          }
        } else if (type === 'tv') {
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
          // Movie
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

        // Query upstream download providers
        const dlRes = await fetchDownloads({
          type: type === 'anime' ? 'tv' : type,
          id: resolvedTmdb,
          season,
          episode,
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
  }, [id, type, season, episode, imdbParam]);

  // Keyboard Shortcuts: S for Sub/English, D for Dub/Hindi, Escape to go back
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 's' || e.key === 'S') {
        setAudioFilter((prev) => (prev === 'english' ? 'all' : 'english'));
        showToast('Filter: Sub / English Audio');
      } else if (e.key === 'd' || e.key === 'D') {
        setAudioFilter((prev) => (prev === 'hindi' ? 'all' : 'hindi'));
        showToast('Filter: Dub / Hindi Audio');
      } else if (e.key === 'Escape') {
        window.history.back();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showToast]);

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

  const handleCopyLink = async (link: UnifiedDownloadLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      showToast('Download link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Failed to copy link');
    }
  };

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
                  goToWatch(id, 'anime', undefined, episode);
                } else if (type === 'tv') {
                  goToWatch(id, 'tv', season, episode);
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
                {type !== 'movie' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-foreground/90 text-[10px] font-mono font-bold">
                    {type === 'tv' ? `S${season} • E${episode}` : `Episode ${episode}`}
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Download className="w-6 h-6 text-brand animate-bounce" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Querying High-Speed Cloud Providers...</p>
              <p className="text-xs text-muted-foreground mt-1">Aggregating Febbox, Bollyflix, 4KHDHub, Defe, Films365, and VidGod mirrors</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-card/60 border border-white/10 text-center max-w-md mx-auto my-12 space-y-4">
            <p className="text-sm text-red-400 font-semibold">{error}</p>
            <p className="text-xs text-muted-foreground">
              Direct links may be temporarily throttled. You can open the mirror on TheOGPirateBot or retry:
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {data?.mirrorUrl && (
                <a
                  href={data.mirrorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-background text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Mirror</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Downloads Content */}
        {!loading && !error && data && (
          <div>
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
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
                      audioFilter === a
                        ? "bg-brand text-background border-brand shadow-sm shadow-brand/20"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    {a === 'all'
                      ? 'All Audio'
                      : a === 'hindi'
                      ? 'Hindi (D)'
                      : a === 'english'
                      ? 'English (S)'
                      : 'Dual Audio'}
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

            {/* Empty filter message */}
            {filteredLinks.length === 0 && (
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
                      onClick={() => handleCopyLink(item)}
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
