import { Telegraf } from 'telegraf';
import http from 'http';
import { config } from './config/index.js';
import { connectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';
import { isAdmin } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { AdminController } from './controllers/adminController.js';
import { MessageController } from './controllers/messageController.js';
import { BrandMemory } from './database/models/BrandMemory.js';
import { Product } from './database/models/Product.js';

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
bot.command('broadcast', isAdmin, AdminController.handleBroadcast);
bot.command('backup', isAdmin, AdminController.handleBackup);

// Admin Restart Command
bot.command('restart', isAdmin, async (ctx) => {
  await ctx.reply('🔄 *System Reboot Initiated...*\nShutting down and restarting bot instance.', { parse_mode: 'Markdown' });
  logger.info('Admin requested manual restart.');
  process.exit(0);
});

// Callbacks - User Actions
bot.action('main_menu', MessageController.handleStart);
bot.action('help_menu', MessageController.handleHelp);
bot.action('view_products', MessageController.handleListProducts);
bot.action('lang_selection', MessageController.showLanguageSelection);
bot.action(/^lang_/, MessageController.handleLanguageSelection);
bot.action('contact_card', MessageController.sendContactCard);

// Callbacks - Admin Actions
bot.action('admin_menu', isAdmin, MessageController.handleAdminMenu);
bot.action('status_menu', isAdmin, AdminController.handleStatus);
bot.action(/^status_/, isAdmin, AdminController.handleStatusCallback);
bot.action('view_memory_cb', isAdmin, AdminController.handleViewMemory);
bot.action('backup_system', isAdmin, AdminController.handleBackup);
bot.action('broadcast_menu', isAdmin, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📢 *BROADCAST SYSTEM*\n\nUsage: `/broadcast [your message]`\n\nThis will send a message to ALL users who have talked to the bot.', { parse_mode: 'Markdown' });
});
bot.action('restart_bot', isAdmin, async (ctx) => {
  await ctx.answerCbQuery('🔄 Restarting System...');
  await ctx.reply('🔄 *System Reboot Initiated...*\nShutting down and restarting bot instance.', { parse_mode: 'Markdown' });
  logger.info('Admin requested manual restart via button.');
  process.exit(0);
});

// Message handling with rate limiting
bot.on('text', rateLimitMiddleware, MessageController.handleMessage);

// Simple HTTP server for Render port binding & Uptime Monitoring
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🌐 Health check server listening on port ${PORT}`);
});

// Self-pinging mechanism to prevent Render sleep
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  if (url.startsWith('http')) {
    http.get(`${url}/health`, (res) => {
      logger.info(`Self-ping status: ${res.statusCode}`);
    }).on('error', (err) => {
      logger.error(`Self-ping error: ${err.message}`);
    });
  }
}, 10 * 60 * 1000);

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received, stopping bot...`);
  bot.stop(signal);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Start bot with robust error handling for 409 Conflict
const startBot = async () => {
  try {
    logger.info('Starting bot initialization...');
    
    // 1. Force clear any existing webhooks and pending updates
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    logger.info('Webhook and pending updates cleared.');

    // 2. Wait for a few seconds to let Telegram's servers sync
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Launch the bot with polling
    await bot.launch({
      polling: {
        allowedUpdates: ['message', 'callback_query'],
        dropPendingUpdates: true
      }
    });
    
    logger.info('🤖 Bot started successfully!');
    logger.info(`📋 Admin ID: ${config.telegram.adminId}`);
    logger.info('✅ Ready to receive messages');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    
    if (error.code === 409 || error.message.includes('409')) {
      logger.warn('409 Conflict detected. Retrying in 15 seconds...');
      setTimeout(startBot, 15000);
    } else {
      logger.error('Critical error during startup. Exiting...');
      process.exit(1);
    }
  }
};

startBot();
