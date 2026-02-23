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
    models: [
      'openai/gpt-oss-120b:free',
      'stepfun/step-3.5-flash:free',
      'meta-llama/llama-3.2-3b-instruct:free'
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
