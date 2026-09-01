import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function CuteHeart({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#cuteHeartGrad)"
      />
      <path
        d="M8.5 6C7.12 6 6 7.12 6 8.5"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="cuteHeartGrad" x1="2" y1="3" x2="22" y2="21.35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff4d6d" />
          <stop offset="1" stopColor="#e8365a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CuteRing({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <circle cx="12" cy="14" r="7" stroke="url(#cuteRingGrad)" strokeWidth="2.5" />
      <path
        d="M12 3l2 3h-4l2-3z"
        fill="#38bdf8"
        stroke="#0284c7"
        strokeWidth="0.8"
      />
      <path d="M10 6l2-3 2 3" stroke="#e0f2fe" strokeWidth="0.8" />
      <circle cx="12" cy="4.5" r="1" fill="#ffffff" />
      <defs>
        <linearGradient id="cuteRingGrad" x1="5" y1="7" x2="19" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CuteSunflower({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* Petals */}
      <circle cx="12" cy="12" r="9" fill="#fbbf24" opacity="0.9" />
      <circle cx="12" cy="5" r="2.5" fill="#f59e0b" />
      <circle cx="12" cy="19" r="2.5" fill="#f59e0b" />
      <circle cx="5" cy="12" r="2.5" fill="#f59e0b" />
      <circle cx="19" cy="12" r="2.5" fill="#f59e0b" />
      <circle cx="7" cy="7" r="2.5" fill="#f59e0b" />
      <circle cx="17" cy="17" r="2.5" fill="#f59e0b" />
      <circle cx="17" cy="7" r="2.5" fill="#f59e0b" />
      <circle cx="7" cy="17" r="2.5" fill="#f59e0b" />
      {/* Center seed disk */}
      <circle cx="12" cy="12" r="5" fill="#78350f" />
      <circle cx="10.5" cy="10.5" r="0.8" fill="#d97706" />
      <circle cx="13.5" cy="10.5" r="0.8" fill="#d97706" />
      <circle cx="12" cy="13.5" r="0.8" fill="#d97706" />
    </svg>
  );
}

export function CuteSakura({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <circle cx="12" cy="6" r="3.2" fill="#f472b6" />
      <circle cx="17.7" cy="10.1" r="3.2" fill="#f472b6" />
      <circle cx="15.5" cy="17" r="3.2" fill="#f472b6" />
      <circle cx="8.5" cy="17" r="3.2" fill="#f472b6" />
      <circle cx="6.3" cy="10.1" r="3.2" fill="#f472b6" />
      <circle cx="12" cy="12" r="3.2" fill="#fdf2f8" />
      <circle cx="12" cy="12" r="1.5" fill="#f43f5e" />
    </svg>
  );
}

export function CuteStar({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path
        d="M12 2l2.9 6.8 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.7 7.1-.6L12 2z"
        fill="url(#cuteStarGrad)"
      />
      <circle cx="12" cy="11" r="1.5" fill="#fff" opacity="0.8" />
      <defs>
        <linearGradient id="cuteStarGrad" x1="2" y1="2" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CuteSparkles({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M12 2l1.8 5.4L19 9.2l-5.2 1.8L12 16.5l-1.8-5.5L5 9.2l5.2-1.8L12 2z" fill="#fbbf24" />
      <path d="M19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#f472b6" />
      <circle cx="6" cy="18" r="1.5" fill="#38bdf8" />
    </svg>
  );
}

export function CuteCoffeeTea({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M4 8h13v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8z" fill="#d97706" />
      <path d="M17 10h2a2 2 0 012 2v1a2 2 0 01-2 2h-2v-5z" stroke="#b45309" strokeWidth="2" />
      <path d="M3 21h16" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
      {/* Steam */}
      <path d="M7 4c0-1 1-2 1-2s1 1 1 2" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4c0-1 1-2 1-2s1 1 1 2" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CutePinkyPromise({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* Interlocking pinkies */}
      <path
        d="M7 16c-1.5 0-3-1.5-3-3V7a2 2 0 014 0v4"
        stroke="#f472b6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 16c1.5 0 3-1.5 3-3V7a2 2 0 00-4 0v4"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="11" r="2.5" fill="#ec4899" />
      <CuteHeart className="w-3 h-3 absolute" />
    </svg>
  );
}

export function CuteCamera({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="2" y="6" width="20" height="15" rx="3" fill="#ec4899" />
      <path d="M7 6l1.5-3h7L17 6" fill="#be185d" />
      <circle cx="12" cy="13.5" r="4.5" fill="#ffffff" />
      <circle cx="12" cy="13.5" r="3" fill="#831843" />
      <circle cx="13.5" cy="12" r="1" fill="#ffffff" />
      <circle cx="18" cy="9" r="1" fill="#fbcfe8" />
    </svg>
  );
}

export function CutePlane({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill="url(#planeGrad)"
      />
      <defs>
        <linearGradient id="planeGrad" x1="2" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CuteBookMilestone({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      <path d="M9 7h6M9 11h4" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CuteMusicNote({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <circle cx="6" cy="18" r="3" fill="#a855f7" />
      <circle cx="18" cy="15" r="3" fill="#a855f7" />
      <path d="M9 18V6l12-3v12" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10l12-3" stroke="#c084fc" strokeWidth="2" />
    </svg>
  );
}

export function CuteGift({ className = "w-5 h-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="3" y="10" width="18" height="11" rx="2" fill="#ec4899" />
      <rect x="2" y="6" width="20" height="4" rx="1" fill="#f43f5e" />
      <rect x="10.5" y="6" width="3" height="15" fill="#fde047" />
      <path d="M12 6c-2-2-4 0-2 2h4c2-2 0-4-2-2z" fill="#fde047" />
    </svg>
  );
}
