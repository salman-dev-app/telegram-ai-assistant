// =============================================
// UI BUTTONS - English Only (No Bangla Script)
// Three languages: English, Bangla, Hindi
// =============================================
export const UIButtons = {
  // Main menu
  mainMenu: '🏠 Main Menu',
  products: '📦 Products',
  help: '📖 Help',
  language: '🌐 Language',
  adminPanel: '🛠 Admin Panel',
  contact: '💬 Contact',
  back: '⬅️ Back',
  
  // Product buttons
  viewDemo: '🔗 View Demo',
  buyNow: '🛒 Buy Now',
  viewPrice: '💰 Price',
  viewFeatures: '✨ Features',
  
  // Language selection (English labels only)
  selectLanguage: '🌐 Select Language',
  bangla: '🇧🇩 Bangla',
  hindi: '🇮🇳 Hindi',
  english: '🇬🇧 English',
  
  // Status
  online: '🟢 Online',
  busy: '🟡 Busy',
  away: '🔴 Away',
  
  // Actions
  feedback: '⭐ Feedback',
  myProfile: '👤 My Profile',
  faq: '❓ FAQ',
  weather: '🌤️ Weather',

  
  // Ratings
  rate1: '⭐ 1 Star',
  rate2: '⭐⭐ 2 Stars',
  rate3: '⭐⭐⭐ 3 Stars',
  rate4: '⭐⭐⭐⭐ 4 Stars',
  rate5: '⭐⭐⭐⭐⭐ 5 Stars',
  
  // Admin
  broadcast: '📢 Broadcast',
  backup: '🛡️ Backup',
  userStats: '📊 User Stats',
  blockUser: '🚫 Block User',
  unblockUser: '✅ Unblock User',
  restart: '🔄 Restart',
  
  // Group Management
  groupSettings: '⚙️ Group Settings',
  kickUser: '👢 Kick User',
  banUser: '🚫 Ban User',
  muteUser: '🔇 Mute User',
  welcomeMsg: '👋 Welcome Message',
  groupStats: '📊 Group Stats',
  
  // Music
  playMusic: '🎵 Play Music',
  stopMusic: '⏹️ Stop Music',
  
  // Image & Translation
  generateImage: '🖼️ Generate Image',

  
  // Misc
  searchProduct: '🔍 Search Product',
  shareBot: '📤 Share Bot',
  dashboard: '📊 Dashboard',
  joke: '😂 Tell Joke',
};

// =============================================
// MUSIC BOT DETECTION & INTEGRATION
// =============================================
export function detectMusicRequest(message) {
  const lower = message.toLowerCase().trim();
  
  const patterns = [
    /^play\s+(.+)/i,
    /^play\s+song\s+(.+)/i,
    /^gaan\s+baja\s+(.+)/i,
    /^baja\s+(.+)/i,
    /^song\s+play\s+(.+)/i,
    /^music\s+play\s+(.+)/i,
    /^(.+)\s+song\s+play/i,
    /^(.+)\s+baja/i,
    /^play\s+me\s+(.+)/i,
    /^i\s+want\s+to\s+listen\s+(.+)/i,
    /^play\s+this\s+(.+)/i,
    /^(.+)\s+gaan\s+chai/i,
    /^(.+)\s+song\s+chai/i,
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

// =============================================
// WEATHER HELPER - AUTO DETECTION
// =============================================
export function detectWeatherRequest(message) {
  const lower = message.toLowerCase();
  
  const patterns = [
    /weather\s+(?:in\s+)?(.+)/i,
    /(.+)\s+weather/i,
    /aabohawa\s+(.+)/i,
    /(.+)\s+aabohawa/i,
    /(.+)\s+er\s+weather/i,
    /what's?\s+the\s+weather\s+(?:in\s+)?(.+)/i,
    /weather\s+of\s+(.+)/i,
    /how's?\s+the\s+weather\s+(?:in\s+)?(.+)/i,
    /temperature\s+(?:in\s+)?(.+)/i,
    /(.+)\s+temperature/i,
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const city = match[1].trim().replace(/\?/g, '').trim();
      if (city.length > 1 && city.length < 50) {
        return city;
      }
    }
  }
  
  return null;
}

export async function getWeather(city, apiKey) {
  if (!apiKey) {
    return `🌤️ Weather API not configured. Please contact admin to add API key.`;
  }
  
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      { timeout: 8000 }
    );
    
    const data = response.data;
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const desc = data.weather[0].description;
    const wind = data.wind.speed;
    
    return `🌤️ **${data.name}, ${data.sys.country}** Weather:\n\n🌡️ Temperature: ${temp}°C (feels like ${feels}°C)\n💧 Humidity: ${humidity}%\n🌬️ Wind: ${wind} m/s\n☁️ Condition: ${desc}`;
  } catch (error) {
    if (error.response?.status === 404) {
      return `❌ City "${city}" not found. Please check the spelling.`;
    }
    return `❌ Could not fetch weather right now. Please try again later.`;
  }
}

// =============================================
// TRANSLATION HELPER - AUTO DETECTION
// =============================================


// =============================================
// IMAGE GENERATION HELPER - AUTO DETECTION
// =============================================
export async function generateImage(prompt, apiKey) {
  if (!apiKey) {
    return null;
  }
  
  try {
    const { default: axios } = await import('axios');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
        responseType: 'arraybuffer'
      }
    );
    
    return response.data;
  } catch (error) {
    return null;
  }
}

export function detectImageRequest(message) {
  const lower = message.toLowerCase();
  
  const patterns = [
    /generate\s+image:\s*(.+)/i,
    /create\s+image:\s*(.+)/i,
    /draw:\s*(.+)/i,
    /image\s+of\s+(.+)/i,
    /generate\s+(.+)/i,
    /create\s+(.+)/i,
    /make\s+an?\s+image\s+of\s+(.+)/i,
    /draw\s+me\s+(.+)/i,
    /can\s+you\s+generate\s+(.+)/i,
    /generate\s+a\s+picture\s+of\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

// =============================================
// 10 NEW FEATURES
// =============================================

// 1. SENTIMENT ANALYSIS
export function analyzeSentiment(message) {
  const lower = message.toLowerCase();
  
  const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love', 'amazing', 'best', 'fantastic', 'valo', 'bhalo', 'sundor', 'nice', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'sad', 'angry', 'kharap', 'bhayanok', 'dukkito', 'upset'];
  
  let sentiment = 'neutral';
  let score = 0;
  
  for (const word of positiveWords) {
    if (lower.includes(word)) score++;
  }
  
  for (const word of negativeWords) {
    if (lower.includes(word)) score--;
  }
  
  if (score > 0) sentiment = 'positive';
  if (score < 0) sentiment = 'negative';
  
  return sentiment;
}

// 2. QUOTE OF THE DAY
const QUOTES = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Life is what happens when you're busy making other plans. - John Lennon",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "It is during our darkest moments that we must focus to see the light. - Aristotle",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "Success is not final, failure is not fatal. - Winston Churchill",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs"
];

export function getQuoteOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// 3. POLL CREATION
export async function createPoll(ctx, question, options) {
  try {
    await ctx.telegram.sendPoll(ctx.chat.id, question, options, {
      is_anonymous: true,
      allows_multiple_answers: false,
    });
    return true;
  } catch (error) {
    return false;
  }
}

// 4. REMINDER SYSTEM
export function parseReminderTime(timeStr) {
  const lower = timeStr.toLowerCase();
  const now = new Date();
  
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  const match = timeStr.match(/(\d+)\s*(minutes?|hours?|days?)/i);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const future = new Date(now);
    
    if (unit.includes('minute')) future.setMinutes(future.getMinutes() + amount);
    if (unit.includes('hour')) future.setHours(future.getHours() + amount);
    if (unit.includes('day')) future.setDate(future.getDate() + amount);
    
    return future;
  }
  
  return null;
}

// 5. SPAM FILTER IMPROVED
export function isSpamMessage(message, previousMessages = []) {
  if (message.length < 3) return true;
  
  // Check for repeated characters
  if (/(.)\1{9,}/.test(message)) return true;
  
  // Check for all caps
  if (message === message.toUpperCase() && message.length > 5) return true;
  
  // Check for repeated messages
  const recent = previousMessages.slice(-5);
  if (recent.filter(m => m === message).length >= 2) return true;
  
  return false;
}

// 6. PROFANITY FILTER
const BLOCKED_WORDS = ['badword1', 'badword2']; // Add actual words as needed

export function filterProfanity(message) {
  let filtered = message;
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  return filtered;
}

// 7. KEYWORD EXTRACTION
export function extractKeywords(message) {
  const words = message.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are'];
  
  return words.filter(word => 
    word.length > 3 && 
    !stopWords.includes(word) &&
    !/^\d+$/.test(word)
  );
}

// 8. TIME-BASED GREETING
export function getTimeBasedGreeting(language = 'english') {
  const hour = new Date().getHours();
  
  const greetings = {
    english: {
      morning: '🌅 Good morning! How can I help you today?',
      afternoon: '☀️ Good afternoon! What can I do for you?',
      evening: '🌆 Good evening! Need any assistance?',
      night: '🌙 Good night! Still awake? How can I help?'
    },
    bangla: {
      morning: '🌅 Shubho Shokaal! Aaj ki korte pari?',
      afternoon: '☀️ Shubho Dopohor! Kono help lagbe?',
      evening: '🌆 Shubho Shondhya! Kemon acho?',
      night: '🌙 Shubho Raat! Ekono jagey acho? Ki lagbe?'
    },
    hindi: {
      morning: '🌅 Subah ho! Main aapki kya madad kar sakta hoon?',
      afternoon: '☀️ Shubh Dopahar! Kya chahiye?',
      evening: '🌆 Shubh Shaam! Kaise ho?',
      night: '🌙 Shubh Raat! Abhi jaga ho? Kya chahiye?'
    }
  };
  
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  if (hour >= 21 || hour < 5) timeOfDay = 'night';
  
  return greetings[language]?.[timeOfDay] || greetings.english[timeOfDay];
}

// 9. QUICK REPLY SUGGESTIONS
export function getQuickReplies(intent) {
  const replies = {
    products: ['Tell me more', 'Show demo', 'How much?', 'Contact seller'],
    help: ['How to use?', 'Commands', 'Features', 'Support'],
    music: ['Play another', 'Stop', 'Playlist', 'Recommendations'],
    weather: ['Tomorrow weather', 'Other city', 'Forecast', 'Alerts'],
    general: ['Help', 'Products', 'Contact', 'About']
  };
  
  return replies[intent] || replies.general;
}

// 10. ACTIVITY LOGGER
export function logActivity(userId, action, details = {}) {
  return {
    userId,
    action,
    details,
    timestamp: new Date(),
    ip: details.ip || 'unknown'
  };
}

// =============================================
// GROUP MANAGEMENT HELPERS
// =============================================
export async function kickUser(ctx, userId) {
  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    return true;
  } catch (error) {
    return false;
  }
}

export async function banUser(ctx, userId) {
  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId, { until_date: 0 });
    return true;
  } catch (error) {
    return false;
  }
}

export async function unbanUser(ctx, userId) {
  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId);
    return true;
  } catch (error) {
    return false;
  }
}

export async function restrictUser(ctx, userId, permissions) {
  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, permissions);
    return true;
  } catch (error) {
    return false;
  }
}

export async function promoteModerator(ctx, userId) {
  try {
    await ctx.telegram.promoteChatMember(ctx.chat.id, userId, {
      can_delete_messages: true,
      can_restrict_members: true,
      can_manage_topics: true,
    });
    return true;
  } catch (error) {
    return false;
  }
}

// =============================================
// JOKES
// =============================================
const JOKES = [
  "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He never came back because they had eggs! 😂",
  "Why do Java developers wear glasses? Because they don't C#! 😄",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💻",
  "Why did the developer go broke? Because he lost his cache! 😂",
  "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?' 🍺",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "How many programmers does it take to change a light bulb? None, they just update the darkness() function! 😄",
  "Why did the developer go to jail? He had too many unresolved issues! ⚖️",
];

export function getRandomJoke() {
  return JOKES[Math.floor(Math.random() * JOKES.length)];
}

// =============================================
// SMART CONVERSATION INTENT DETECTOR
// =============================================
export function detectIntent(message) {
  const lower = message.toLowerCase().trim();
  
  // Music request
  if (detectMusicRequest(message)) return 'music';
  
  // Weather request
  if (detectWeatherRequest(message)) return 'weather';
  

  
  // Image generation
  if (detectImageRequest(message)) return 'image';
  
  // Joke request
  if (/joke|funny|laugh|haha|lol/.test(lower)) return 'joke';
  
  // Quote request
  if (/quote|inspiration|motivat|wisdom/.test(lower)) return 'quote';
  
  // Contact/portfolio request
  if (/contact|portfolio|link|github|whatsapp|email|salman dev|reach|connect/.test(lower)) return 'contact';
  
  // Product/service request
  if (/product|service|price|cost|demo|buy|order|website|app|bot|build/.test(lower)) return 'products';
  
  // FAQ / help
  if (/faq|help|how to|what is|guide/.test(lower)) return 'faq';
  
  // Profile request
  if (/profile|my info|my profile|stat/.test(lower)) return 'profile';
  
  // Feedback
  if (/feedback|rating|rate|review/.test(lower)) return 'feedback';
  
  // Greeting
  if (/^(hi|hello|hey|hola|salam|assalamu|namaskar|hy|hii|yo|sup)/.test(lower)) return 'greeting';
  
  // General question (has ?)
  if (message.includes('?')) return 'question';
  
  return 'general';
}

// =============================================
// WELCOME MESSAGE GENERATOR
// =============================================
export function getWelcomeMessage(firstName, language = 'english') {
  const messages = {
    english: `👋 Welcome *${firstName}* to the group! I'm Salman Dev's AI assistant. Feel free to ask anything! 😊`,
    bangla: `👋 ${firstName} ke group e swagotom! Ami Salman Dev er AI assistant. Kono kichu dorkar hole bolun! 😊`,
    hindi: `👋 ${firstName} ka group mein swagat hai! Main Salman Dev ka AI assistant hoon. Kuch bhi poocho! 😊`
  };
  return messages[language] || messages.english;
}

// =============================================
// TYPING DELAY CALCULATOR
// =============================================
export function calculateTypingDelay(responseLength) {
  const baseDelay = 800;
  const charDelay = Math.min(responseLength * 25, 3000);
  return baseDelay + charDelay;
}
