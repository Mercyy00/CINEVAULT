import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  MailOpen, 
  Heart, 
  Sparkles, 
  Music, 
  X, 
  ChevronRight, 
  Eraser,
  Sparkle
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface SealedLetter {
  id: number;
  numberTag: string;
  situationTitle: string;
  category: 'birthday' | 'latenight' | 'comfort' | 'foodie' | 'future' | 'romance';
  categoryLabel: string;
  envelopeColor: string;
  waxColor: string;
  songQuote: {
    lyrics: string;
    songTitle: string;
    artist: string;
  };
  letterContent: {
    greeting: string;
    body: string[];
    closing: string;
  };
  scratchSecret: {
    teaser: string;
    revealedText: string;
  };
}

export const LETTERS_DATA: SealedLetter[] = [
  {
    id: 1,
    numberTag: 'Letter #01',
    situationTitle: 'Open When It Strikes 12:00 AM on 2nd September 🎂✨',
    category: 'birthday',
    categoryLabel: '21st Birthday Milestone',
    envelopeColor: 'from-amber-600/30 to-amber-950/50 border-amber-500/40 text-amber-300',
    waxColor: '#f59e0b',
    songQuote: {
      lyrics: "“Baar baar din ye aaye, baar baar dil ye gaaye... Tu jiye hazaaron saal, saal ke din hon pachaas hazaar!” 🎶",
      songTitle: "Baar Baar Din Yeh Aaye",
      artist: "Mohammed Rafi"
    },
    letterContent: {
      greeting: "Happiest 21st Birthday, Meri Dearest Divu! 🎂💖",
      body: [
        "Officially 21 today! 2nd September 2005 ko is duniya me ek bohot hi pyari, pyaari si ladki aayi thi jisko aaj main apni poori duniya maanta hoon.",
        "Watching you grow, work hard for your officer dreams, laugh with that pure open smile, and fill my life with so much sweetness is my biggest blessing. 21 is a huge milestone baby, and you deserve all the dark chocolate, crispy treats, and happiness in the universe!",
        "Chahe tum 21 ki ho jao ya 50 ki, for me you will always be my little Besan Ka Ladduuu and the sweetest girl alive."
      ],
      closing: "With all my love on your special 21st, Jay 👑"
    },
    scratchSecret: {
      teaser: "Scratch to reveal my midnight birthday vow for you 🤫👇",
      revealedText: "✨ Vow: As you turn 21, I promise to celebrate every birthday by getting you the richest dark chocolate, taking you for the best Papdi Chaat, and loving you unconditionally forever."
    }
  },
  {
    id: 2,
    numberTag: 'Letter #02',
    situationTitle: 'Open When You Miss Me So Bad That Your Room Feels Empty 🌙',
    category: 'latenight',
    categoryLabel: 'Late Night Longing',
    envelopeColor: 'from-blue-600/30 to-slate-950/50 border-blue-500/40 text-blue-300',
    waxColor: '#3b82f6',
    songQuote: {
      lyrics: "“Main tenu samjhawan ki, na tere bina lagda jee... Tu ki jaane pyaar mera, main karaan intezar tera...” 🌧️",
      songTitle: "Samjhawan",
      artist: "Arijit Singh & Shreya Ghoshal"
    },
    letterContent: {
      greeting: "Meri pyari Divu,",
      body: [
        "I know distance sucks sometimes. Jab raat ko sab so jaate hain and room me sirf phone ki screen ki light hoti hai, I miss you just as intensely as you miss me.",
        "Bas apni aankhein band karo, pillow ko zor se hug karo, and remember that my heart beats in sync with yours no matter how many kilometers are between us.",
        "Jab bhi akele lago, remember every laugh we shared and the tight hugs waiting for us soon."
      ],
      closing: "Always holding your hand in my thoughts, Jay 🫂"
    },
    scratchSecret: {
      teaser: "Scratch to unlock a warm virtual hug 🤗👇",
      revealedText: "💖 Distance is just a test to see how far love can travel. My arms are already wrapped around you in spirit. You are never, ever alone."
    }
  },
  {
    id: 3,
    numberTag: 'Letter #03',
    situationTitle: 'Open When You Are Overwhelmed by Studies & Exam Stress 📚',
    category: 'comfort',
    categoryLabel: 'Future Officer Fuel',
    envelopeColor: 'from-emerald-600/30 to-emerald-950/50 border-emerald-500/40 text-emerald-300',
    waxColor: '#10b981',
    songQuote: {
      lyrics: "“Aashayein khile dil ki, ummeedein hase dil ki... Ab mushkil nahi kuch bhi, nahi kuch bhi!” 🌟",
      songTitle: "Aashayein",
      artist: "KK"
    },
    letterContent: {
      greeting: "To My Future Government Officer,",
      body: [
        "Hey, take a deep breath. Paani piyo, break lo aur ek piece dark chocolate khao. I know syllabus bada hai aur pressure real hai, but remember who you are.",
        "You are one of the smartest, most dedicated, and brilliant minds I know. Ek tough chapter ya mock test tumhari worth define nahi karta.",
        "You are going to wear that officer badge one day, and I am going to be standing right in the front row clapping with tears of pride in my eyes."
      ],
      closing: "Your number one cheerleader & proudest admirer, Jay 🎖️"
    },
    scratchSecret: {
      teaser: "Scratch for an instant officer boost ⚡👇",
      revealedText: "👑 Officer Divyanshi ji, you were born to lead and conquer! Grab your favorite crunchy snack, take a 10-minute walk, and go show those books who’s the boss."
    }
  },
  {
    id: 4,
    numberTag: 'Letter #04',
    situationTitle: 'Open When You Crave Papdi Chaat & Crispy Snacks at Odd Hours 🤤',
    category: 'foodie',
    categoryLabel: 'Chaat Queen Emergency',
    envelopeColor: 'from-orange-600/30 to-amber-950/50 border-orange-500/40 text-orange-300',
    waxColor: '#ea580c',
    songQuote: {
      lyrics: "“Khao piyo aish karo mitro... dil parmatma nu yaad rakho!” 🍟",
      songTitle: "Dil Da Mamla",
      artist: "Gurdas Maan"
    },
    letterContent: {
      greeting: "Meri Chaat Queen & 100% Pure Veggie Foodie,",
      body: [
        "Main jaanta hoon right now your mind is picturing a big plate of Papdi Chaat loaded with dahi, sweet saunth chutney, spicy teekha pani, and tons of extra crispy sev! 😂",
        "Whether it’s Sev Puri, crispy Pani Puri competitions, Aloo Tikki, or crunchy nachos with dip—your love for crunchy street food is the absolute cutest thing in the world.",
        "Order whatever crunchy chaat your heart desires right this second. Zero guilt allowed today!"
      ],
      closing: "Unlimited Chaat dates are on me forever, Jay 🥙"
    },
    scratchSecret: {
      teaser: "Scratch to reveal Jay's Chaat Rule 👑👇",
      revealedText: "🍟 Chaat Law: The last extra-crispy papdi and the biggest golgappa will ALWAYS be reserved for Divu. No arguments!"
    }
  },
  {
    id: 5,
    numberTag: 'Letter #05',
    situationTitle: 'Open When We Had a Silly Misunderstanding or Fight 🥺',
    category: 'comfort',
    categoryLabel: 'Peace & Love Treaty',
    envelopeColor: 'from-rose-600/30 to-red-950/50 border-rose-500/40 text-rose-300',
    waxColor: '#e11d48',
    songQuote: {
      lyrics: "“Rooth na jaana tum se kaho toh... Tere bina mera koi na yahan...” 🕊️",
      songTitle: "Rooth Na Jaana",
      artist: "1942: A Love Story"
    },
    letterContent: {
      greeting: "Meri angry bird Divu,",
      body: [
        "First of all: I love you. Galti chahe meri ho ya misunderstanding hui ho, nothing in this world is bigger than us.",
        "Can I bribe you with a plate of fresh Papdi Chaat and a bar of rich dark chocolate to make that grumpy pout disappear?",
        "Please pout mat karo (even though your angry face is secretly very adorable). Call me or text me, let's talk softly and make up."
      ],
      closing: "Forever yours, even when we argue, Jay 🤍"
    },
    scratchSecret: {
      teaser: "Scratch to wave the white flag of love 🏳️👇",
      revealedText: "💌 I’m sorry baby. You win every argument forever. Just come back and give me that sweet smile, deal?"
    }
  },
  {
    id: 6,
    numberTag: 'Letter #06',
    situationTitle: 'Open When You Think About That Famous Luffy PFP Mystery 👒',
    category: 'romance',
    categoryLabel: 'Our Origin Story',
    envelopeColor: 'from-red-600/30 to-rose-950/50 border-red-500/40 text-red-300',
    waxColor: '#ef4444',
    songQuote: {
      lyrics: "“Kaise mujhe tum mil gayi, kismat pe aaye na yaqeen... Main toh yeh sochta tha kayi din se...” ✨",
      songTitle: "Kaise Mujhe",
      artist: "Benny Dayal & Shreya Ghoshal"
    },
    letterContent: {
      greeting: "To the girl with the legendary Luffy avatar,",
      body: [
        "Who would have thought that a random anime straw hat avatar in an Instagram group would change the entire trajectory of my universe?",
        "When I first saw your messages, I had no idea that behind that Luffy PFP was the kindest, sweetest, and most beautiful girl I'd ever fall completely head-over-heels for.",
        "That one chat was destiny playing its greatest card. I thank the universe every single day that you were in that chat."
      ],
      closing: "From your biggest pirate fan, Jay 🏴‍☠️"
    },
    scratchSecret: {
      teaser: "Scratch to see a secret confession from day 1 🤫👇",
      revealedText: "💫 From the very first week of talking to you, I knew you were something extraordinary. Best DM of my life."
    }
  },
  {
    id: 7,
    numberTag: 'Letter #07',
    situationTitle: 'Open When You Need a Reminder of How Gorgeous You Are 🌸',
    category: 'romance',
    categoryLabel: 'Pure Radiance',
    envelopeColor: 'from-pink-600/30 to-pink-950/50 border-pink-500/40 text-pink-300',
    waxColor: '#ec4899',
    songQuote: {
      lyrics: "“Chaudhvin ka chand ho ya aaftab ho... Jo bhi ho tum khuda ki kasam lajawab ho!” 🌹",
      songTitle: "Chaudhvin Ka Chand",
      artist: "Mohammed Rafi"
    },
    letterContent: {
      greeting: "Meri sundar ladki,",
      body: [
        "In case no one told you today: You are breathtaking. Aur yeh main sirf dressed up look ke liye nahi bol raha hoon.",
        "Tum jab bina makeup ke, messy hair me, oversized pajamas me subah uthti ho, you look like pure poetry to me.",
        "Your eyes, that cute nose, that soft voice, and especially that unfiltered laugh—you are the most stunning girl to ever walk this planet."
      ],
      closing: "Completely mesmerized by you, Jay 💖"
    },
    scratchSecret: {
      teaser: "Scratch for a sweet compliment 💄👇",
      revealedText: "✨ Divu, your real beauty is the gentle warmth inside your soul that lights up any room you walk into. You are perfection."
    }
  },
  {
    id: 8,
    numberTag: 'Letter #08',
    situationTitle: 'Open When It’s 2:00 AM and Sleep Won’t Come 🌌',
    category: 'latenight',
    categoryLabel: 'Midnight Melodies',
    envelopeColor: 'from-indigo-600/30 to-indigo-950/50 border-indigo-500/40 text-indigo-300',
    waxColor: '#6366f1',
    songQuote: {
      lyrics: "“I love you so, please let me go... Nah, never letting you go! Dil diya gallan karange roz roz baith ke...” 🌙",
      songTitle: "Dil Diyan Gallan",
      artist: "Atif Aslam"
    },
    letterContent: {
      greeting: "Sleepyhead Divu,",
      body: [
        "Agar abhi tak neend nahi aayi hai, to screen ki brightness low karo aur dim lights me ye letter padho.",
        "Remember our long midnight phone calls? Jab baatein khatam ho jaati hain but phone cut karne ka mann nahi karta, and we just listen to each other breathing quietly.",
        "Close your eyes now. Imagine my fingers softly stroking your hair, whispering that everything is going to be wonderful tomorrow."
      ],
      closing: "Meet me in our dreamland, Jay 💤"
    },
    scratchSecret: {
      teaser: "Scratch to receive a midnight lullaby whisper 😴👇",
      revealedText: "🌙 “Shh... breathe out. Relax your brow. You are safe, you are loved, and tomorrow is a fresh sweet day.” Goodnight my love."
    }
  },
  {
    id: 9,
    numberTag: 'Letter #09',
    situationTitle: 'Open When You Need a Tight Virtual Bear Hug 🫂',
    category: 'comfort',
    categoryLabel: 'Warm Blanket Hug',
    envelopeColor: 'from-amber-700/30 to-stone-950/50 border-amber-600/40 text-amber-200',
    waxColor: '#d97706',
    songQuote: {
      lyrics: "“Lag ja gale ke phir ye haseen raat ho na ho... Shayad phir is janam me mulaqat ho na ho...” 🎻",
      songTitle: "Lag Jaa Gale",
      artist: "Lata Mangeshkar"
    },
    letterContent: {
      greeting: "Meri jaan Divu,",
      body: [
        "This letter is an official redeemable voucher for a 5-minute non-stop tight hug.",
        "Put your hands across your chest, squeeze gently, and feel that warmth. That is me wrapping my arms around you from across the miles.",
        "I’ve got you. Whatever is heavy on your heart right now, let me carry half of it. You never have to face anything alone."
      ],
      closing: "Holding you tight, Jay 🧸"
    },
    scratchSecret: {
      teaser: "Scratch to feel the forehead kiss 💋👇",
      revealedText: "💖 *Forehead kiss delivered successfully.* You are the most precious person in my life. Everything is going to be okay."
    }
  },
  {
    id: 10,
    numberTag: 'Letter #10',
    situationTitle: 'Open When You Are Overthinking Everything & Doubting Yourself 🛡️',
    category: 'comfort',
    categoryLabel: 'Safe Haven',
    envelopeColor: 'from-teal-600/30 to-slate-950/50 border-teal-500/40 text-teal-300',
    waxColor: '#14b8a6',
    songQuote: {
      lyrics: "“Yun hi chala chal rahi, kitni haseen hai ye duniya... Phool saare jhameloon se pare!” 🍃",
      songTitle: "Yun Hi Chala Chal",
      artist: "Udit Narayan & Hariharan"
    },
    letterContent: {
      greeting: "Dear Overthinking Queen,",
      body: [
        "Stop spiraling! Brain ko pause button dabao. Overthinking is just your creative imagination playing tricks on you.",
        "Look at how many obstacles you have already overcome in life. You are resilient, sharp, kind, and capable of achieving anything you put your heart to.",
        "When your mind gets too noisy, come talk to me. I will remind you of your superpower every single day until you believe it."
      ],
      closing: "Your anchor in the storm, Jay ⚓"
    },
    scratchSecret: {
      teaser: "Scratch to quiet your thoughts 🧠👇",
      revealedText: "✨ Affirmation: “Divu is strong, loved, blessed, and destined for brilliance.” Take a deep breath and smile."
    }
  },
  {
    id: 11,
    numberTag: 'Letter #11',
    situationTitle: 'Open When You Read 1,000 Reviews Before Buying 1 Small Thing 🔍',
    category: 'foodie',
    categoryLabel: 'Review Master Divu',
    envelopeColor: 'from-yellow-600/30 to-zinc-950/50 border-yellow-500/40 text-yellow-300',
    waxColor: '#ca8a04',
    songQuote: {
      lyrics: "“Cheez badi hai mast mast... cheez badi hai mast!” 🛍️",
      songTitle: "Tu Cheez Badi Hai Mast",
      artist: "Udit Narayan & Kavita Krishnamurthy"
    },
    letterContent: {
      greeting: "To the World’s Chief Product Inspector Divyanshi,",
      body: [
        "Are you currently watching YouTube unboxing videos, checking 1-star reviews on Amazon, comparing ingredients, and asking 5 friends for validation? 😂",
        "It is honestly one of the most hilariously cute things about you. The level of research you do could qualify for a PhD thesis!",
        "Just buy that dark chocolate bar, cute stationery, or crunchy snack already! You deserve nice things!"
      ],
      closing: "Your personal sponsor, Jay 💳"
    },
    scratchSecret: {
      teaser: "Scratch for the final verified product review ⭐👇",
      revealedText: "⭐⭐⭐⭐⭐ “Product: Jay's Heart. Review: 100% vegetarian, 0% return policy, permanently owned by Divyanshi.”"
    }
  },
  {
    id: 12,
    numberTag: 'Letter #12',
    situationTitle: 'Open When You Want to Know My Favorite Memory of Us 🎞️',
    category: 'romance',
    categoryLabel: 'Golden Frames',
    envelopeColor: 'from-amber-500/30 to-stone-950/50 border-amber-400/40 text-amber-300',
    waxColor: '#f59e0b',
    songQuote: {
      lyrics: "“Woh pehli baar jab hum mile, haathon me hath jab hum chale... Ho gaya aalam ye kya se kya!” 📷",
      songTitle: "Woh Pehli Baar",
      artist: "Shaan"
    },
    letterContent: {
      greeting: "Meri sweet memory Divu,",
      body: [
        "People often ask what my single favorite memory is, but the truth is it's impossible to pick just one.",
        "Is it sharing crispy snacks and food chats? Is it when we both realized we were falling in love? Or is it every random day when you send me a voice note saying 'Jay suno na'?",
        "Every single second with you is my new favorite memory. We are writing the sweetest book ever written."
      ],
      closing: "Collecting memories with you forever, Jay 📸"
    },
    scratchSecret: {
      teaser: "Scratch to view my private top memory 💫👇",
      revealedText: "💖 The moment you let down your walls and trusted me with your whole heart. That was the moment my life truly started."
    }
  },
  {
    id: 13,
    numberTag: 'Letter #13',
    situationTitle: 'Open When You Need Pure Pampering & Rich Dark Chocolate 🍫',
    category: 'comfort',
    categoryLabel: 'VIP Pamper Pass',
    envelopeColor: 'from-purple-600/30 to-purple-950/50 border-purple-500/40 text-purple-300',
    waxColor: '#9333ea',
    songQuote: {
      lyrics: "“Gulaabi aankhein jo teri dekhi, sharabi ye dil ho gaya... Sambhalo mujhko o mere yaaron!” 🌸",
      songTitle: "Gulabi Aankhen",
      artist: "Mohammed Rafi / Sanam"
    },
    letterContent: {
      greeting: "Princess Divu,",
      body: [
        "Low battery mode on? Koi baat nahi. Today is a 100% no-work, pure-pamper day.",
        "You are allowed to lie in bed, wrap yourself like a burrito in the softest blanket, eat dark chocolate, and complain about whatever you want.",
        "If I were there right now, I'd bring you crunchy chips, warm beverage, and a bowl of fresh crispy sev puri."
      ],
      closing: "Your full-time caretaker, Jay ☕"
    },
    scratchSecret: {
      teaser: "Scratch to activate your Pamper Coupon 👑👇",
      revealedText: "🍫 *VOUCHER ACTIVATED:* Free pass to be grumpy with zero consequences + unlimited 85% dark chocolate & forehead kisses."
    }
  },
  {
    id: 14,
    numberTag: 'Letter #14',
    situationTitle: 'Open When You Want to Dream About Our Future Home & Trips ✈️',
    category: 'future',
    categoryLabel: 'Future Blueprints',
    envelopeColor: 'from-cyan-600/30 to-sky-950/50 border-cyan-500/40 text-cyan-300',
    waxColor: '#06b6d4',
    songQuote: {
      lyrics: "“Safarnama... sawaalon ka safarnama... shuru tumse khatam tumpe safarnama!” 🗺️",
      songTitle: "Safarnama",
      artist: "Lucky Ali"
    },
    letterContent: {
      greeting: "To my future travel partner,",
      body: [
        "Close your eyes and picture it: Our own cozy home with fairy lights on the balcony, plants you pick out, and a kitchen where we make midnight snacks together.",
        "And all the travel itineraries: Finding the best vegetarian cafes in Europe, eating Japanese matcha and desserts in Kyoto, beach sunsets, and spontaneous road trips.",
        "We are going to build such a colorful, joyful, and beautiful life together. Just you and me taking on the world."
      ],
      closing: "Packing bags for eternity with you, Jay 🏝️"
    },
    scratchSecret: {
      teaser: "Scratch to unlock our secret dream destination 🏔️👇",
      revealedText: "✨ “Under a starry sky in the cold mountains, sharing dark chocolate and hot cocoa, laughing about how far we’ve come.” Soon baby."
    }
  },
  {
    id: 15,
    numberTag: 'Letter #15',
    situationTitle: 'Open When You Feel Like Nobody Truly Understands You 🤍',
    category: 'comfort',
    categoryLabel: 'Unspoken Connection',
    envelopeColor: 'from-slate-600/30 to-zinc-950/50 border-slate-500/40 text-slate-200',
    waxColor: '#64748b',
    songQuote: {
      lyrics: "“Tum se hi din hota hai, surmayi shaam aati hai... Tum se hi, tum se hi...” 🕊️",
      songTitle: "Tum Se Hi",
      artist: "Mohit Chauhan"
    },
    letterContent: {
      greeting: "Meri pure soul Divu,",
      body: [
        "Sometimes the outside world can feel noisy, superficial, and exhausting. You might feel like you have to filter yourself or put on a brave face.",
        "But with me, you never ever have to pretend. I see you completely. I see your sensitive heart, your deep emotions, your quirky habits, and your fears.",
        "You are fully understood, deeply cherished, and completely accepted just the way you are."
      ],
      closing: "Your safe space forever, Jay 🏡"
    },
    scratchSecret: {
      teaser: "Scratch for a reminder of unconditional love 🤍👇",
      revealedText: "💖 You never have to earn my love or be 'perfect'. You already have my whole heart simply by existing."
    }
  },
  {
    id: 16,
    numberTag: 'Letter #16',
    situationTitle: 'Open When You Have a Random Crazy Chaat Crawl / Midnight Plan ⚡',
    category: 'foodie',
    categoryLabel: 'Partner in Crime',
    envelopeColor: 'from-amber-600/30 to-red-950/50 border-amber-500/40 text-amber-300',
    waxColor: '#f97316',
    songQuote: {
      lyrics: "“Ude dil befikre... angaron ke dher pe befikre!” 🚀",
      songTitle: "Ude Dil Befikre",
      artist: "Benny Dayal"
    },
    letterContent: {
      greeting: "Partner in Crime Divu,",
      body: [
        "Whatever wild idea you just had in your head—my answer is already YES!",
        "Whether it’s going on a midnight Chaat crawl to find the crispiest Sev Puri, dancing in the rain at 1 AM, or buying every flavor of dark chocolate in the store, I am right beside you.",
        "Life is too short to be boring. Let's make memories, laugh until our stomachs hurt, and make stories we'll tell our grandkids."
      ],
      closing: "Your ready-to-go co-pilot, Jay 🏎️"
    },
    scratchSecret: {
      teaser: "Scratch to sign the chaos pact 🤝👇",
      revealedText: "💥 “I hereby sign up for 100% of Divu’s spontaneous mischief and midnight Chaat adventures.” Let’s go!"
    }
  },
  {
    id: 17,
    numberTag: 'Letter #17',
    situationTitle: 'Open When You Miss Our Singing & Banter Calls 🎤',
    category: 'romance',
    categoryLabel: 'Duet & Banter',
    envelopeColor: 'from-rose-600/30 to-pink-950/50 border-rose-500/40 text-rose-300',
    waxColor: '#f43f5e',
    songQuote: {
      lyrics: "“Tera hone laga hoon, khone laga hoon... Jab se mila hoon, jab se mila hoon...” 🎶",
      songTitle: "Tera Hone Laga Hoon",
      artist: "Atif Aslam & Alisha Chinai"
    },
    letterContent: {
      greeting: "Meri rockstar Divu,",
      body: [
        "Nothing makes me smile faster than remembering you trying to sing lyrics you half-remember on call! 😂",
        "Even when we both go completely off-key, those voice note wars and singing duets are the sweetest soundtrack of my days.",
        "Your voice has this magic that melts away all my exhaustion in 2 seconds flat."
      ],
      closing: "Your duet partner forever, Jay 🎵"
    },
    scratchSecret: {
      teaser: "Scratch to request an immediate love song 🎸👇",
      revealedText: "🎤 Hit me with a voice note right now! Even if you just say 'heyy Jay', it’s my favorite song of the year."
    }
  },
  {
    id: 18,
    numberTag: 'Letter #18',
    situationTitle: 'Open When You Want a Reminder of All My Promises to You 💍',
    category: 'future',
    categoryLabel: 'Unbreakable Vows',
    envelopeColor: 'from-amber-500/30 to-yellow-950/50 border-amber-400/40 text-amber-300',
    waxColor: '#eab308',
    songQuote: {
      lyrics: "“Tere jaisa yaar kahan, kahan aisa yaarana... Yaad karegi duniya tera mera afsana!” 🌟",
      songTitle: "Tere Jaisa Yaar Kahan",
      artist: "Kishore Kumar"
    },
    letterContent: {
      greeting: "My Queen Divyanshi,",
      body: [
        "Here are my core promises to you, written in stone:",
        "1. I will always listen to you when you speak, even if you are just rambling about your day.",
        "2. I will support your biggest dreams and stand beside you as you conquer them.",
        "3. I will never let a day pass without making sure you know how deeply you are loved.",
        "4. And I will always save the crispiest piece of Papdi Chaat and the last square of dark chocolate for you."
      ],
      closing: "Promised with all my soul, Jay 💍"
    },
    scratchSecret: {
      teaser: "Scratch to seal the lifetime contract ✍️👇",
      revealedText: "🌟 I promise to love you when you're 21, when you're 50, and when we are 80 with gray hair and sweet wrinkles."
    }
  },
  {
    id: 19,
    numberTag: 'Letter #19',
    situationTitle: 'Open When You Wake Up and Want a Fresh Sunshine Morning ☀️',
    category: 'birthday',
    categoryLabel: 'Morning Radiance',
    envelopeColor: 'from-amber-400/30 to-orange-950/50 border-amber-300/40 text-amber-200',
    waxColor: '#fbbf24',
    songQuote: {
      lyrics: "“Muskurane ki wajah tum ho, gungunane ki wajah tum ho... Jiya jaaye na, jaaye na, jaaye na... O re piya re!” 🌻",
      songTitle: "Muskurane Ki Wajah",
      artist: "Arijit Singh"
    },
    letterContent: {
      greeting: "Good Morning, Sunshine! ☀️",
      body: [
        "Waking up and knowing you exist in my world makes every morning feel like a gift.",
        "Stretch your arms, smile at the mirror (because you look adorable with morning bedhead), and get ready to have an incredible day.",
        "Whatever today brings, remember that you are capable of amazing things."
      ],
      closing: "Wishing you the sweetest day, Jay ☕"
    },
    scratchSecret: {
      teaser: "Scratch for your morning fortune 🔮👇",
      revealedText: "✨ Fortune: Today is going to bring you a sweet surprise, crispy food, and 100 reasons to smile. Go conquer the world!"
    }
  },
  {
    id: 20,
    numberTag: 'Letter #20',
    situationTitle: 'Open When You Just Need to Hear "I Love You" Without Any Reason 💖',
    category: 'romance',
    categoryLabel: 'Pure Unfiltered Love',
    envelopeColor: 'from-pink-600/30 to-rose-950/50 border-pink-500/40 text-pink-300',
    waxColor: '#f43f5e',
    songQuote: {
      lyrics: "“Kitni dafa subah ko meri tere aangan me baithe dekha... Maine gina tareefon me teri, saara jahan!” ✨",
      songTitle: "Kitni Dafa",
      artist: "Mohit Chauhan"
    },
    letterContent: {
      greeting: "My Divu,",
      body: [
        "No special occasion. No reason needed. Just a random reminder on an ordinary day:",
        "I love you. I love your voice. I love the way your eyes crinkle when you laugh. I love the way you care for people. I love how genuine your heart is.",
        "You are the best thing that ever happened to me, Divyanshi."
      ],
      closing: "Yours completely, Jay 🌹"
    },
    scratchSecret: {
      teaser: "Scratch to hear the whisper 💌👇",
      revealedText: "💖 “I love you in every universe, in every timeline, and with every breath I have.” You are my home."
    }
  },
  {
    id: 21,
    numberTag: 'Letter #21',
    situationTitle: 'Open on 2nd September 2027 (Your 22nd Birthday - Locked Time Capsule) 🔒⏳',
    category: 'birthday',
    categoryLabel: 'Future Time Capsule',
    envelopeColor: 'from-amber-500/30 to-amber-950/60 border-amber-400/50 text-amber-200',
    waxColor: '#f59e0b',
    songQuote: {
      lyrics: "“Hum rahe ya na rahe kal... kal yaad aayenge ye pal... Pyaar ke ye haseen pal!” ⏳✨",
      songTitle: "Pal",
      artist: "KK"
    },
    letterContent: {
      greeting: "Happy 22nd Birthday, My Future Wife! 💍✨",
      body: [
        "If you are reading this on 2nd September 2027, look how fast 365 days flew by!",
        "Think back to your 21st birthday when you opened this website for the first time. Look at all the goals you accomplished this year, all the tests you aced, and how much stronger our bond has grown.",
        "Another year passed, and my love for you has only multiplied a million times over. You are my forever girl."
      ],
      closing: "Loving you yesterday, today, and for all our tomorrows, Jay 👑💖"
    },
    scratchSecret: {
      teaser: "Scratch to unlock the 2027 Future Secret 🔑👇",
      revealedText: "🏆 1 year later, and I still fall in love with you every single morning. Happy 22nd Birthday Divu, let's make this next year even more magical!"
    }
  }
];

export function SealedLettersSection() {
  const [selectedLetter, setSelectedLetter] = useState<SealedLetter | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openedLettersMap, setOpenedLettersMap] = useState<Record<number, boolean>>({});
  const [scratchedMap, setScratchedMap] = useState<Record<number, boolean>>({});
  const [favoritesMap, setFavoritesMap] = useState<Record<number, boolean>>({});

  const categories = [
    { id: 'all', label: 'All 21 Letters (💌)' },
    { id: 'birthday', label: '🎂 21st Birthday Special' },
    { id: 'latenight', label: '🌙 Late Night & Deep' },
    { id: 'comfort', label: '🫂 Hugs & Comfort' },
    { id: 'foodie', label: '🥙 Papdi Chaat & Snacks' },
    { id: 'romance', label: '💖 Pure Romance' },
    { id: 'future', label: '✨ Future Promises' }
  ];

  const filteredLetters = activeCategory === 'all' 
    ? LETTERS_DATA 
    : LETTERS_DATA.filter(l => l.category === activeCategory);

  const openLetter = (letter: SealedLetter) => {
    setSelectedLetter(letter);
    setOpenedLettersMap(prev => ({ ...prev, [letter.id]: true }));
  };

  const closeLetter = () => {
    setSelectedLetter(null);
  };

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritesMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScratch = (id: number) => {
    setScratchedMap(prev => ({ ...prev, [id]: true }));
  };

  const totalOpened = Object.keys(openedLettersMap).length;

  return (
    <div className="relative w-full max-w-7xl mx-auto rounded-3xl p-4 sm:p-8 bg-gradient-to-b from-card/85 via-card/50 to-card/95 border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-brand/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative text-center max-w-3xl mx-auto mb-8 pt-4">
        
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs sm:text-sm font-semibold mb-4 backdrop-blur-md shadow-sm"
        >
          <Mail className="w-4 h-4 text-brand animate-bounce" />
          <span>21 Wax-Sealed Letters for Turning 21</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-foreground tracking-tight leading-tight drop-shadow-sm">
          “Open When...” <span className="bg-gradient-to-r from-brand via-pink-400 to-amber-300 bg-clip-text text-transparent">Love Envelopes</span> 💌✨
        </h2>

        <p className="mt-3 text-xs sm:text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
          21 handcrafted letters sealed with wax for 21 different moods and moments of our story. Each letter contains lyrics of our favorite songs, heartfelt words in Hinglish, and a secret scratch card to reveal hidden confessions!
        </p>

        {/* Progress Pill */}
        <div className="mt-5 inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/40 border border-amber-400/30 text-amber-200 text-xs sm:text-sm backdrop-blur-md">
          <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          <span>
            Letters Unsealed: <strong className="text-white font-mono">{totalOpened}</strong> of <strong className="text-amber-300 font-mono">21</strong>
          </span>
          <div className="w-24 sm:w-32 h-2 rounded-full bg-white/10 overflow-hidden ml-1">
            <div 
              className="h-full bg-gradient-to-r from-brand to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${(totalOpened / 21) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 select-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border",
              activeCategory === cat.id
                ? "bg-brand text-white border-brand shadow-md shadow-brand/25 scale-105"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 21 Envelopes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {filteredLetters.map((letter) => {
          const isOpened = openedLettersMap[letter.id];
          const isFavorite = favoritesMap[letter.id];

          return (
            <motion.div
              key={letter.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openLetter(letter)}
              className={cn(
                "group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg",
                isOpened 
                  ? "bg-card/70 border-white/15 hover:border-brand/40" 
                  : "bg-gradient-to-b " + letter.envelopeColor + " hover:shadow-brand/20"
              )}
            >
              {/* Envelope Flap Mockup Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              {/* Top Row: Number Tag & Favorite Button */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] font-mono font-bold text-amber-300">
                  {letter.numberTag}
                </span>

                <button
                  onClick={(e) => toggleFavorite(letter.id, e)}
                  className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 flex items-center justify-center text-muted-foreground transition-colors"
                >
                  <Heart className={cn("w-3.5 h-3.5", isFavorite ? "fill-pink-500 text-pink-500" : "text-gray-400")} />
                </button>
              </div>

              {/* Center: Wax Seal Icon & Situation Title */}
              <div className="my-auto text-center py-2">
                <div 
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 shadow-md border-2 border-white/20 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: letter.waxColor }}
                >
                  {isOpened ? (
                    <MailOpen className="w-5 h-5 text-white" />
                  ) : (
                    <Mail className="w-5 h-5 text-white animate-pulse" />
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-display font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors leading-snug">
                  {letter.situationTitle}
                </h4>
              </div>

              {/* Bottom Row: Category Label & Unseal Prompt */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium truncate max-w-[120px]">
                  {letter.categoryLabel}
                </span>

                <span className="text-brand font-semibold flex items-center gap-1 shrink-0">
                  {isOpened ? "Re-read 💌" : "Break Wax ✉️"}
                </span>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* FULL LETTER READING MODAL (PARCHMENT + SCRATCH-TO-REVEAL) */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLetter}
            className="fixed inset-0 z-50 p-4 sm:p-6 md:p-10 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1c1917] via-[#0c0a09] to-[#1c1917] border-2 border-amber-500/40 text-foreground shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
            >
              
              {/* Close Button */}
              <button
                onClick={closeLetter}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Decorative Envelope Seal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-inner text-white font-bold text-xs"
                    style={{ backgroundColor: selectedLetter.waxColor }}
                  >
                    21
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      {selectedLetter.numberTag} • {selectedLetter.categoryLabel}
                    </div>
                    <h3 className="text-base sm:text-xl font-display font-black text-white">
                      {selectedLetter.situationTitle}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Romantic Song Lyrics Quote Card */}
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200/95 flex items-start gap-3 shadow-inner">
                <Music className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="text-xs sm:text-sm font-serif italic leading-relaxed">
                    {selectedLetter.songQuote.lyrics}
                  </div>
                  <div className="text-[11px] text-amber-400/80 font-mono mt-1 font-semibold">
                    🎵 {selectedLetter.songQuote.songTitle} — {selectedLetter.songQuote.artist}
                  </div>
                </div>
              </div>

              {/* Heartfelt Hinglish Letter Content */}
              <div className="space-y-4 text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed font-sans pb-4">
                <p className="font-bold text-brand text-sm sm:text-base md:text-lg">
                  {selectedLetter.letterContent.greeting}
                </p>

                {selectedLetter.letterContent.body.map((para, pIdx) => (
                  <p key={pIdx}>
                    {para}
                  </p>
                ))}

                <p className="text-xs sm:text-sm text-amber-300/90 font-medium italic pt-2">
                  {selectedLetter.letterContent.closing}
                </p>
              </div>

              {/* INTERACTIVE SCRATCH-TO-REVEAL SECRET MESSAGE BOX */}
              <div className="mt-4 pt-5 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Hidden Secret Scratch Card</span>
                </div>

                <div 
                  onClick={() => handleScratch(selectedLetter.id)}
                  className={cn(
                    "relative p-4 sm:p-5 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden select-none",
                    scratchedMap[selectedLetter.id]
                      ? "bg-gradient-to-r from-amber-950/60 to-rose-950/60 border-amber-400/50 shadow-inner"
                      : "bg-gradient-to-r from-zinc-800 to-zinc-900 border-dashed border-amber-400/40 hover:border-amber-400 shadow-md group"
                  )}
                >
                  {scratchedMap[selectedLetter.id] ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs sm:text-sm md:text-base font-semibold text-amber-200 flex items-start gap-2.5"
                    >
                      <Sparkle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>{selectedLetter.scratchSecret.revealedText}</div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                          <Eraser className="w-5 h-5 text-amber-400 animate-bounce" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-gray-200">
                            {selectedLetter.scratchSecret.teaser}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Click or tap to scratch away the gold foil and unlock Jay's secret line!
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand text-black font-bold text-xs shadow-md group-hover:scale-105 transition-transform shrink-0"
                      >
                        Scratch Foil ✨
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  <span>Written with 100% love for Divu</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextIdx = (selectedLetter.id % LETTERS_DATA.length);
                      setSelectedLetter(LETTERS_DATA[nextIdx]);
                      setOpenedLettersMap(prev => ({ ...prev, [LETTERS_DATA[nextIdx].id]: true }));
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Letter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={closeLetter}
                    className="px-4 py-2 rounded-xl bg-brand text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    Fold & Close
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
