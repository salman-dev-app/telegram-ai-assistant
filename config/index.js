import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminId: parseInt(process.env.ADMIN_TELEGRAM_ID),
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
    typingDelayMin: 1000, // 1 second
    typingDelayMax: 3000, // 3 seconds
    maxRepliesPerMinute: 5,
    spamThreshold: 3, // Same message repeated 3 times
  }
};
