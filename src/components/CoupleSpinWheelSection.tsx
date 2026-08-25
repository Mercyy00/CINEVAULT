import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  
  Lock, 
  Flame, 
  RotateCcw, 
  
  Play, 
  Pause, 
  Timer, 
  
  
  
  Music, 
  CheckCircle2, 
  Shuffle 
  
  
} from 'lucide-react';
import { cn } from '../lib/utils';

// 10 Alternating Slices: 5 Jay, 5 Divya
interface WheelSlice {
  id: number;
  name: 'Jay' | 'Divya';
  displayName: string;
  avatar: string;
  color: string;
  textColor: string;
  accent: string;
}

const WHEEL_SLICES: WheelSlice[] = [
  { id: 0, name: 'Jay', displayName: '👑 Jay', avatar: '🕷️', color: '#1e1b4b', textColor: '#38bdf8', accent: '#0284c7' },
  { id: 1, name: 'Divya', displayName: '🌸 Divya', avatar: '👑', color: '#831843', textColor: '#f472b6', accent: '#db2777' },
  { id: 2, name: 'Jay', displayName: '⚡ Jay', avatar: '🎮', color: '#0f172a', textColor: '#60a5fa', accent: '#2563eb' },
  { id: 3, name: 'Divya', displayName: '💖 Divu', avatar: '🌻', color: '#9d174d', textColor: '#fbcfe8', accent: '#e11d48' },
  { id: 4, name: 'Jay', displayName: '👑 Jay', avatar: '🎩', color: '#312e81', textColor: '#a78bfa', accent: '#7c3aed' },
  { id: 5, name: 'Divya', displayName: '✨ Divya', avatar: '🎂', color: '#701a75', textColor: '#f0abfc', accent: '#c026d3' },
  { id: 6, name: 'Jay', displayName: '🕷️ Jay', avatar: '🏹', color: '#0369a1', textColor: '#bae6fd', accent: '#0284c7' },
  { id: 7, name: 'Divya', displayName: '💛 Divu', avatar: '🌼', color: '#881337', textColor: '#fecdd3', accent: '#f43f5e' },
  { id: 8, name: 'Jay', displayName: '🕶️ Jay', avatar: '🎲', color: '#1e293b', textColor: '#cbd5e1', accent: '#64748b' },
  { id: 9, name: 'Divya', displayName: '👑 Divya', avatar: '💫', color: '#be185d', textColor: '#fdf2f8', accent: '#ec4899' },
];

type GameMode = 'singing' | 'secrets' | 'dares';

interface SecretQuestion {
  id: number;
  question: string;
  category: 'romantic' | 'funny' | 'nostalgic';
  hint: string;
}

const SECRET_QUESTIONS: SecretQuestion[] = [
  {
    id: 1,
    question: "What was the exact moment or text when you realized you had fallen completely in love with the other person? 💖",
    category: 'romantic',
    hint: "Think back to our early days & butterflies!"
  },
  {
    id: 2,
    question: "Confess: What is one secretly adorable habit of theirs that always makes you smile like a goofball? 🤭",
    category: 'funny',
    hint: "Something cute only you know about them!"
  },
  {
    id: 3,
    question: "What was your very first honest thought when you saw that Luffy PFP / Instagram group chat message? 👒",
    category: 'nostalgic',
    hint: "Be 100% honest, no filter!"
  },
  {
    id: 4,
    question: "If our entire love story was made into a Bollywood movie, what would the title and romantic climax scene be? 🎬",
    category: 'romantic',
    hint: "Full filmy drama mode on!"
  },
  {
    id: 5,
    question: "What is the most embarrassing thing you did just to get their attention or make them laugh on call? 🙈",
    category: 'funny',
    hint: "Midnight jokes, weird voices, or accidental screenshots!"
  },
  {
    id: 6,
    question: "What is a secret romantic dream trip you want the two of us to go on together in the future? ✈️🏝️",
    category: 'romantic',
    hint: "Mountains, beaches, or quiet stargazing!"
  },
  {
    id: 7,
    question: "What is one promise you want to make to them right now as Divu turns 21? 🌟",
    category: 'romantic',
    hint: "From the bottom of your heart."
  },
  {
    id: 8,
    question: "What is the funniest nickname you've ever secretly thought of calling them? 🧸",
    category: 'funny',
    hint: "Besides Besan Ka Ladduuu & Goluuu!"
  },
  {
    id: 9,
    question: "Describe your favorite photo of the two of us and why it means so much to you. 📸✨",
    category: 'nostalgic',
    hint: "A memory etched forever."
  },
  {
    id: 10,
    question: "If you could freeze one moment we spent talking or laughing together forever, which moment would it be? ⏳💖",
    category: 'romantic',
    hint: "That late-night conversation where time stood still."
  }
];

interface WildDare {
  id: number;
  title: string;
  instruction: string;
  durationSeconds: number;
  badge: string;
}

const WILD_DARES: WildDare[] = [
  {
    id: 1,
    title: "Goofy Face Selfie 📸",
    instruction: "Snap a quick selfie right now making the most hilarious, exaggerated silly face possible and save it as a birthday memory!",
    durationSeconds: 30,
    badge: "Camera Dare 🤳"
  },
  {
    id: 2,
    title: "Household Scavenger Hunt 🏠",
    instruction: "You have 30 seconds! Run and bring 1 yellow or sunflower-themed item from your room right now!",
    durationSeconds: 30,
    badge: "Speed Dare 🏃"
  },
  {
    id: 3,
    title: "Bollywood Melodrama Acting 🎬",
    instruction: "Deliver a classic Shah Rukh Khan or Deepika dialogue with 100% theatrical expression, hand gestures, and passion!",
    durationSeconds: 45,
    badge: "Drama Dare 🎭"
  },
  {
    id: 4,
    title: "15-Second Happy Birthday Victory Dance 💃",
    instruction: "Do a 15-second silly victory dance without laughing. If you laugh, add 5 more seconds!",
    durationSeconds: 20,
    badge: "Groove Dare 🕺"
  },
  {
    id: 5,
    title: "Rapid-Fire 5 Compliments Blitz 💐",
    instruction: "Shower the other person with 5 genuine, sweet compliments in 10 seconds without stopping or pausing!",
    durationSeconds: 15,
    badge: "Sweet Dare 💖"
  },
  {
    id: 6,
    title: "Cute Habit Mimicry 🧸",
    instruction: "Imitate the other person's favorite pout, laugh, or signature catchphrase for 15 seconds!",
    durationSeconds: 25,
    badge: "Funny Dare 🤭"
  },
  {
    id: 7,
    title: "Instant 2-Line Rhyming Shayari ✍️",
    instruction: "Compose an impromptu 2-line funny or romantic Shayari dedicated to Divu's 21st birthday on the spot!",
    durationSeconds: 40,
    badge: "Poet Dare 📜"
  },
  {
    id: 8,
    title: "Royal Queen's Wish 👑",
    instruction: "Divya gets 1 unconditional royal command that Jay MUST fulfill right now with a bow!",
    durationSeconds: 60,
    badge: "Royal Privilege 👑"
  }
];

const SONG_SUGGESTIONS = [
  "Tera Hone Laga Hoon (Romantic Bollywood)",
  "Sailor Song (Sweet Acoustic)",
  "I Love You So (Indie Romance)",
  "Kalank Title Track (Soulful Classical)",
  "Tum Se Hi (Jab We Met Vibes)",
  "Kesariya (Pyaar Bhara Melodrama)",
  "Funny cartoon theme song in high-pitched voice 🐥",
  "Goofy 90s Bollywood item song rap 🕺"
];

export function CoupleSpinWheelSection() {
  const [activeMode, setActiveMode] = useState<GameMode>('singing');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<WheelSlice | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Score Tracking
  const [jayScore, setJayScore] = useState(0);
  const [divuScore, setDivuScore] = useState(0);

  // Singing Mode State
  const [customSong, setCustomSong] = useState('');
  const [suggestedSongIndex, setSuggestedSongIndex] = useState(0);
  const [isSingingTimerActive, setIsSingingTimerActive] = useState(false);
  const [singingSeconds, setSingingSeconds] = useState(30);

  // Secret Mode State
  const [secretIndex, setSecretIndex] = useState(0);

  // Dare Mode State
  const [dareIndex, setDareIndex] = useState(0);
  const [dareTimer, setDareTimer] = useState(30);
  const [isDareRunning, setIsDareRunning] = useState(false);

  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dareIntervalRef = useRef<any>(null);
  const singingIntervalRef = useRef<any>(null);

  // Draw the 10-Slice Wheel on Canvas
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 14;
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Draw Outer Golden Rim with Neon Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.75)';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    // Draw Outer Rim Light Bulbs
    for (let i = 0; i < 20; i++) {
      const angle = (i * (2 * Math.PI)) / 20;
      const bulbX = center + (radius + 4) * Math.cos(angle);
      const bulbY = center + (radius + 4) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#ec4899';
      ctx.shadowColor = i % 2 === 0 ? '#fde047' : '#f43f5e';
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    // Draw 10 Slices
    WHEEL_SLICES.forEach((slice, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice Fill
      const grad = ctx.createRadialGradient(center, center, 20, center, center, radius);
      grad.addColorStop(0, slice.color);
      grad.addColorStop(1, slice.name === 'Jay' ? '#090d16' : '#2b0716');
      ctx.fillStyle = grad;
      ctx.fill();

      // Slice Golden Divider Lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.stroke();

      // Slice Text & Emblem
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.textColor;
      ctx.font = 'bold 15px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(slice.displayName, radius - 24, 6);

      // Icon Avatar
      ctx.font = '16px sans-serif';
      ctx.fillText(slice.avatar, radius - 76, 6);
      ctx.restore();

      ctx.restore();
    });

    // Center Golden Hub Cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(center - 10, center - 10, 5, center, center, 36);
    hubGrad.addColorStop(0, '#fef08a');
    hubGrad.addColorStop(0.5, '#f59e0b');
    hubGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Center Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SPIN', center, center);
    ctx.restore();

  }, []);

  // Dare Countdown Timer
  useEffect(() => {
    if (isDareRunning && dareTimer > 0) {
      dareIntervalRef.current = setInterval(() => {
        setDareTimer(prev => {
          if (prev <= 1) {
            setIsDareRunning(false);
            clearInterval(dareIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(dareIntervalRef.current);
    }
    return () => clearInterval(dareIntervalRef.current);
  }, [isDareRunning, dareTimer]);

  // Singing Countdown Timer
  useEffect(() => {
    if (isSingingTimerActive && singingSeconds > 0) {
      singingIntervalRef.current = setInterval(() => {
        setSingingSeconds(prev => {
          if (prev <= 1) {
            setIsSingingTimerActive(false);
            clearInterval(singingIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(singingIntervalRef.current);
    }
    return () => clearInterval(singingIntervalRef.current);
  }, [isSingingTimerActive, singingSeconds]);

  const spinCountRef = useRef(0);
  const lastWinnerRef = useRef<'Jay' | 'Divya' | null>(null);

  // Spin Wheel Action (Fair Alternating Turns + Exact Slice Alignment)
  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowResultModal(false);

    // Smart Fair Selection: Guarantee alternating between Jay and Divya so it never gets stuck on one person!
    let targetPool: number[];
    if (lastWinnerRef.current === 'Jay') {
      // Pick one of Divya's slices: [1, 3, 5, 7, 9]
      targetPool = [1, 3, 5, 7, 9];
    } else if (lastWinnerRef.current === 'Divya') {
      // Pick one of Jay's slices: [0, 2, 4, 6, 8]
      targetPool = [0, 2, 4, 6, 8];
    } else {
      // First spin: Divu gets the opening birthday honor!
      targetPool = [1, 3, 5, 7, 9];
    }

    const targetSliceIndex = targetPool[Math.floor(Math.random() * targetPool.length)];
    const chosenWinner = WHEEL_SLICES[targetSliceIndex];
    lastWinnerRef.current = chosenWinner.name;
    spinCountRef.current += 1;

    // Slice center angle for targetSliceIndex: targetSliceIndex * 36 + 18
    const sliceDeg = 36;
    const targetSliceCenter = targetSliceIndex * sliceDeg + sliceDeg / 2;
    
    // Top pointer is at 270 degrees (12 o'clock).
    // Target rotation angle: (270 - targetSliceCenter + 3600) % 360
    const targetAngle = (270 - targetSliceCenter + 3600) % 360;
    const currentMod = currentRotation % 360;
    let forwardDiff = (targetAngle - currentMod + 360) % 360;
    if (forwardDiff < 90) forwardDiff += 360;

    const fullSpins = (5 + (spinCountRef.current % 2)) * 360; // 5-6 full revolutions
    const newTotalRotation = currentRotation + fullSpins + forwardDiff;

    setCurrentRotation(newTotalRotation);

    // Land on target after animation duration (4.5s)
    setTimeout(() => {
      setSelectedWinner(chosenWinner);
      setIsSpinning(false);
      setShowResultModal(true);

      // Randomize initial prompts for the winner
      setSuggestedSongIndex(Math.floor(Math.random() * SONG_SUGGESTIONS.length));
      setSecretIndex(Math.floor(Math.random() * SECRET_QUESTIONS.length));
      const newDare = Math.floor(Math.random() * WILD_DARES.length);
      setDareIndex(newDare);
      setDareTimer(WILD_DARES[newDare].durationSeconds);
      setIsDareRunning(false);
    }, 4550);
  };

  const handleCompleteTask = (player: 'Jay' | 'Divya') => {
    if (player === 'Jay') {
      setJayScore(prev => prev + 1);
    } else {
      setDivuScore(prev => prev + 1);
    }
    setShowResultModal(false);
  };

  return (
    <div id="games-wheel-section" className="relative w-full max-w-6xl mx-auto py-16 px-3 sm:px-8 select-none">
      
      {/* Background Ambient Party Neon Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] rounded-full blur-[170px] opacity-25 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, #ec4899 50%, #6366f1 100%)' }}
      />

      {/* Header Banner & Scroll Hook */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold mb-4 shadow-md backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Couple Party Game • Jay & Divu's Wheel 🎡💖</span>
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight leading-tight mb-3"
        >
          Wheel of <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-brand bg-clip-text text-transparent">Destiny & Dares</span> 🎲✨
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed"
        >
          Spin the wheel to pick whose turn it is, then conquer one of the <strong>3 Fun Game Modes</strong>: Singing Challenge, Secret Reveal, or Wild Dares!
        </motion.p>
      </div>

      {/* GAME MODE SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
        {[
          { id: 'singing', label: '🎤 Singing Challenge', desc: 'Demand & sing songs', color: 'border-pink-500/50 bg-pink-500/10 text-pink-400' },
          { id: 'secrets', label: '🤫 Reveal a Secret', desc: 'Heartwarming truths', color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
          { id: 'dares', label: '🎭 Wild Dares', desc: 'Fun interactive tasks', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as GameMode)}
            className={cn(
              "px-4 sm:px-6 py-2.5 rounded-2xl border font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer",
              activeMode === mode.id
                ? "bg-brand text-background shadow-[0_0_20px_rgba(232,133,42,0.4)] border-brand scale-105"
                : "glass border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
            )}
          >
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN GAME ARENA (GRID: WHEEL ON LEFT, ACTIVE GAME CARD ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: THE 10-SLICE SPIN WHEEL */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          
          {/* Wheel Pointer Arrow at Top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 animate-pulse" />
          </div>

          {/* Canvas Wheel Rotating Wrapper */}
          <div className="relative p-2 rounded-full glass border-2 border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <motion.div
              animate={{ rotate: currentRotation }}
              transition={{
                duration: 4.5,
                ease: [0.15, 0.9, 0.2, 1]
              }}
              className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-full flex items-center justify-center origin-center"
            >
              <canvas
                ref={wheelCanvasRef}
                width={380}
                height={380}
                className="w-full h-full"
              />
            </motion.div>
          </div>

          {/* Big Glowing Spin Button */}
          <motion.button
            onClick={spinWheel}
            disabled={isSpinning}
            whileHover={!isSpinning ? { scale: 1.06 } : {}}
            whileTap={!isSpinning ? { scale: 0.95 } : {}}
            className={cn(
              "mt-6 px-8 sm:px-10 py-3.5 rounded-full font-display font-black text-sm sm:text-base tracking-wider uppercase transition-all duration-300 shadow-2xl flex items-center gap-2 cursor-pointer",
              isSpinning
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-amber-500 via-brand to-pink-500 text-black hover:brightness-110 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            )}
          >
            <Sparkles className={cn("w-5 h-5", isSpinning && "animate-spin")} />
            <span>{isSpinning ? "Spinning the Wheel..." : "🎡 SPIN THE WHEEL!"}</span>
          </motion.button>

          {/* Mini Scoreboard */}
          <div className="flex items-center gap-4 mt-6 px-6 py-2.5 rounded-2xl glass border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 font-bold">Jay: {jayScore} ⭐</span>
            </div>
            <span className="text-muted-foreground/60">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span className="text-pink-400 font-bold">Divu: {divuScore} 👑</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE GAME CARD & CHALLENGE CONTAINER */}
        <div className="lg:col-span-6">
          <div className="glass bg-card/90 border-2 border-border/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            
            {/* Active Turn Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg shadow-sm">
                  {activeMode === 'singing' ? '🎤' : activeMode === 'secrets' ? '🤫' : '🎭'}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-black text-foreground">
                    {activeMode === 'singing' && "Singing Challenge 🎵"}
                    {activeMode === 'secrets' && "Reveal a Heart Secret 💖"}
                    {activeMode === 'dares' && "Wild Birthday Dare ⚡"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedWinner ? (
                      <span>Current Turn: <strong className={selectedWinner.name === 'Jay' ? 'text-cyan-400' : 'text-pink-400'}>{selectedWinner.displayName}</strong></span>
                    ) : (
                      <span>Spin the wheel to assign the next task!</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedWinner && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold font-mono border",
                  selectedWinner.name === 'Jay' 
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" 
                    : "bg-pink-500/15 border-pink-500/30 text-pink-400"
                )}>
                  {selectedWinner.avatar} {selectedWinner.name}
                </div>
              )}
            </div>

            {/* 1. MODE: SINGING CHALLENGE */}
            {activeMode === 'singing' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/25">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 block mb-1">
                    🎤 Challenge Rule:
                  </span>
                  <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                    {selectedWinner?.name === 'Jay' 
                      ? "👑 Divya gets to demand ANY song for Jay to sing out loud with full emotion!"
                      : selectedWinner?.name === 'Divya'
                      ? "🕷️ Jay gets to demand ANY song for Divu to sing in her sweetest voice!"
                      : "Whoever the wheel lands on must sing the other person's requested song!"}
                  </p>
                </div>

                {/* Song Suggestion Generator */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-brand" />
                      Suggested Song Demand:
                    </span>
                    <button
                      onClick={() => setSuggestedSongIndex((prev) => (prev + 1) % SONG_SUGGESTIONS.length)}
                      className="text-[10px] font-mono text-brand hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" /> Roll Another
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-serif italic text-amber-300 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/5">
                    "{SONG_SUGGESTIONS[suggestedSongIndex]}"
                  </p>
                </div>

                {/* Custom Demand Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customSong}
                    onChange={(e) => setCustomSong(e.target.value)}
                    placeholder="Or type a custom song to demand..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
                  />
                  {customSong && (
                    <button
                      onClick={() => setCustomSong('')}
                      className="text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* 30-Second Singing Visualizer & Prep Timer */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsSingingTimerActive(!isSingingTimerActive);
                        if (!isSingingTimerActive && singingSeconds === 0) setSingingSeconds(30);
                      }}
                      className="w-8 h-8 rounded-xl bg-brand text-background flex items-center justify-center font-bold text-xs shadow-md cursor-pointer"
                    >
                      {isSingingTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <span className="text-xs font-mono font-bold text-foreground">
                      Timer: {singingSeconds}s
                    </span>
                  </div>

                  {/* Audio Bars Animation */}
                  <div className="flex items-center gap-1">
                    {[12, 24, 16, 28, 20, 14, 26, 18].map((h, idx) => (
                      <motion.span
                        key={idx}
                        animate={{ height: isSingingTimerActive ? [8, h, 8] : 8 }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.08 }}
                        className="w-1 bg-gradient-to-t from-brand to-pink-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  onClick={() => handleCompleteTask(selectedWinner?.name || 'Divya')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Song Sung & Rated 10/10! ⭐ (+1 Point)</span>
                </button>
              </div>
            )}

            {/* 2. MODE: REVEAL A SECRET */}
            {activeMode === 'secrets' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Question #{secretIndex + 1} / {SECRET_QUESTIONS.length}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      {SECRET_QUESTIONS[secretIndex].category}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-serif italic text-foreground leading-relaxed mb-3">
                    "{SECRET_QUESTIONS[secretIndex].question}"
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    💡 Hint: {SECRET_QUESTIONS[secretIndex].hint}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSecretIndex((prev) => (prev + 1) % SECRET_QUESTIONS.length)}
                    className="flex-1 py-2.5 rounded-xl glass border border-white/15 hover:border-amber-500/40 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next Secret Question</span>
                  </button>

                  <button
                    onClick={() => handleCompleteTask(selectedWinner?.name || 'Divya')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Secret Revealed! (+1 Pt)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. MODE: WILD DARES & MINI-TASKS */}
            {activeMode === 'dares' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-purple-400" />
                      {WILD_DARES[dareIndex].title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {WILD_DARES[dareIndex].badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed mb-4">
                    {WILD_DARES[dareIndex].instruction}
                  </p>

                  {/* Dare Countdown Timer Component */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-purple-500/30">
                    <div className="flex items-center gap-2 font-mono">
                      <Timer className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span className="text-sm font-black text-foreground">
                        {dareTimer}s remaining
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsDareRunning(!isDareRunning)}
                        className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {isDareRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isDareRunning ? 'Pause' : 'Start Timer'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsDareRunning(false);
                          setDareTimer(WILD_DARES[dareIndex].durationSeconds);
                        }}
                        className="p-1 rounded-lg glass text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const next = (dareIndex + 1) % WILD_DARES.length;
                      setDareIndex(next);
                      setDareTimer(WILD_DARES[next].durationSeconds);
                      setIsDareRunning(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl glass border border-white/15 hover:border-purple-500/40 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                    <span>Roll New Dare</span>
                  </button>

                  <button
                    onClick={() => handleCompleteTask(selectedWinner?.name || 'Divya')}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 transition-all hover:scale-105"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dare Completed! 🏆 (+1 Pt)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* POP-UP CELEBRATION MODAL ON WHEEL LANDING */}
      <AnimatePresence>
        {showResultModal && selectedWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-full max-w-md glass bg-card/95 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto mb-3 animate-bounce">
                {selectedWinner.avatar}
              </div>

              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                🎡 The Wheel Has Spoken!
              </span>

              <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground mt-1 mb-2">
                {selectedWinner.displayName} is Chosen! 🎉
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground mb-6 font-medium">
                {selectedWinner.name === 'Jay'
                  ? "It's Jay's turn to face the challenge from Princess Divu!"
                  : "It's Birthday Queen Divu's turn to conquer the challenge!"}
              </p>

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-brand to-pink-500 text-black font-display font-black text-sm tracking-wider uppercase shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                Let's Play the Task! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
