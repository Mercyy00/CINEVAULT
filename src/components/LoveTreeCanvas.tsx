import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Clock, Flower2 } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

// Point Class
class Point {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  add(o: Point): Point {
    return new Point(this.x + o.x, this.y + o.y);
  }

  sub(o: Point): Point {
    return new Point(this.x - o.x, this.y - o.y);
  }

  div(n: number): Point {
    return new Point(this.x / n, this.y / n);
  }

  mul(n: number): Point {
    return new Point(this.x * n, this.y * n);
  }
}

// Parametric Heart Shape Generator
class HeartFigure {
  points: Point[];
  length: number;

  constructor() {
    const points: Point[] = [];
    for (let i = 10; i < 30; i += 0.2) {
      const t = i / Math.PI;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      points.push(new Point(x, y));
    }
    this.points = points;
    this.length = points.length;
  }

  get(i: number, scale = 1): Point {
    return this.points[i].mul(scale);
  }
}

function random(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function bezier(cp: Point[], t: number): Point {
  const p1 = cp[0].mul((1 - t) * (1 - t));
  const p2 = cp[1].mul(2 * t * (1 - t));
  const p3 = cp[2].mul(t * t);
  return p1.add(p2).add(p3);
}

function inHeart(x: number, y: number, r: number): boolean {
  const z = Math.pow(Math.pow(x / r, 2) + Math.pow(y / r, 2) - 1, 3) - Math.pow(x / r, 2) * Math.pow(y / r, 3);
  return z < 0;
}

const ROMANTIC_BLOOM_COLORS = [
  '#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#ffb703', '#ffd166', '#c77dff', '#e0aaff', '#f72585', '#b5179e', '#fb7185', '#fda4af'
];

// Seed Node (Heart that grows into tree)
class SeedNode {
  tree: LoveTree;
  point: Point;
  scaleVal: number;
  color: string;
  figure: HeartFigure;

  constructor(tree: LoveTree, point: Point, scale = 1, color = '#ff4d6d') {
    this.tree = tree;
    this.point = point;
    this.scaleVal = scale;
    this.color = color;
    this.figure = new HeartFigure();
  }

  draw(themeBrandColor?: string) {
    const ctx = this.tree.ctx;
    ctx.save();
    ctx.fillStyle = themeBrandColor || this.color;
    ctx.shadowColor = themeBrandColor || '#ff4d6d';
    ctx.shadowBlur = 15;
    ctx.translate(this.point.x, this.point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < this.figure.length; i++) {
      const p = this.figure.get(i, this.scaleVal);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  canMove(): boolean {
    return this.point.y < this.tree.height - 25;
  }

  move(x: number, y: number) {
    this.point.x += x;
    this.point.y += y;
  }

  canScale(): boolean {
    return this.scaleVal > 0.2;
  }

  scale(factor: number) {
    this.scaleVal *= factor;
  }
}

// Footer Ground Line
class TreeGround {
  tree: LoveTree;
  point: Point;
  width: number;
  height: number;
  speed: number;
  length: number;

  constructor(tree: LoveTree, width: number, height = 4, speed = 15) {
    this.tree = tree;
    this.point = new Point(tree.width / 2, tree.height - 25);
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.length = 0;
  }

  draw(ctx: CanvasRenderingContext2D, branchColor = '#5c4033') {
    const len = this.length / 2;
    ctx.save();
    ctx.strokeStyle = branchColor;
    ctx.lineWidth = this.height;
    ctx.lineCap = 'round';
    ctx.translate(this.point.x, this.point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.lineTo(-len, 0);
    ctx.stroke();
    ctx.restore();

    if (this.length < this.width) {
      this.length += this.speed;
    }
  }
}

// Branch Node
class TreeBranch {
  tree: LoveTree;
  p1: Point;
  p2: Point;
  p3: Point;
  radius: number;
  length: number;
  len: number;
  t: number;
  subBranchesData: any[];

  constructor(tree: LoveTree, p1: Point, p2: Point, p3: Point, radius: number, length = 100, subBranchesData: any[] = []) {
    this.tree = tree;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.radius = radius;
    this.length = length;
    this.len = 0;
    this.t = 1 / (this.length - 1);
    this.subBranchesData = subBranchesData;
  }

  grow(branchColor = '#4a2e18') {
    if (this.len <= this.length) {
      const p = bezier([this.p1, this.p2, this.p3], this.len * this.t);
      this.draw(this.tree.ctx, p, branchColor);
      this.draw(this.tree.offscreenCtx, p, branchColor);
      this.len += 1;
      this.radius *= 0.97;
    } else {
      this.tree.removeBranch(this);
      this.tree.addBranches(this.subBranchesData);
    }
  }

  draw(ctx: CanvasRenderingContext2D, p: Point, branchColor = '#4a2e18') {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = branchColor;
    ctx.shadowColor = branchColor;
    ctx.shadowBlur = 1;
    ctx.arc(p.x, p.y, Math.max(1, this.radius), 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

// Static Canopy Bloom
class StaticBloom {
  point: Point;
  figure: HeartFigure;
  color: string;
  alpha: number;
  angle: number;
  scaleVal: number;

  constructor(point: Point, figure: HeartFigure) {
    this.point = point;
    this.figure = figure;
    this.color = ROMANTIC_BLOOM_COLORS[random(0, ROMANTIC_BLOOM_COLORS.length - 1)];
    this.alpha = random(45, 95) / 100;
    this.angle = random(0, 360);
    this.scaleVal = 0.1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.point.x, this.point.y);
    ctx.scale(this.scaleVal, this.scaleVal);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < this.figure.length; i++) {
      const p = this.figure.get(i);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Dynamic Floating Falling Petal
class FallingPetal {
  x: number;
  y: number;
  figure: HeartFigure;
  color: string;
  alpha: number;
  angle: number;
  scaleVal: number;
  vx: number;
  vy: number;
  va: number;

  constructor(width: number, height: number, figure: HeartFigure) {
    this.x = random(width * 0.25, width * 0.75);
    this.y = random(height * 0.15, height * 0.55);
    this.figure = figure;
    this.color = ROMANTIC_BLOOM_COLORS[random(0, ROMANTIC_BLOOM_COLORS.length - 1)];
    this.alpha = random(60, 95) / 100;
    this.angle = random(0, 360);
    this.scaleVal = random(35, 65) / 100;
    this.vx = random(-8, 8) / 10;
    this.vy = random(12, 28) / 10;
    this.va = random(-3, 3) / 100;
  }

  update(width: number, height: number): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.va;
    return this.y < height + 20 && this.x > -20 && this.x < width + 20;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleVal, this.scaleVal);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < this.figure.length; i++) {
      const p = this.figure.get(i);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Master Canvas Tree Controller
class LoveTree {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  offscreenCanvas: HTMLCanvasElement;
  offscreenCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  seed: SeedNode;
  footer: TreeGround;
  branches: TreeBranch[] = [];
  bloomsQueue: StaticBloom[] = [];
  fallingPetals: FallingPetal[] = [];
  branchConfig: any[];
  figure: HeartFigure;

  constructor(canvas: HTMLCanvasElement, width: number, height: number, themeAccent = '#e8852a') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.figure = new HeartFigure();

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.seed = new SeedNode(this, new Point(width / 2, height / 2 - 20), 2, themeAccent);
    this.footer = new TreeGround(this, width, 4, 15);

    const cx = width / 2;
    const baseH = height;
    this.branchConfig = [
      [cx, baseH - 25, cx + 35, baseH * 0.4, cx - 35, baseH * 0.3, 26, 100, [
        [cx + 5, baseH * 0.73, cx - 80, baseH * 0.61, cx - 195, baseH * 0.58, 12, 100, [
          [cx - 85, baseH * 0.64, cx - 101, baseH * 0.63, cx - 141, baseH * 0.58, 2, 40]
        ]],
        [cx + 15, baseH * 0.65, cx + 65, baseH * 0.52, cx + 145, baseH * 0.5, 11, 100, [
          [cx + 43, baseH * 0.58, cx + 113, baseH * 0.6, cx + 126, baseH * 0.62, 3, 80]
        ]],
        [cx + 4, baseH * 0.41, cx + 2, baseH * 0.36, cx - 1, baseH * 0.31, 3, 40],
        [cx + 11, baseH * 0.58, cx - 122, baseH * 0.36, cx - 207, baseH * 0.35, 9, 80, [
          [cx - 108, baseH * 0.42, cx - 152, baseH * 0.37, cx - 164, baseH * 0.3, 2, 40],
          [cx - 37, baseH * 0.5, cx - 100, baseH * 0.46, cx - 140, baseH * 0.48, 4, 60]
        ]],
        [cx + 11, baseH * 0.52, cx + 73, baseH * 0.37, cx + 143, baseH * 0.32, 6, 100, [
          [cx + 55, baseH * 0.43, cx + 111, baseH * 0.4, cx + 113, baseH * 0.39, 2, 80]
        ]]
      ]]
    ];

    this.initBloomsQueue();
  }

  initBloomsQueue() {
    const num = 750;
    const r = Math.min(this.width, this.height) * 0.42;
    const cx = this.width / 2;
    const cy = this.height * 0.42;
    this.bloomsQueue = [];

    for (let i = 0; i < num; i++) {
      let attempts = 0;
      while (attempts < 100) {
        const x = random(40, this.width - 40);
        const y = random(20, this.height - 80);
        if (inHeart(x - cx, cy - y, r)) {
          this.bloomsQueue.push(new StaticBloom(new Point(x, y), this.figure));
          break;
        }
        attempts++;
      }
    }
  }

  addBranches(branchData: any[]) {
    for (const b of branchData) {
      const p1 = new Point(b[0], b[1]);
      const p2 = new Point(b[2], b[3]);
      const p3 = new Point(b[4], b[5]);
      const r = b[6];
      const l = b[7];
      const sub = b[8] || [];
      this.branches.push(new TreeBranch(this, p1, p2, p3, r, l, sub));
    }
  }

  removeBranch(branch: TreeBranch) {
    this.branches = this.branches.filter(b => b !== branch);
  }

  grow(branchColor?: string) {
    for (const b of [...this.branches]) {
      b.grow(branchColor);
    }
  }

  flower(batchSize = 5) {
    const batch = this.bloomsQueue.splice(0, batchSize);
    for (const b of batch) {
      b.scaleVal = random(45, 85) / 100;
      b.draw(this.ctx);
      b.draw(this.offscreenCtx);
    }
  }

  updatePetals() {
    if (this.fallingPetals.length < 25 && Math.random() < 0.3) {
      this.fallingPetals.push(new FallingPetal(this.width, this.height, this.figure));
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    // Draw the permanent static tree canopy
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);

    // Update and draw floating falling petals
    this.fallingPetals = this.fallingPetals.filter(p => {
      const alive = p.update(this.width, this.height);
      if (alive) {
        p.draw(this.ctx);
      }
      return alive;
    });
  }
}

// Jay's Heartfelt Story & Birthday Letter to Divu
const LOVE_LETTER_LINES = [
  "Dear Divu (My Goluuu, Besan Ka Ladduuu) 💖,",
  "",
  "I still remember the day we randomly met on that Instagram group chat. With your Luffy profile picture, I thought you were just a guy, never imagining that behind that screen was the most precious, gorgeous girl who would become my entire world.",
  "",
  "Having a crush on you for so long, I kept my feelings quiet during tough times until that unforgettable 7th of September 2024, when I finally confessed my love. From that second to this very moment, loving you has been the greatest blessing of my life.",
  "",
  "I love everything about you: the way you laugh when you playfully tease me, your research habits watching 1,000 YouTube reviews before buying even a tiny product, and how you pick up my call the moment I come back from college saying how much you missed me.",
  "",
  "I know your family is strict and you work so incredibly hard every single day for your government exams. Whenever you worry or feel like you're 'not enough', remember this: to me, you are everything. You are the sweetest, kindest, and most beautiful creation of God.",
  "",
  "We are going to fulfill all our dreams: we will explore the entire world together, stand successful side by side, and build our dream home on our own plot where we grow fresh vegetables and live peacefully in love.",
  "",
  "Distance may keep us apart today, but my heart is right there with you crororororoor times over.",
  "",
  "Happy 21st Birthday, my universe. 🎂✨",
  "Forever and always yours,",
  "☃︎【 Your JAY 】"
];

// Start Relationship Date: 7th September 2024
const RELATIONSHIP_START = new Date('2024-09-07T00:00:00');

export function LoveTreeCanvas() {
  const { theme } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [animationStage, setAnimationStage] = useState<'seed' | 'growing' | 'blooming' | 'completed'>('seed');
  const [typedText, setTypedText] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Relationship live time counter
  useEffect(() => {
    const updateCounter = () => {
      const diff = Math.max(0, Date.now() - RELATIONSHIP_START.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeElapsed({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for love letter
  useEffect(() => {
    if (animationStage !== 'completed') return;

    let lineIdx = 0;
    let charIdx = 0;
    const currentLines: string[] = [];

    const typeTimer = setInterval(() => {
      if (lineIdx >= LOVE_LETTER_LINES.length) {
        clearInterval(typeTimer);
        return;
      }

      const targetLine = LOVE_LETTER_LINES[lineIdx];
      if (charIdx === 0) {
        currentLines.push('');
      }

      if (charIdx < targetLine.length) {
        currentLines[lineIdx] = targetLine.substring(0, charIdx + 1);
        setTypedText([...currentLines]);
        charIdx++;
      } else {
        lineIdx++;
        charIdx = 0;
      }
    }, 28);

    return () => clearInterval(typeTimer);
  }, [animationStage]);

  // Main Canvas Tree Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = 1100;
    const height = 700;
    canvas.width = width;
    canvas.height = height;

    const isLight = ['elegant-light', 'clean-daylight', 'vanilla-cherry', 'nordic-frost', 'matcha-cream', 'sunset-rose'].includes(theme);
    const branchColor = isLight ? '#543310' : '#e6a15c';
    const tree = new LoveTree(canvas, width, height, isLight ? '#e11d48' : '#ff4d6d');

    let animationFrameId: number;
    let isCancelled = false;

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Seed pulse drawing before click
    const renderSeed = () => {
      if (!hasStarted) {
        tree.ctx.clearRect(0, 0, width, height);
        tree.seed.draw(isLight ? '#e11d48' : '#ff4d6d');
        animationFrameId = requestAnimationFrame(renderSeed);
      }
    };

    if (!hasStarted) {
      renderSeed();
    } else {
      (async () => {
        setAnimationStage('growing');

        // 1. Seed Scale & Move down to ground
        while (tree.seed.canScale() && !isCancelled) {
          tree.ctx.clearRect(0, 0, width, height);
          tree.seed.scale(0.94);
          tree.seed.draw();
          await sleep(15);
        }

        while (tree.seed.canMove() && !isCancelled) {
          tree.ctx.clearRect(0, 0, width, height);
          tree.seed.move(0, 6);
          tree.footer.draw(tree.ctx, branchColor);
          tree.footer.draw(tree.offscreenCtx, branchColor);
          tree.seed.draw();
          await sleep(15);
        }

        // 2. Branch Growth
        tree.addBranches(tree.branchConfig);
        while (tree.branches.length > 0 && !isCancelled) {
          tree.footer.draw(tree.ctx, branchColor);
          tree.footer.draw(tree.offscreenCtx, branchColor);
          tree.grow(branchColor);
          await sleep(12);
        }

        // 3. Flower Blooming
        setAnimationStage('blooming');
        while (tree.bloomsQueue.length > 0 && !isCancelled) {
          tree.flower(6);
          await sleep(12);
        }

        setAnimationStage('completed');

        // 4. Infinite Gentle Falling Petals (Crisp transparent background)
        const runPetalLoop = () => {
          if (isCancelled) return;
          tree.updatePetals();
          animationFrameId = requestAnimationFrame(runPetalLoop);
        };
        runPetalLoop();
      })();
    }

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasStarted, theme]);

  const handleStartGrowth = () => {
    if (!hasStarted) {
      setHasStarted(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl mx-auto py-8 px-2 sm:px-4">
      {/* Top Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-3 shadow-sm">
          <Flower2 className="w-4 h-4 animate-spin-slow" />
          <span>Our Growing Love & Journey</span>
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black text-foreground tracking-tight">
          The Tree of <span className="text-brand">Our Love</span> 🌳💖
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto mt-2 font-medium">
          {!hasStarted 
            ? "Click the glowing heart in the center to plant the seed of our story and watch our tree bloom! ✨" 
            : "Every leaf and petal blossomed with love, memories, and infinite happiness for your 21st Birthday."}
        </p>
      </div>

      {/* Main Interactive Stage Container */}
      <div className="relative glass border border-border rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden min-h-[580px] lg:min-h-[720px] flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Background Ambient Aura */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 blur-3xl transition-colors duration-700"
          style={{ background: 'radial-gradient(circle at 50% 50%, var(--theme-accent, #e8852a) 0%, transparent 70%)' }}
        />

        {/* Left Side: Typewriter Love Letter & Relationship Clock */}
        <div className="w-full lg:w-[45%] z-20 flex flex-col justify-between order-2 lg:order-1 min-h-[400px]">
          {/* Relationship Counter Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-border/80 rounded-2xl p-4 mb-4 shadow-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-brand font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>Together Since September 7, 2024</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-500 font-mono font-bold">
                JAY & DIVU 💑
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-card/80 border border-border p-2 rounded-xl">
                <span className="text-lg sm:text-2xl font-black text-brand">{timeElapsed.days}</span>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">Days</p>
              </div>
              <div className="bg-card/80 border border-border p-2 rounded-xl">
                <span className="text-lg sm:text-2xl font-black text-brand">{timeElapsed.hours}</span>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">Hours</p>
              </div>
              <div className="bg-card/80 border border-border p-2 rounded-xl">
                <span className="text-lg sm:text-2xl font-black text-brand">{timeElapsed.minutes}</span>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">Mins</p>
              </div>
              <div className="bg-card/80 border border-border p-2 rounded-xl">
                <span className="text-lg sm:text-2xl font-black text-brand">{timeElapsed.seconds}</span>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">Secs</p>
              </div>
            </div>
          </motion.div>

          {/* Typewriter Letter Box */}
          <div className="glass bg-card/75 border border-border rounded-2xl p-5 sm:p-6 shadow-inner flex-1 max-h-[460px] overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-xs font-bold text-foreground">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
              <span>A Letter From Jay to Divu</span>
            </div>

            {!hasStarted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mb-3 animate-bounce">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <p className="text-xs font-semibold text-foreground">A special message is waiting inside...</p>
                <p className="text-[11px] text-muted-foreground mt-1">Click the heart to unlock this letter and blossom the tree!</p>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-sans leading-relaxed text-foreground/90 space-y-2 whitespace-pre-line">
                {typedText.map((line, idx) => (
                  <p key={idx} className={cn(
                    line.startsWith('Dear') ? 'font-display font-bold text-brand text-sm sm:text-base' : '',
                    line.startsWith('☃︎') ? 'font-display font-black text-pink-500 text-sm mt-3' : '',
                    line.startsWith('Happy 21st') ? 'font-bold text-brand' : ''
                  )}>
                    {line}
                  </p>
                ))}
                {animationStage === 'completed' && typedText.length < LOVE_LETTER_LINES.length && (
                  <span className="inline-block w-2 h-4 bg-brand animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Responsive Love Tree Canvas (Transparent & Theme Adaptive) */}
        <div className="w-full lg:w-[55%] flex items-center justify-center relative order-1 lg:order-2 overflow-hidden rounded-2xl">
          {/* Canvas Wrapper */}
          <div className="relative w-full aspect-[11/7] max-h-[560px] flex items-center justify-center">
            <canvas 
              ref={canvasRef}
              onClick={handleStartGrowth}
              className={cn(
                "w-full h-full object-contain cursor-pointer transition-all duration-300 bg-transparent",
                !hasStarted && "hover:scale-[1.02] drop-shadow-2xl"
              )}
            />

            {/* Click Prompt Callout overlay when not started */}
            <AnimatePresence>
              {!hasStarted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleStartGrowth}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-14 z-30 cursor-pointer pointer-events-auto"
                >
                  <div className="px-5 py-2.5 rounded-full bg-brand text-background font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border-2 border-white/30">
                    <Heart className="w-4 h-4 fill-current animate-ping" />
                    <span>Click Heart to Bloom Tree 🌱✨</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
