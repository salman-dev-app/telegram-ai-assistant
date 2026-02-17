import { Telegraf } from 'telegraf';
import { config } from './config/index.js';
import { connectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';
import { isAdmin } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { AdminController } from './controllers/adminController.js';
import { MessageController } from './controllers/messageController.js';

// Validate environment variables
if (!config.telegram.botToken) {
  logger.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

if (!config.telegram.adminId) {
  logger.error('ADMIN_TELEGRAM_ID is not set');
  process.exit(1);
}

if (!config.openRouter.apiKey) {
  logger.error('OPENROUTER_API_KEY is not set');
  process.exit(1);
}

if (!config.mongodb.uri) {
  logger.error('MONGODB_URI is not set');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(config.telegram.botToken);

// Connect to database
await connectDatabase();

// Error handling
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
});

// Commands
bot.command('start', MessageController.handleStart);
bot.command('help', MessageController.handleHelp);

// Admin commands
bot.command('update_memory', isAdmin, AdminController.handleUpdateMemory);
bot.command('add_product', isAdmin, AdminController.handleAddProduct);
bot.command('status', isAdmin, AdminController.handleStatus);
bot.command('view_memory', isAdmin, AdminController.handleViewMemory);
bot.command('list_products', isAdmin, AdminController.handleListProducts);

// Language selection callback
bot.action(/^lang_/, MessageController.handleLanguageSelection);

// Message handling with rate limiting
bot.on('text', rateLimitMiddleware, MessageController.handleMessage);

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('SIGINT received, stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
});

// Start bot
bot.launch()
  .then(() => {
    logger.info('🤖 Bot started successfully!');
    logger.info(`📋 Admin ID: ${config.telegram.adminId}`);
    logger.info('✅ Ready to receive messages');
  })
  .catch((error) => {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  });
