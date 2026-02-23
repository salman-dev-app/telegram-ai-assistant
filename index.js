import { Telegraf, Markup } from 'telegraf';
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
import { User } from './database/models/User.js';
import { CommandStats } from './database/models/CommandStats.js';
import { Template } from './database/models/Template.js';
import { GroupSettings } from './database/models/GroupSettings.js';
import { TemplateController } from './controllers/templateController.js';
import { GroupController } from './controllers/groupController.js';
import { DashboardManager } from './utils/dashboardManager.js';
import { AIResponseFormatter } from './utils/aiResponseFormatter.js';
import { ProductBrowser } from './utils/productBrowser.js';
import { StrictResponseFormatter } from './utils/strictResponseFormatter.js';

// Global Error Handlers (Moved to the top)
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught Exception:', error);
  logger.error('CRITICAL: Uncaught Exception:', error);
  process.exit(1);
});

async function bootstrap() {
  try {
    logger.info('Checking environment configuration...');
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
    logger.info('Initializing Telegraf bot...');
    const bot = new Telegraf(config.telegram.botToken);

    // Connect to database
    logger.info('Connecting to MongoDB...');
    await connectDatabase();
    logger.info('Database connection phase completed.');

    // Error handling
    bot.catch((err, ctx) => {
      logger.error('Bot instance error:', err);
    });

    // ===== COMMANDS =====
    logger.info('Registering commands...');
    bot.command('start', MessageController.handleStart);
    bot.command('help', MessageController.handleHelp);

    // ===== ADMIN COMMANDS =====
    bot.command('update_memory', isAdmin, AdminController.handleUpdateMemory);
    bot.command('add_product', isAdmin, AdminController.handleAddProduct);
    bot.command('remove_product', isAdmin, AdminController.handleRemoveProduct);
    bot.command('status', isAdmin, AdminController.handleStatus);
    bot.command('view_memory', isAdmin, AdminController.handleViewMemory);
    bot.command('list_products', isAdmin, AdminController.handleListProducts);
    bot.command('broadcast', isAdmin, AdminController.handleBroadcast);
    bot.command('backup', isAdmin, AdminController.handleBackup);

    // ===== NEW: GROUP MANAGEMENT COMMANDS =====
    bot.command('kick', isAdmin, AdminController.handleKickUser);
    bot.command('ban', isAdmin, AdminController.handleBanUser);
    bot.command('unban', isAdmin, AdminController.handleUnbanUser);
    bot.command('promote', isAdmin, AdminController.handlePromoteUser);

    // ===== NEW: FAQ MANAGEMENT COMMANDS =====
    bot.command('add_faq', isAdmin, AdminController.handleAddFAQ);
    bot.command('remove_faq', isAdmin, AdminController.handleRemoveFAQ);

    // ===== RESTART COMMAND =====
    bot.command('restart', isAdmin, async (ctx) => {
      await ctx.reply('🔄 *System Reboot Initiated...*\n\nShutting down and restarting bot instance.', { parse_mode: 'Markdown' });
      logger.info('Admin requested manual restart.');
      process.exit(0);
    });

    // ===== CALLBACKS - USER ACTIONS =====
    bot.action('main_menu', MessageController.handleStart);
    bot.action('help_menu', MessageController.handleHelp);
    bot.action('view_products', MessageController.handleListProducts);
    bot.action('lang_selection', MessageController.showLanguageSelection);
    bot.action(/^lang_/, MessageController.handleLanguageSelection);
    bot.action('contact_card', MessageController.sendContactCard);
    bot.action('my_profile', MessageController.handleMyProfile);
    bot.action('faq_menu', MessageController.handleFAQ);
    bot.action('command_stats', isAdmin, AdminController.handleCommandStats);

    // ===== CALLBACKS - ADMIN ACTIONS =====
    bot.action('admin_menu', isAdmin, MessageController.handleAdminMenu);
    bot.action('status_menu', isAdmin, AdminController.handleStatus);
    bot.action(/^status_/, isAdmin, AdminController.handleStatusCallback);
    bot.action('view_memory_cb', isAdmin, AdminController.handleViewMemory);
    bot.action('backup_system', isAdmin, AdminController.handleBackup);
    bot.action('broadcast_menu', isAdmin, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('📢 *BROADCAST SYSTEM*\n\nUsage: `/broadcast [your message]`\n\nThis will send a message to ALL users.', { parse_mode: 'Markdown' });
    });
    bot.action('restart_bot', isAdmin, async (ctx) => {
      await ctx.answerCbQuery('🔄 Restarting System...');
      await ctx.reply('🔄 *System Reboot Initiated...*\n\nShutting down and restarting bot instance.', { parse_mode: 'Markdown' });
      logger.info('Admin requested manual restart via button.');
      process.exit(0);
    });

    // ===== NEW: QUICK ACTION CALLBACKS =====
    bot.action('play_another', async (ctx) => {
      await ctx.answerCbQuery('Ready for another song! Just say "play [song name]"');
    });

    bot.action('stop_music', async (ctx) => {
      await ctx.answerCbQuery('Music stopped!');
    });

    bot.action('check_weather', async (ctx) => {
      await ctx.answerCbQuery('Tell me the city name!');
    });

    bot.action('weather_tomorrow', async (ctx) => {
      await ctx.answerCbQuery('Say "tomorrow weather in [city]"');
    });

    bot.action('another_joke', async (ctx) => {
      const { getRandomJoke } = await import('./utils/helpers.js');
      const joke = getRandomJoke();
      await ctx.editMessageText(`😂 ${joke}`);
      await ctx.answerCbQuery();
    });

    bot.action('another_quote', async (ctx) => {
      const { getQuoteOfTheDay } = await import('./utils/helpers.js');
      const quote = getQuoteOfTheDay();
      await ctx.editMessageText(`💡 *Quote of the Day:*\n\n"${quote}"`, { parse_mode: 'Markdown' });
      await ctx.answerCbQuery();
    });

    // ===== RATING CALLBACK =====
    bot.action('rate_bot', async (ctx) => {
      try {
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('⭐ 1', 'rate_1'),
            Markup.button.callback('⭐⭐ 2', 'rate_2'),
            Markup.button.callback('⭐⭐⭐ 3', 'rate_3')
          ],
          [
            Markup.button.callback('⭐⭐⭐⭐ 4', 'rate_4'),
            Markup.button.callback('⭐⭐⭐⭐⭐ 5', 'rate_5')
          ]
        ]);

        await ctx.editMessageText('⭐ *How would you rate this bot?*\n\nYour feedback helps us improve!', {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Error in rate_bot callback:', error);
      }
    });

    // ===== RATING HANDLERS =====
    for (let i = 1; i <= 5; i++) {
      bot.action(`rate_${i}`, async (ctx) => {
        try {
          const user = await User.findOne({ telegramId: ctx.from.id });
          if (user) {
            user.feedbackRating = i;
            await user.save();
          }
          
          await ctx.editMessageText(`✅ *Thank you for rating us ${i}/5!*\\n\\nYour feedback is valuable to us. 😊`, {
            parse_mode: 'Markdown'
          });
          await ctx.answerCbQuery('Rating saved!');
          logger.info(`User ${ctx.from.id} rated bot: ${i}/5`);
        } catch (error) {
          logger.error('Error in rating handler:', error);
        }
      });
    }

    // ===== PRODUCT INFO CALLBACK =====
    bot.action(/^product_/, async (ctx) => {
      try {
        const productId = ctx.callbackQuery.data.replace('product_', '');
        const product = await Product.findById(productId);
        
        if (!product) {
          return ctx.answerCbQuery('Product not found');
        }

        product.viewCount = (product.viewCount || 0) + 1;
        await product.save();

        const detailMsg = `
📦 *${product.name}*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 ${product.description}

💰 *Price:* ${product.price}

${product.features.length > 0 ? `✨ *Features:*\n${product.features.map(f => `• ${f}`).join('\n')}\n` : ''}

👁️ *Views:* ${product.viewCount}

🆔 ID: \`${product._id}\`
        `.trim();

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url('🔗 View Demo', product.demoUrl || 'https://t.me/Otakuosenpai')],
          [Markup.button.url('💬 Contact', product.contactUrl || 'https://t.me/Otakuosenpai')],
          [Markup.button.callback('⬅️ Back', 'view_products')]
        ]);

        await ctx.editMessageText(detailMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Error in product callback:', error);
        ctx.answerCbQuery('Error loading product');
      }
    });

    // ===== TEMPLATE CALLBACKS =====
    bot.action('template_categories', TemplateController.showCategories);
    bot.action(/^cat_/, TemplateController.showCategoryTemplates);
    bot.action(/^tmpl_nav_/, TemplateController.navigateTemplates);
    bot.action(/^tmpl_desc_/, TemplateController.showTemplateDescription);
    bot.action(/^tmpl_demo_/, TemplateController.showTemplateDemo);
    bot.action(/^file_info_/, TemplateController.showFileInfo);

    // ===== GROUP MANAGEMENT CALLBACKS =====
    bot.action('view_rules', GroupController.showRules);
    bot.action('rules_acknowledged', GroupController.acknowledgeRules);
    bot.action('group_stats', GroupController.showGroupStats);
    bot.action('group_settings', GroupController.showGroupSettings);
    bot.action('toggle_moderation', async (ctx) => {
      await GroupController.toggleSetting(ctx, 'moderation');
    });
    bot.action('toggle_antispam', async (ctx) => {
      await GroupController.toggleSetting(ctx, 'antispam');
    });
    bot.action('toggle_antilinks', async (ctx) => {
      await GroupController.toggleSetting(ctx, 'antilinks');
    });
    bot.action('toggle_anticaps', async (ctx) => {
      await GroupController.toggleSetting(ctx, 'anticaps');
    });

    // ===== MESSAGE HANDLING WITH RATE LIMITING =====
    bot.on('text', rateLimitMiddleware, async (ctx) => {
      const allowed = await GroupController.checkAutoModeration(ctx);
      if (!allowed) return;
      await GroupController.updateMessageCount(ctx);
      await MessageController.handleMessage(ctx);
    });

    // ===== NEW MEMBER HANDLER =====
    bot.on('new_chat_members', async (ctx) => {
      try {
        await GroupController.initializeGroup(ctx);
        for (const member of ctx.message.new_chat_members) {
          if (!member.is_bot) {
            await GroupController.welcomeNewMember(ctx);
          }
        }
      } catch (error) {
        logger.error('Error in new_chat_members handler:', error);
      }
    });

    // ===== HTTP SERVER FOR HEALTH CHECKS =====
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

    // ===== GRACEFUL SHUTDOWN =====
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

    // ===== START BOT =====
    logger.info('Clearing webhooks...');
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    
    logger.info('Waiting for safety delay...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.info('Launching bot instance...');
    await bot.launch({
      polling: {
        allowedUpdates: ['message', 'callback_query', 'chat_member'],
        dropPendingUpdates: true
      }
    });
    
    logger.info('🤖 Bot started successfully!');
    logger.info(`📋 Admin ID: ${config.telegram.adminId}`);

    // ===== PRODUCT BROWSER CALLBACKS =====
    bot.action('prod_list_0', async (ctx) => {
      await ProductBrowser.showProductList(ctx, 0);
    });

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
      const data = ctx.callbackQuery.data.replace('prod_file_', '').split('_');
      const productId = data[0];
      const fileIndex = parseInt(data[1]);
      await ProductBrowser.showFileDetails(ctx, productId, fileIndex);
    });

  } catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    logger.error('BOOTSTRAP ERROR:', err);
    process.exit(1);
  }
}

bootstrap();
