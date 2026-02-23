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
  rules: '📋 Rules',
  warnUser: '⚠️ Warn User',
  unmuteUser: '🔊 Unmute User'
};

// =============================================
// HELPER FUNCTIONS
// =============================================

// Detect music request
export function detectMusicRequest(message) {
  const musicPatterns = [
    /play\s+(.+)/i,
    /gan\s+bajao\s+(.+)/i,
    /shunao\s+(.+)/i,
    /music\s+(.+)/i
  ];

  for (const pattern of musicPatterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// Detect weather request
export function detectWeatherRequest(message) {
  const weatherPatterns = [
    /weather\s+in\s+(.+)/i,
    /abohawa\s+(.+)/i,
    /temperature\s+in\s+(.+)/i,
    /weather\s+(.+)/i
  ];

  for (const pattern of weatherPatterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// Get weather data
export async function getWeather(city, apiKey) {
  if (!apiKey) return "Weather API key not configured.";
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    if (data.cod !== 200) return "City not found.";
    
    return `🌤️ *Weather in ${data.name}*\n\n🌡️ Temp: ${data.main.temp}°C\n💧 Humidity: ${data.main.humidity}%\n☁️ Sky: ${data.weather[0].description}`;
  } catch (error) {
    return "Error fetching weather.";
  }
}

// Detect image generation request
export function detectImageRequest(message) {
  const imagePatterns = [
    /generate\s*:\s*(.+)/i,
    /image\s*:\s*(.+)/i,
    /chobi\s*:\s*(.+)/i,
    /make\s+image\s+of\s+(.+)/i
  ];

  for (const pattern of imagePatterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// Generate image (Placeholder)
export async function generateImage(prompt, config) {
  // This would typically call an external API like Stability AI or Replicate
  logger.info(`Generating image for prompt: ${prompt}`);
  return null; // Return null as placeholder
}

// Detect user intent
export function detectIntent(message) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('help')) return 'help';
  if (lowerMsg.includes('product') || lowerMsg.includes('script')) return 'product';
  if (lowerMsg.includes('contact') || lowerMsg.includes('hire')) return 'contact';
  if (lowerMsg.includes('price') || lowerMsg.includes('cost')) return 'price';
  return 'general';
}

// Get welcome message
export function getWelcomeMessage(userName) {
  return `👋 Hello ${userName}! Welcome to Salman Dev's official bot. How can I help you today?`;
}

// Calculate typing delay based on message length
export function calculateTypingDelay(length) {
  const base = 1000;
  const extra = Math.min(length * 20, 3000);
  return base + extra;
}

// Get random joke
export function getRandomJoke() {
  const jokes = [
    "Why did the web developer walk out of a restaurant? Because of the table layout.",
    "A SQL query walks into a bar, walks up to two tables, and asks, 'Can I join you?'",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
    "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25.",
    "There are only 10 kinds of people in this world: those who know binary and those who don't."
  ];
  return jokes[Math.floor(Math.random() * jokes.length)];
}

// Get quote of the day
export function getQuoteOfTheDay() {
  const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
    "Stay hungry, stay foolish. - Steve Jobs",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Analyze sentiment (Simple)
export function analyzeSentiment(message) {
  const lowerMsg = message.toLowerCase();
  const positive = ['good', 'great', 'awesome', 'thanks', 'thank', 'nice', 'happy', 'love'];
  const negative = ['bad', 'worst', 'hate', 'problem', 'error', 'broken', 'sad', 'angry'];
  
  for (const word of positive) {
    if (lowerMsg.includes(word)) return 'positive';
  }
  for (const word of negative) {
    if (lowerMsg.includes(word)) return 'negative';
  }
  return 'neutral';
}

// Get time-based greeting
export function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

// Get quick replies
export function getQuickReplies(intent) {
  switch (intent) {
    case 'product':
      return ['View Products', 'Pricing', 'Demo'];
    case 'contact':
      return ['Telegram', 'Email', 'Portfolio'];
    default:
      return ['Help', 'Products', 'Contact'];
  }
}

// Spam detection (Simple)
export function isSpamMessage(message) {
  if (message.length > 500) return true;
  if (message.includes('http') && message.includes('bit.ly')) return true;
  return false;
}

// Filter profanity (Simple)
export function filterProfanity(message) {
  const badWords = ['badword1', 'badword2']; // Add real ones if needed
  let filtered = message;
  for (const word of badWords) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '****');
  }
  return filtered;
}

// Extract keywords
export function extractKeywords(message) {
  return message.toLowerCase().split(' ').filter(word => word.length > 4);
}

// Log activity
export function logActivity(userId, action) {
  logger.info(`User ${userId} performed action: ${action}`);
}

// Group management functions
export async function kickUser(ctx, target) {
  try {
    let userId;
    if (target.startsWith('@')) {
      // Need to find ID from username - complex in Telegraf without DB
      return false;
    } else {
      userId = parseInt(target);
    }
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    return true;
  } catch (err) {
    logger.error('Kick failed:', err);
    return false;
  }
}

export async function banUser(ctx, target) {
  try {
    let userId;
    if (target.startsWith('@')) return false;
    else userId = parseInt(target);
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    return true;
  } catch (err) {
    return false;
  }
}

export async function unbanUser(ctx, target) {
  try {
    let userId;
    if (target.startsWith('@')) return false;
    else userId = parseInt(target);
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId);
    return true;
  } catch (err) {
    return false;
  }
}

export async function promoteModerator(ctx, target) {
  try {
    let userId;
    if (target.startsWith('@')) return false;
    else userId = parseInt(target);
    await ctx.telegram.promoteChatMember(ctx.chat.id, userId, {
      can_change_info: false,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_promote_members: false
    });
    return true;
  } catch (err) {
    return false;
  }
}
