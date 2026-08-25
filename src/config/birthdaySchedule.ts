export interface ScheduleSectionConfig {
  id: string;
  domId: string;
  sectionNumber: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  targetHour: number; // 24-hour format (e.g. 11 for 11:00 AM, 14 for 2:00 PM)
  targetMinute: number;
  timeLabel: string;
  periodLabel: string;
  happyQuote: string;
  happySubQuote: string;
  angryQuotes: string[];
  unlockedQuote: string;
  accentColor: string;
}

export const BIRTHDAY_TARGET_DATE = {
  year: 2026,
  month: 8, // September (0-indexed: 8)
  day: 2,
};

export const BIRTHDAY_SECTIONS_SCHEDULE: ScheduleSectionConfig[] = [
  {
    id: 'love-tree',
    domId: 'love-tree-section',
    sectionNumber: 1,
    title: 'Blooming Love Tree & 21 Wishes',
    subtitle: 'Interactive procedural cherry blossom tree seeded with our 21 sweetest memories & heartfelt story',
    badge: 'Morning Kickoff',
    icon: '🌸',
    targetHour: 11,
    targetMinute: 0,
    timeLabel: '11:00 AM',
    periodLabel: 'Morning Sunshine',
    happyQuote: 'Shishishi! 🍖 Divu! The sun is shining bright over the Thousand Sunny! The Love Tree is blooming at 11:00 AM! Wait for the morning blossoms to open!',
    happySubQuote: 'Captain\'s tip: Good things come to those who wait for the morning tide! 🌊✨',
    angryQuotes: [
      'OI OI OI DIVU!! 😤 The tree roots aren\'t done growing yet! You can\'t rush nature, even the Pirate King knows that! Wait till 11:00 AM!',
      'GOMU GOMU NO... NO PEEKING!! 👒 Captain\'s orders! If you open this early, Nami is gonna charge you 100,000 Berries!',
      'Hmph! 😤 You clicked open already?! Even Zoro wouldn\'t get this lost! Step back until 11:00 AM or I\'m eating all the birthday snacks!'
    ],
    unlockedQuote: 'SUGEEEE! 🌸 The Love Tree is in full bloom! Divu, look at all the glowing petals!',
    accentColor: '#ec4899'
  },
  {
    id: 'memories-gallery',
    domId: 'memories-section',
    sectionNumber: 2,
    title: '40 Hanging Polaroids on Fairy Lights',
    subtitle: '40 nostalgic memory polaroids hanging on glowing fairy ropes with audio notes and zoom lens',
    badge: 'Noon Memories',
    icon: '📸',
    targetHour: 12,
    targetMinute: 0,
    timeLabel: '12:00 PM',
    periodLabel: 'Noon Sunshine',
    happyQuote: 'Shishishi! 📸 40 treasure photos are hung carefully along the ship\'s rigging! They unlock right at 12:00 PM lunchtime!',
    happySubQuote: 'Sanji is making lunch while the fairy lights warm up the memories! 🍗',
    angryQuotes: [
      'Hmph! 😤 Hands off the photos, Besan Ka Laddu! Nami hung them up carefully! No peeking before 12:00 PM!',
      'OI DIVU! 😡 Sanji says lunch isn\'t served and photos aren\'t ready! Wait till 12:00 PM or no dessert for you!',
      'BAKA! 😤 A pirate treasure gallery only opens at the stroke of noon! Back away from the fairy lights!'
    ],
    unlockedQuote: 'YOSSHHH! 📸 The photo ropes are glowing! Dive into the memories, Goluuu!',
    accentColor: '#f59e0b'
  },
  {
    id: 'husband-voicenote',
    domId: 'husband-voicenote-section',
    sectionNumber: 3,
    title: "Husband's Secret Voice Note & Spider-Man",
    subtitle: "A heartfelt 3-minute private studio voice note from Jay with real-time waveform and surprise Spider-Man",
    badge: 'Afternoon Secret',
    icon: '🎙️',
    targetHour: 14,
    targetMinute: 0,
    timeLabel: '02:00 PM',
    periodLabel: 'Afternoon Surprise',
    happyQuote: 'Oi! 🎙️ Jay recorded a top-secret audio message from the heart! Chopper says it\'s strictly classified until 02:00 PM!',
    happySubQuote: 'Spidey is on high alert guarding the microphone! 🕷️✨',
    angryQuotes: [
      'BAKA! 😡 It\'s a TOP SECRET voice note! If you listen before 02:00 PM, Spidey and I will web your hands! Hmph!',
      'OI GOLUUU! 😤 Jay poured his entire heart into this audio! You have to wait until 02:00 PM sharp to hear it with full feeling!',
      'GOMU GOMU NO... EARPLUGS ON!! 🚫🎧 No sneaking a listen early! Not on my pirate ship!'
    ],
    unlockedQuote: 'SUGOI! 🎙️ Secret audio frequency unlocked! Put on your earphones, Divu! 💖',
    accentColor: '#ef4444'
  },
  {
    id: 'multiverse-reel',
    domId: 'multiverse-section',
    sectionNumber: 4,
    title: 'Us In Another Universe (35mm Multiverse Reel)',
    subtitle: '8 alternate cinematic timelines where Jay and Divu meet as anime heroes, royalty, and travelers',
    badge: 'Multiverse Portal',
    icon: '🌌',
    targetHour: 15,
    targetMinute: 0,
    timeLabel: '03:00 PM',
    periodLabel: 'Afternoon Tea',
    happyQuote: 'SUGOI! 🌌 We found portals to 8 alternate universes where you two are soulmates! The projector lights up at 03:00 PM!',
    happySubQuote: 'Usopp is calibrating the multiverse projector lenses! 🔭✨',
    angryQuotes: [
      'GOMU GOMU NO... STOP! 🚫 You\'ll break the space-time continuum before 03:00 PM! Zoro already got lost in universe 4!',
      'OI OI! 😤 Franky is still charging the multiverse generator! If you push the button now, we\'ll get sucked into the Grand Line!',
      'Hmph! 😡 No traveling across dimensions early, Future Officer-chan! Wait till 03:00 PM!'
    ],
    unlockedQuote: 'PORTAL OPEN! 🌌 All 8 multiverse timelines are spinning! Check out your other lives together!',
    accentColor: '#8b5cf6'
  },
  {
    id: 'birthday-arcade',
    domId: 'arcade-section',
    sectionNumber: 5,
    title: 'Birthday Arcade Corner (Retro Mini-Game)',
    subtitle: 'Retro 8-bit love arcade machine with sound effects, leaderboards, and celebratory token rewards',
    badge: 'Evening Gaming',
    icon: '🕹️',
    targetHour: 19,
    targetMinute: 0,
    timeLabel: '07:00 PM',
    periodLabel: 'Evening Free Time',
    happyQuote: 'YATTA! 🕹️ Arcade time! After a long busy day of studying, the game zone opens at 07:00 PM for epic high scores!',
    happySubQuote: 'Chopper has gathered all the arcade tokens for you! 🪙👾',
    angryQuotes: [
      'Oi Goluuu! 😤 You can\'t play the arcade yet! Finish your busy schedule and rest up, game tokens unlock sharp at 07:00 PM!',
      'Hmph! 😡 Insert Coin? There are NO coins until 07:00 PM! Even Kaido couldn\'t force this machine to start early!',
      'GOMU GOMU NO... GAME OVER!! 🚫👾 Step away from the joystick until 07:00 PM!'
    ],
    unlockedQuote: 'COIN INSERTED! 🕹️ Retro Arcade is live! Go smash that high score, birthday champion!',
    accentColor: '#06b6d4'
  },
  {
    id: 'wheel-games',
    domId: 'wheel-games-section',
    sectionNumber: 6,
    title: 'Couple Spin Wheel & Wild Party Dares',
    subtitle: 'Spinning lucky wheel with 16 hilarious dares, heartfelt romantic questions, and cute singing challenges',
    badge: 'Party Time',
    icon: '🎡',
    targetHour: 20,
    targetMinute: 0,
    timeLabel: '08:00 PM',
    periodLabel: 'Prime Night',
    happyQuote: 'Shishishi! 🎡 The Straw Hat party wheel is loaded with crazy dares and romantic truths! Spin time starts at 08:00 PM!',
    happySubQuote: 'Brook is ready with his violin for the singing challenges! 🎻✨',
    angryQuotes: [
      'Hmph! 😤 No spinning early! Franky is still greasing the wheel bearings with cola! Wait till 08:00 PM!',
      'OI DIVU! 😡 If you spin before 08:00 PM, I\'m making the dare "Give Luffy 5 big chunks of meat"! Wait your turn!',
      'BAKA! 😤 The wheel of destiny requires patience! No peeking at the dares before 08:00 PM!'
    ],
    unlockedQuote: 'SPIN THE WHEEL! 🎡 The party is officially wild! Let\'s see what dare Jay gets!',
    accentColor: '#10b981'
  },
  {
    id: 'movie-theater',
    domId: 'movie-theater-section',
    sectionNumber: 7,
    title: "Divu & Jay's Starlight Movie Theater",
    subtitle: 'Custom cinema hall screening award-winning romantic shorts (Kitbull, Feast, Paperman) under starry sky',
    badge: 'Starlight Cinema',
    icon: '🎬',
    targetHour: 21,
    targetMinute: 0,
    timeLabel: '09:00 PM',
    periodLabel: 'Late Night Cinema',
    happyQuote: 'MEAT & POPCORN! 🍿 Movie night under the stars! The projector rolls at 09:00 PM for the coziest films ever!',
    happySubQuote: 'Sanji is making caramel popcorn and the night sky is clear! 🌠',
    angryQuotes: [
      'OI! 😡 The theater doors are locked! Sanji is still buttering the popcorn! Don\'t push the door before 09:00 PM!',
      'Hmph! 😤 Cinema rule #1: No entering before showtime! Even the Pirate King has to wait until 09:00 PM!',
      'GOMU GOMU NO... TICKET PLEASE!! 🚫🎫 You don\'t have a valid pass until 09:00 PM! Go sit down, Besan Ka Laddu!'
    ],
    unlockedQuote: 'LIGHTS, CAMERA, ACTION! 🍿 The projector is rolling! Grab your popcorn and enjoy the show!',
    accentColor: '#eab308'
  },
  {
    id: 'sealed-letters',
    domId: 'sealed-letters-section',
    sectionNumber: 8,
    title: '21 Wax-Sealed Love Letters & Scratch Cards',
    subtitle: '21 interactive wax-sealed envelopes ("Open When...") with scratch card coupons and final 21st message',
    badge: 'Grand Finale Vault',
    icon: '💌',
    targetHour: 22,
    targetMinute: 0,
    timeLabel: '10:00 PM',
    periodLabel: 'Grand Midnight Finale',
    happyQuote: 'THE GRAND ONE PIECE TREASURE! 👑 21 wax-sealed letters written with pure love by Jay! The final vault opens at 10:00 PM!',
    happySubQuote: 'The culmination of turning 21! All secrets revealed at 10:00 PM! 💖✨',
    angryQuotes: [
      'GOMU GOMU NO GATLING... NOOO! 🚫💌 You CANNOT open the final 21 letters until 10:00 PM! Even if you offer me 10 tons of meat! Hmph!',
      'OI DIVYANSHI!! 😡 That is the ultimate treasure vault! Nami locked it with a triple combination! Not a second before 10:00 PM!',
      'HMPH! 😤 The wax seal will break if you touch it early! Wait until 10:00 PM for the most magical moment!'
    ],
    unlockedQuote: 'ALL SEALS BROKEN! 👑 21 wax letters are unlocked! Happy 21st Birthday Divyanshi! 💖🎂✨',
    accentColor: '#d946ef'
  }
];

export interface SectionLockState {
  isLocked: boolean;
  totalMsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  targetDateObj: Date;
}

/**
 * Calculates whether a section is locked given either the live time or a simulated time override.
 */
export function calculateSectionLockState(
  section: ScheduleSectionConfig, 
  simulatedHour?: number | null,
  simulatedMinute?: number | null,
  forceUnlockAll?: boolean
): SectionLockState {
  if (forceUnlockAll) {
    return {
      isLocked: false,
      totalMsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      targetDateObj: new Date()
    };
  }

  const now = new Date();
  
  // If simulated time is provided (for testing / preview mode)
  if (simulatedHour !== undefined && simulatedHour !== null) {
    const simMinutes = (simulatedMinute ?? 0);
    const currentSimTotalMinutes = simulatedHour * 60 + simMinutes;
    const targetTotalMinutes = section.targetHour * 60 + section.targetMinute;

    if (currentSimTotalMinutes >= targetTotalMinutes) {
      return {
        isLocked: false,
        totalMsRemaining: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        targetDateObj: new Date()
      };
    } else {
      const diffMins = targetTotalMinutes - currentSimTotalMinutes;
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      const seconds = 0;
      return {
        isLocked: true,
        totalMsRemaining: diffMins * 60 * 1000,
        days: 0,
        hours,
        minutes,
        seconds,
        targetDateObj: new Date()
      };
    }
  }

  // Live real-time check
  // Target birthday is Sept 2, 2026 at targetHour:targetMinute:00
  const target = new Date(
    BIRTHDAY_TARGET_DATE.year,
    BIRTHDAY_TARGET_DATE.month,
    BIRTHDAY_TARGET_DATE.day,
    section.targetHour,
    section.targetMinute,
    0
  );

  const diff = target.getTime() - now.getTime();

  // If today is past the target time or already unlocked
  if (diff <= 0) {
    return {
      isLocked: false,
      totalMsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      targetDateObj: target
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    isLocked: true,
    totalMsRemaining: diff,
    days,
    hours,
    minutes,
    seconds,
    targetDateObj: target
  };
}
