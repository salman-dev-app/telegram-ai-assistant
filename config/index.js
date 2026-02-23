import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminId: parseInt(process.env.ADMIN_TELEGRAM_ID),
    musicBotUsername: process.env.MUSIC_BOT_USERNAME || 'YourMusicBot',
    groupId: process.env.GROUP_ID || null,
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    // Confirmed working free models on OpenRouter (Feb 2026)
    models: [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ]
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  bot: {
    typingDelayMin: 1000,
    typingDelayMax: 3000,
    maxRepliesPerMinute: 8,
    spamThreshold: 3,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY || null,
  },
  imageGeneration: {
    stabilityApiKey: process.env.STABILITY_API_KEY || null,
    huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY || null,
    replicateApiKey: process.env.REPLICATE_API_KEY || null,
  }
};
