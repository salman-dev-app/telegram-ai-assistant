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
  viewPrice: '💰 Price',
  viewFeatures: '✨ Features',
  orderNow: '🛒 Order Now',
  contactSeller: '💬 Contact Seller',
  
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
  translate: '🌐 Translate',
  
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
  translateMsg: '🌐 Translate Message',
  
  // Misc
  searchProduct: '🔍 Search Product',
  shareBot: '📤 Share Bot',
  dashboard: '📊 Dashboard',
  joke: '😂 Tell Joke',
};

// =============================================
// MUSIC BOT DETECTION
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
// WEATHER HELPER
// =============================================
export function detectWeatherRequest(message) {
  const lower = message.toLowerCase();
  
  const patterns = [
    /weather\s+(?:in\s+)?(.+)/i,
    /(.+)\s+weather/i,
    /aabohawa\s+(.+)/i,
    /(.+)\s+aabohawa/i,
    /(.+)\s+er\s+weather/i,
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
// TRANSLATION HELPER
// =============================================
export async function translateMessage(text, targetLanguage) {
  // Using Google Translate API (free via RapidAPI or similar)
  // For now, return a message that translation is available
  try {
    const { default: axios } = await import('axios');
    
    const languageMap = {
      'english': 'en',
      'bangla': 'bn',
      'banglish': 'bn',
      'hindi': 'hi'
    };
    
    const targetLang = languageMap[targetLanguage.toLowerCase()] || 'en';
    
    // Using MyMemory Translation API (free, no key needed)
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`,
      { timeout: 8000 }
    );
    
    if (response.data.responseStatus === 200) {
      return response.data.responseData.translatedText;
    }
    
    return `❌ Translation failed. Please try again.`;
  } catch (error) {
    return `❌ Translation service unavailable. Please try again later.`;
  }
}

export function detectTranslationRequest(message) {
  const lower = message.toLowerCase();
  
  const patterns = [
    /translate\s+(?:to\s+)?(.+?):\s*(.+)/i,
    /translate\s+(.+?):\s*(.+)/i,
    /translate\s+this\s+to\s+(.+?):\s*(.+)/i,
    /(.+?)\s+to\s+(.+?):\s*(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        language: match[match.length - 2].trim(),
        text: match[match.length - 1].trim()
      };
    }
  }
  
  return null;
}

// =============================================
// IMAGE GENERATION HELPER
// =============================================
export async function generateImage(prompt, apiKey) {
  if (!apiKey) {
    return null;
  }
  
  try {
    const { default: axios } = await import('axios');
    
    // Using Hugging Face API for image generation
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
// GROUP MANAGEMENT HELPERS
// =============================================
export const GroupCommands = {
  kick: '/kick',
  ban: '/ban',
  mute: '/mute',
  unmute: '/unmute',
  pin: '/pin',
  unpin: '/unpin',
  promote: '/promote',
  demote: '/demote',
};

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
// JOKES (Banglish & English)
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
  
  // Translation request
  if (detectTranslationRequest(message)) return 'translate';
  
  // Image generation
  if (detectImageRequest(message)) return 'image';
  
  // Joke request
  if (/joke|funny|laugh|haha|lol/.test(lower)) return 'joke';
  
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

// =============================================
// POLL CREATION HELPER
// =============================================
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
