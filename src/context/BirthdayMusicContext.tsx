import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export interface BirthdayTrack {
  id: number;
  title: string;
  artist: string;
  tag: string;
  mood: string;
  src: string;
  coverAccent?: string;
}

export const BIRTHDAY_PLAYLIST: BirthdayTrack[] = [
  {
    id: 1,
    title: "Sailor Song",
    artist: "Gigi Perez",
    tag: "Her & Your Song 🌊",
    mood: "Sweet Acoustic",
    src: "/music/Sailor Song Gigi Perez.mp3",
    coverAccent: "#38bdf8"
  },
  {
    id: 2,
    title: "Tera Hone Laga Hoon",
    artist: "Atif Aslam & Alisha Chinai",
    tag: "Falling in Love with You 💖",
    mood: "Soulful Romantic",
    src: "/music/Tera Hone Laga Hoon.mp3",
    coverAccent: "#ec4899"
  },
  {
    id: 3,
    title: "Perfect",
    artist: "Ed Sheeran",
    tag: "Our Sunrise Video Calls 🌅",
    mood: "Pure Romance",
    src: "/music/perfect-ed-sheeran.mp3",
    coverAccent: "#f59e0b"
  },
  {
    id: 4,
    title: "All of Me",
    artist: "John Legend",
    tag: "Loving All of You 💝",
    mood: "Piano Ballad",
    src: "/music/all-of-me-john-legend.mp3",
    coverAccent: "#e11d48"
  },
  {
    id: 5,
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    tag: "Epic Love Duet ✨",
    mood: "Passionate Pop",
    src: "/music/diewithsmile.mp3",
    coverAccent: "#f43f5e"
  },
  {
    id: 6,
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    tag: "Loving You When We're 70 💫",
    mood: "Acoustic Pop",
    src: "/music/thinking-out-loud-ed-sheeran.mp3",
    coverAccent: "#10b981"
  },
  {
    id: 7,
    title: "A Thousand Years",
    artist: "Christina Perri",
    tag: "Loving You For 1000 Years ⏳",
    mood: "Cinematic Romance",
    src: "/music/thousandyear.mp3",
    coverAccent: "#fbbf24"
  },
  {
    id: 8,
    title: "Make You Feel My Love",
    artist: "Adele",
    tag: "My Shelter in Every Storm 🌧️",
    mood: "Soulful Piano",
    src: "/music/make-you-feel-my-love-adele.mp3",
    coverAccent: "#8b5cf6"
  },
  {
    id: 9,
    title: "I Love You So",
    artist: "The Walters",
    tag: "Indie Romance 💫",
    mood: "Dreamy Pop",
    src: "/music/i love you so the walters.mp3",
    coverAccent: "#a855f7"
  },
  {
    id: 10,
    title: "Blue",
    artist: "Yung Kai",
    tag: "Ocean Eyes & Warm Hugs 💙",
    mood: "Soft Indie",
    src: "/music/blue.mp3",
    coverAccent: "#0ea5e9"
  },
  {
    id: 11,
    title: "Here With Me",
    artist: "d4vd",
    tag: "Holding You Close 🫂",
    mood: "Soulful Lo-fi",
    src: "/music/herewithme.mp3",
    coverAccent: "#6366f1"
  },
  {
    id: 12,
    title: "I Wanna Be Yours",
    artist: "Arctic Monkeys",
    tag: "Midnight Passion 🌙",
    mood: "Atmospheric Rock",
    src: "/music/wanna.mp3",
    coverAccent: "#ef4444"
  },
  {
    id: 13,
    title: "CO2",
    artist: "Prateek Kuhad",
    tag: "Cozy Acoustic Love 🌿",
    mood: "Warm Acoustic",
    src: "/music/co2.mp3",
    coverAccent: "#14b8a6"
  },
  {
    id: 14,
    title: "Line Without a Hook",
    artist: "Ricky Montgomery",
    tag: "Hopelessly in Love 🎣",
    mood: "Upbeat Indie",
    src: "/music/linewithout.mp3",
    coverAccent: "#06b6d4"
  },
  {
    id: 15,
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley / Kina Grannis",
    tag: "Timeless Devotion 🤍",
    mood: "Classic Romance",
    src: "/music/canthelp.mp3",
    coverAccent: "#eab308"
  },
  {
    id: 16,
    title: "Call This Love",
    artist: "The Walters",
    tag: "Sweet Summer Butterflies 🦋",
    mood: "Feel-good Romance",
    src: "/music/callthislove.mp3",
    coverAccent: "#db2777"
  },
  {
    id: 17,
    title: "Can't Help Myself (Sugar Pie)",
    artist: "Four Tops",
    tag: "Sweet Sugar Pie Love 🍯",
    mood: "Classic Motown",
    src: "/music/cant-help-myself-four-tops.mp3",
    coverAccent: "#f97316"
  },
  {
    id: 18,
    title: "Kalank (Title Track)",
    artist: "Arijit Singh",
    tag: "Pure Bollywood Melody 🎻",
    mood: "Soulful Strings",
    src: "/music/kalank.mp3",
    coverAccent: "#ea580c"
  }
];

interface BirthdayMusicContextType {
  playlist: BirthdayTrack[];
  currentTrackIndex: number;
  currentTrack: BirthdayTrack;
  isPlaying: boolean;
  progress: number;
  duration: number;
  togglePlay: () => void;
  playTrack: (index: number) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  formatTime: (secs: number) => string;
}

const BirthdayMusicContext = createContext<BirthdayMusicContextType | undefined>(undefined);

export function BirthdayMusicProvider({ children }: { children: ReactNode }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = BIRTHDAY_PLAYLIST[currentTrackIndex];

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = BIRTHDAY_PLAYLIST[0].src;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleNext();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % BIRTHDAY_PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = BIRTHDAY_PLAYLIST[nextIdx].src;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + BIRTHDAY_PLAYLIST.length) % BIRTHDAY_PLAYLIST.length;
    setCurrentTrackIndex(prevIdx);
    if (audioRef.current) {
      audioRef.current.src = BIRTHDAY_PLAYLIST[prevIdx].src;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const playTrack = (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTrackIndex(index);
    const track = BIRTHDAY_PLAYLIST[index];
    const targetSrc = encodeURI(track.src);
    if (!audio.src.endsWith(targetSrc)) {
      audio.src = track.src;
    }
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn("Play error:", err);
    });
  };

  const pauseTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Resume error:", err);
      });
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const targetSrc = encodeURI(BIRTHDAY_PLAYLIST[currentTrackIndex].src);
      if (!audio.src || !audio.src.endsWith(targetSrc)) {
        audio.src = BIRTHDAY_PLAYLIST[currentTrackIndex].src;
      }
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Play error:", err);
      });
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <BirthdayMusicContext.Provider
      value={{
        playlist: BIRTHDAY_PLAYLIST,
        currentTrackIndex,
        currentTrack,
        isPlaying,
        progress,
        duration,
        togglePlay,
        playTrack,
        pauseTrack,
        resumeTrack,
        nextTrack: handleNext,
        prevTrack: handlePrev,
        seekTo,
        formatTime
      }}
    >
      {children}
    </BirthdayMusicContext.Provider>
  );
}

export function useBirthdayMusic() {
  const context = useContext(BirthdayMusicContext);
  if (!context) {
    throw new Error('useBirthdayMusic must be used within a BirthdayMusicProvider');
  }
  return context;
}
