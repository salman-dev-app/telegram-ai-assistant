import { Telegraf, Markup } from 'telegraf';
import { config } from './config/index.js';
import { MessageController } from './controllers/messageController.js';
import { AdminController } from './controllers/adminController.js';
import { GroupController } from './controllers/groupController.js';
import { TemplateController } from './controllers/templateController.js';
import { DashboardManager } from './utils/dashboardManager.js';
import { ProductBrowser } from './utils/productBrowser.js';
import { logger } from './utils/logger.js';
import { connectDB } from './database/connection.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { Product } from './database/models/Product.js';
import { Template } from './database/models/Template.js';
import http from 'http';

// Initialize Bot
const bot = new Telegraf(config.telegram.botToken);

// Admin Middleware
const isAdmin = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId === config.telegram.adminId) {
    return next();
  }
  if (ctx.callbackQuery) {
    return ctx.answerCbQuery('❌ Admin access required');
  }
};

// Error Handling
bot.catch((err, ctx) => {
  logger.error(`Telegraf Error for ${ctx.updateType}:`, err);
});

// Health Check Server
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

async function startBot() {
  try {
    logger.info('Checking environment configuration...');
    if (!config.telegram.botToken) throw new Error('TELEGRAM_BOT_TOKEN is missing');
    if (!config.mongodb.uri) throw new Error('MONGODB_URI is missing');

    logger.info('Initializing Telegraf bot...');
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('Database connection phase completed.');

    // ===== REGISTER ALL HANDLERS BEFORE LAUNCH =====
    logger.info('Registering commands...');
    bot.command('start', MessageController.handleStart);
    bot.command('help', MessageController.handleHelp);
    bot.command('admin', isAdmin, MessageController.handleAdminMenu);
    bot.command('status', isAdmin, AdminController.handleStatus);
    bot.command('update_memory', isAdmin, AdminController.handleUpdateMemory);
    bot.command('add_product', isAdmin, AdminController.handleAddProduct);
    bot.command('remove_product', isAdmin, AdminController.handleRemoveProduct);
    bot.command('list_products', isAdmin, AdminController.handleListProducts);
    bot.command('broadcast', isAdmin, AdminController.handleBroadcast);
    bot.command('backup', isAdmin, AdminController.handleBackup);
    bot.command('stats', isAdmin, AdminController.handleCommandStats);
    bot.command('kick', isAdmin, AdminController.handleKickUser);
    bot.command('ban', isAdmin, AdminController.handleBanUser);
    bot.command('unban', isAdmin, AdminController.handleUnbanUser);
    bot.command('promote', isAdmin, AdminController.handlePromoteUser);
    bot.command('add_faq', isAdmin, AdminController.handleAddFAQ);
    bot.command('remove_faq', isAdmin, AdminController.handleRemoveFAQ);

    // ===== CALLBACK QUERIES =====
    bot.action('main_menu', DashboardManager.renderMainDashboard);
    bot.action('help_menu', MessageController.handleHelp);
    bot.action('view_products', (ctx) => ProductBrowser.showProductList(ctx, 0));
    bot.action('lang_selection', MessageController.showLanguageSelection);
    bot.action(/^lang_/, MessageController.handleLanguageSelection);
    bot.action('contact_card', MessageController.sendContactCard);
    bot.action('my_profile', MessageController.handleMyProfile);
    bot.action('faq_menu', MessageController.handleFAQ);
    bot.action('command_stats', isAdmin, AdminController.handleCommandStats);
    bot.action('admin_menu', isAdmin, MessageController.handleAdminMenu);
    bot.action('status_menu', isAdmin, AdminController.handleStatus);
    bot.action(/^status_/, isAdmin, AdminController.handleStatusCallback);
    bot.action('view_memory_cb', isAdmin, AdminController.handleViewMemory);
    bot.action('backup_system', isAdmin, AdminController.handleBackup);
    bot.action('broadcast_menu', isAdmin, async (ctx) => {
      await ctx.answerCbQuery('Use /broadcast command in chat');
      await ctx.reply('📢 To broadcast, use: `/broadcast Your message here`', { parse_mode: 'Markdown' });
    });
    bot.action('restart_bot', isAdmin, async (ctx) => {
      await ctx.answerCbQuery('Restarting bot...');
      await ctx.reply('🔄 Bot is restarting...');
      process.exit(0);
    });

    // Content Refresh Callbacks
    bot.action('play_another', async (ctx) => {
      await ctx.answerCbQuery('Requesting another song...');
      await ctx.reply('🎵 What song would you like to hear? Just say "play [song name]"');
    });
    bot.action('stop_music', async (ctx) => {
      await ctx.answerCbQuery('Stopping music...');
      await ctx.reply('⏹️ Music stopped.');
    });
    bot.action('music_playlist', async (ctx) => {
      await ctx.answerCbQuery('Opening playlist...');
      await ctx.reply('🎵 Here is the current playlist: [Link to Playlist]');
    });
    bot.action('check_weather', async (ctx) => {
      await ctx.answerCbQuery('Checking weather...');
      await ctx.reply('🌤️ Which city would you like to check? Just say "weather in [city]"');
    });
    bot.action('weather_tomorrow', async (ctx) => {
      await ctx.answerCbQuery('Fetching tomorrow\'s forecast...');
      await ctx.reply('📅 Tomorrow\'s forecast: Sunny with a high of 28°C.');
    });
    bot.action('weather_forecast', async (ctx) => {
      await ctx.answerCbQuery('Fetching 5-day forecast...');
      await ctx.reply('📊 5-Day Forecast: [Link to Forecast]');
    });
    bot.action('generate_another', async (ctx) => {
      await ctx.answerCbQuery('Generating another image...');
      await ctx.reply('🖼️ What should I generate now? Just say "generate: [description]"');
    });
    bot.action('modify_image', async (ctx) => {
      await ctx.answerCbQuery('Opening image editor...');
      await ctx.reply('🎨 How would you like to modify the image?');
    });
    bot.action('funny_pics', async (ctx) => {
      await ctx.answerCbQuery('Fetching funny pictures...');
      await ctx.reply('😂 Here is a funny picture: [Link to Image]');
    });
    bot.action('share_quote', async (ctx) => {
      await ctx.answerCbQuery('Preparing to share...');
      await ctx.reply('✍️ You can share this quote by forwarding the message!');
    });
    bot.action('another_joke', async (ctx) => {
      await ctx.answerCbQuery('Fetching another joke...');
      const joke = MessageController.getRandomJoke ? MessageController.getRandomJoke() : "Why did the developer go broke? Because he used up all his cache!";
      await ctx.reply(`😂 ${joke}`);
    });
    bot.action('another_quote', async (ctx) => {
      await ctx.answerCbQuery('Fetching another quote...');
      const quote = MessageController.getQuoteOfTheDay ? MessageController.getQuoteOfTheDay() : "The best way to predict the future is to invent it.";
      await ctx.reply(`💡 ${quote}`);
    });

    // Confirmation Callbacks
    bot.action('confirm_yes', async (ctx) => {
      await ctx.answerCbQuery('Action confirmed');
      await ctx.editMessageText('✅ Action completed successfully.');
    });
    bot.action('confirm_no', async (ctx) => {
      await ctx.answerCbQuery('Action cancelled');
      await ctx.editMessageText('❌ Action cancelled.');
    });

    // Dashboard Panel Callbacks
    bot.action('dash_main', DashboardManager.renderMainDashboard);
    bot.action('dash_templates', DashboardManager.renderTemplatesPanel);
    bot.action('dash_settings', DashboardManager.renderSettingsPanel);
    bot.action('dash_profile', MessageController.handleMyProfile);
    bot.action('dash_group', GroupController.showGroupStats);
    bot.action('dash_help', MessageController.handleHelp);
    bot.action('dash_admin', isAdmin, MessageController.handleAdminMenu);
    bot.action('dash_lang', MessageController.showLanguageSelection);
    bot.action('dash_notif', (ctx) => ctx.answerCbQuery('Notifications toggled!'));
    bot.action('dash_theme', (ctx) => ctx.answerCbQuery('Theme changed!'));
    bot.action('dash_privacy', (ctx) => ctx.answerCbQuery('Privacy settings updated!'));

    // Profile & Rating Callbacks
    bot.action('dash_rate', async (ctx) => {
      await ctx.answerCbQuery('Opening rating panel...');
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ 1', 'rate_1'), Markup.button.callback('⭐ 2', 'rate_2'), Markup.button.callback('⭐ 3', 'rate_3')],
        [Markup.button.callback('⭐ 4', 'rate_4'), Markup.button.callback('⭐ 5', 'rate_5')],
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);
      await ctx.editMessageText('⭐ *RATE OUR SERVICE*\n\nPlease choose a rating:', { parse_mode: 'Markdown', ...keyboard });
    });
    bot.action('dash_stats', async (ctx) => {
      await ctx.answerCbQuery('Loading statistics...');
      await MessageController.handleMyProfile(ctx);
    });
    bot.action('rate_bot', async (ctx) => {
      await ctx.answerCbQuery();
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ 1', 'rate_1'), Markup.button.callback('⭐ 2', 'rate_2'), Markup.button.callback('⭐ 3', 'rate_3')],
        [Markup.button.callback('⭐ 4', 'rate_4'), Markup.button.callback('⭐ 5', 'rate_5')],
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);
      await ctx.editMessageText('⭐ *RATE OUR SERVICE*\n\nPlease choose a rating:', { parse_mode: 'Markdown', ...keyboard });
    });

    for (let i = 1; i <= 5; i++) {
      bot.action(`rate_${i}`, async (ctx) => {
        await ctx.answerCbQuery(`Rated ${i} stars!`);
        await ctx.editMessageText(`✅ *Thank you!*\n\nYou rated us ${i} stars. We appreciate your feedback!`, { parse_mode: 'Markdown' });
        setTimeout(() => DashboardManager.renderMainDashboard(ctx), 2000);
      });
    }

    // Product & Template Callbacks
    bot.action(/^product_/, async (ctx) => {
      const productId = ctx.match.input.split('_')[1];
      await ProductBrowser.showProductDetails(ctx, productId);
    });

    bot.action('template_categories', TemplateController.showCategories);
    bot.action(/^cat_/, TemplateController.showCategoryTemplates);
    bot.action(/^tmpl_nav_/, TemplateController.navigateTemplates);
    bot.action(/^tmpl_desc_/, TemplateController.showTemplateDescription);
    bot.action(/^tmpl_demo_/, TemplateController.showTemplateDemo);
    bot.action(/^file_info_/, TemplateController.showFileInfo);

    // Group Management Callbacks
    bot.action('view_rules', GroupController.showRules);
    bot.action('rules_acknowledged', GroupController.acknowledgeRules);
    bot.action('group_stats', GroupController.showGroupStats);
    bot.action('group_settings', GroupController.showGroupSettings);
    bot.action('toggle_moderation', async (ctx) => {
      await ctx.answerCbQuery('Moderation toggled');
      await GroupController.showGroupSettings(ctx);
    });
    bot.action('toggle_antispam', async (ctx) => {
      await ctx.answerCbQuery('Anti-spam toggled');
      await GroupController.showGroupSettings(ctx);
    });
    bot.action('toggle_antilinks', async (ctx) => {
      await ctx.answerCbQuery('Anti-links toggled');
      await GroupController.showGroupSettings(ctx);
    });
    bot.action('toggle_anticaps', async (ctx) => {
      await ctx.answerCbQuery('Anti-caps toggled');
      await GroupController.showGroupSettings(ctx);
    });

    // FAQ & Misc Callbacks
    bot.action('view_faqs', MessageController.handleFAQ);
    bot.action('search_faq', (ctx) => ctx.answerCbQuery('Use /help to find FAQs'));
    bot.action('search_products', (ctx) => ctx.answerCbQuery('Type your search query!'));
    bot.action('top_products', (ctx) => ProductBrowser.showProductList(ctx, 0));
    bot.action('retry_action', (ctx) => DashboardManager.renderMainDashboard(ctx));
    bot.action('contact_support', MessageController.sendContactCard);

    bot.action(/^prod_list_(\d+)$/, async (ctx) => {
      const page = parseInt(ctx.match[1]);
      await ProductBrowser.showProductList(ctx, page);
    });
    bot.action(/^prod_select_/, async (ctx) => {
      const productId = ctx.callbackQuery.data.replace('prod_select_', '');
      await ProductBrowser.showProductDetails(ctx, productId);
    });
    bot.action(/^prod_desc_/, async (ctx) => {
      const productId = ctx.callbackQuery.data.replace('prod_desc_', '');
      await ProductBrowser.showProductDescription(ctx, productId);
    });
    bot.action(/^prod_files_/, async (ctx) => {
      const productId = ctx.callbackQuery.data.replace('prod_files_', '');
      await ProductBrowser.showProductFiles(ctx, productId);
    });
    bot.action(/^prod_file_/, async (ctx) => {
      const parts = ctx.callbackQuery.data.replace('prod_file_', '').split('_');
      const productId = parts[0];
      const fileIndex = parseInt(parts[1]);
      await ProductBrowser.showFileDetails(ctx, productId, fileIndex);
    });

    bot.action(/^dash_cat_(.+)$/, async (ctx) => {
      const category = ctx.match[1];
      await DashboardManager.renderCategoryTemplates(ctx, category);
    });
    bot.action(/^dash_tmpl_nav_(.+)_(\d+)$/, async (ctx) => {
      const category = ctx.match[1];
      const page = parseInt(ctx.match[2]);
      await DashboardManager.renderCategoryTemplates(ctx, category, page);
    });
    bot.action(/^dash_tmpl_info_(.+)$/, async (ctx) => {
      const templateId = ctx.match[1];
      await DashboardManager.renderTemplateInfoPanel(ctx, templateId);
    });
    bot.action(/^dash_file_(.+)_(\d+)$/, async (ctx) => {
      const templateId = ctx.match[1];
      const fileIndex = parseInt(ctx.match[2]);
      await DashboardManager.renderFileInfoPanel(ctx, templateId, fileIndex);
    });

    bot.action(/^dash_tmpl_demo_(.+)$/, async (ctx) => {
      const templateId = ctx.match[1];
      const template = await Template.findById(templateId);
      if (!template || !template.demoUrl) {
        return ctx.answerCbQuery('Demo not available for this template');
      }
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('🔗 Open Demo', template.demoUrl)],
        [Markup.button.callback('⬅️ Back', `dash_tmpl_info_${templateId}`)]
      ]);
      await ctx.editMessageText(`🔗 *Demo Available*\n\nClick the button below to view the demo.`, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    });

    // ===== MESSAGE HANDLING WITH RATE LIMITING =====
    bot.on('text', rateLimitMiddleware, async (ctx) => {
      const allowed = await GroupController.checkAutoModeration(ctx);
      if (allowed) {
        await MessageController.handleMessage(ctx);
      }
    });

    // ===== LAUNCH =====
    const webhookUrl = process.env.WEBHOOK_URL;
    const port = process.env.PORT || 3000;

    if (webhookUrl) {
      logger.info(`Launching bot in WEBHOOK mode on port ${port}...`);
      logger.info(`Webhook URL: ${webhookUrl}`);
      
      await bot.launch({
        webhook: {
          domain: webhookUrl,
          port: parseInt(port)
        }
      });
      
      // Also start health check server on port 8000 for Koyeb
      server.listen(8000, () => {
        logger.info('🌐 Health check server listening on port 8000');
      });
    } else {
      logger.info('Clearing webhooks...');
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      
      logger.info('Launching bot in POLLING mode...');
      bot.launch();
      
      server.listen(port, () => {
        logger.info(`🌐 Health check server listening on port ${port}`);
      });
    }

    logger.info('🚀 Bot is fully operational!');

  } catch (error) {
    logger.error('CRITICAL: Bot failed to start:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});

// Start the application
startBot();

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception:', err);
  // Give some time for logging before exiting
  setTimeout(() => process.exit(1), 1000);
});
