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

// ===== GLOBAL ERROR HANDLERS =====
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('CRITICAL: Unhandled Rejection at:', { reason });
});

process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught Exception:', error);
  logger.error('CRITICAL: Uncaught Exception:', error);
  process.exit(1);
});

async function bootstrap() {
  try {
    logger.info('Checking environment configuration...');

    // Validate required environment variables
    const missingVars = [];
    if (!config.telegram.botToken) missingVars.push('TELEGRAM_BOT_TOKEN');
    if (!config.telegram.adminId) missingVars.push('ADMIN_TELEGRAM_ID');
    if (!config.openRouter.apiKey) missingVars.push('OPENROUTER_API_KEY');
    if (!config.mongodb.uri) missingVars.push('MONGODB_URI');

    if (missingVars.length > 0) {
      logger.error(`CRITICAL: Missing environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    // ===== INIT BOT =====
    logger.info('Initializing Telegraf bot...');
    const bot = new Telegraf(config.telegram.botToken);

    // ===== CONNECT DATABASE =====
    logger.info('Connecting to MongoDB...');
    await connectDatabase();
    logger.info('Database connection phase completed.');

    // ===== BOT ERROR HANDLER =====
    bot.catch((err, ctx) => {
      logger.error(`Bot error for update ${ctx?.update?.update_id}:`, err);
      // Try to answer callback queries that errored to prevent "loading" spinner
      if (ctx?.callbackQuery) {
        ctx.answerCbQuery('An error occurred. Please try again.').catch(() => {});
      }
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
    bot.command('kick', isAdmin, AdminController.handleKickUser);
    bot.command('ban', isAdmin, AdminController.handleBanUser);
    bot.command('unban', isAdmin, AdminController.handleUnbanUser);
    bot.command('promote', isAdmin, AdminController.handlePromoteUser);
    bot.command('add_faq', isAdmin, AdminController.handleAddFAQ);
    bot.command('remove_faq', isAdmin, AdminController.handleRemoveFAQ);

    // ===== RESTART COMMAND =====
    bot.command('restart', isAdmin, async (ctx) => {
      await ctx.reply('🔄 *System Reboot Initiated...*\n\nShutting down and restarting bot instance.', { parse_mode: 'Markdown' });
      logger.info('Admin requested manual restart.');
      process.exit(0);
    });

    // ===== CALLBACKS - USER ACTIONS =====
    bot.action('main_menu', DashboardManager.renderMainDashboard);
    bot.action('help_menu', MessageController.handleHelp);
    bot.action('view_products', (ctx) => ProductBrowser.showProductList(ctx, 0));
    bot.action('lang_selection', MessageController.showLanguageSelection);
    bot.action(/^lang_/, MessageController.handleLanguageSelection);
    bot.action('contact_card', MessageController.sendContactCard);
    bot.action('my_profile', DashboardManager.renderProfilePanel);
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

    // ===== QUICK ACTION CALLBACKS =====
    bot.action('play_another', async (ctx) => {
      await ctx.answerCbQuery('Ready for another song! Just say "play [song name]"');
    });

    bot.action('stop_music', async (ctx) => {
      await ctx.answerCbQuery('Music stopped!');
    });

    bot.action('music_playlist', async (ctx) => {
      await ctx.answerCbQuery('Just say "play [song name]" to add to your playlist!');
    });

    bot.action('check_weather', async (ctx) => {
      await ctx.answerCbQuery('Tell me the city name!');
    });

    bot.action('weather_tomorrow', async (ctx) => {
      await ctx.answerCbQuery('Say "tomorrow weather in [city]"');
    });

    bot.action('weather_forecast', async (ctx) => {
      await ctx.answerCbQuery('Say "weather in [city]" for a forecast!');
    });

    bot.action('generate_another', async (ctx) => {
      await ctx.answerCbQuery('Say "generate: [description]" to create another image!');
    });

    bot.action('modify_image', async (ctx) => {
      await ctx.answerCbQuery('Say "generate: [new description]" to create a new image!');
    });

    bot.action('funny_pics', async (ctx) => {
      await ctx.answerCbQuery('Say "generate: funny [description]" for a funny image!');
    });

    bot.action('share_quote', async (ctx) => {
      await ctx.answerCbQuery('Copy the quote above to share it!');
    });

    bot.action('another_joke', async (ctx) => {
      const { getRandomJoke } = await import('./utils/helpers.js');
      const joke = getRandomJoke();
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('😂 Another Joke', 'another_joke')],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ]);
      try {
        await ctx.editMessageText(`😂 ${joke}`, keyboard);
      } catch (e) {
        await ctx.reply(`😂 ${joke}`, keyboard);
      }
      await ctx.answerCbQuery();
    });

    bot.action('another_quote', async (ctx) => {
      const { getQuoteOfTheDay } = await import('./utils/helpers.js');
      const quote = getQuoteOfTheDay();
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('💡 Another Quote', 'another_quote')],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ]);
      try {
        await ctx.editMessageText(`💡 *Quote of the Day:*\n\n"${quote}"`, { parse_mode: 'Markdown', ...keyboard });
      } catch (e) {
        await ctx.reply(`💡 *Quote of the Day:*\n\n"${quote}"`, { parse_mode: 'Markdown', ...keyboard });
      }
      await ctx.answerCbQuery();
    });

    // ===== CONFIRM / CANCEL CALLBACKS =====
    bot.action('confirm_yes', async (ctx) => {
      await ctx.answerCbQuery('Confirmed!');
      await ctx.editMessageText('✅ *Action confirmed.*', { parse_mode: 'Markdown' }).catch(() => {});
    });

    bot.action('confirm_no', async (ctx) => {
      await ctx.answerCbQuery('Cancelled.');
      await ctx.editMessageText('❌ *Action cancelled.*', { parse_mode: 'Markdown' }).catch(() => {});
    });

    // ===== DASHBOARD ACTIONS =====
    bot.action('dash_main', DashboardManager.renderMainDashboard);
    bot.action('dash_templates', DashboardManager.renderTemplatesPanel);
    bot.action('dash_settings', DashboardManager.renderSettingsPanel);
    bot.action('dash_profile', DashboardManager.renderProfilePanel);
    bot.action('dash_group', GroupController.showGroupStats);
    bot.action('dash_help', MessageController.handleHelp);
    bot.action('dash_admin', isAdmin, MessageController.handleAdminMenu);
    bot.action('dash_lang', MessageController.showLanguageSelection);
    bot.action('dash_notif', (ctx) => ctx.answerCbQuery('Notifications toggled!'));
    bot.action('dash_theme', (ctx) => ctx.answerCbQuery('Theme changed!'));
    bot.action('dash_privacy', (ctx) => ctx.answerCbQuery('Privacy settings updated!'));

    // ===== PROFILE ACTIONS =====
    bot.action('dash_rate', async (ctx) => {
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
          ],
          [Markup.button.callback('⬅️ Back', 'dash_profile')]
        ]);
        await ctx.editMessageText('⭐ *How would you rate this bot?*\n\nYour feedback helps us improve!', {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Error in dash_rate callback:', error);
        await ctx.answerCbQuery('Error opening rating');
      }
    });

    bot.action('dash_stats', async (ctx) => {
      try {
        const user = await User.findOne({ telegramId: ctx.from.id });
        const statsMsg = `📊 *YOUR STATISTICS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💬 Messages: ${user?.messageCount || 0}\n🎵 Songs Requested: ${user?.songsRequested || 0}\n⭐ Rating: ${user?.feedbackRating ? `${user.feedbackRating}/5` : 'Not rated yet'}`;
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'dash_profile')]]);
        await ctx.editMessageText(statsMsg, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Error in dash_stats callback:', error);
        await ctx.answerCbQuery('Error loading stats');
      }
    });

    // ===== RATE BOT CALLBACK =====
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
          ],
          [Markup.button.callback('⬅️ Back', 'dash_profile')]
        ]);
        await ctx.editMessageText('⭐ *How would you rate this bot?*\n\nYour feedback helps us improve!', {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Error in rate_bot callback:', error);
        await ctx.answerCbQuery('Error opening rating');
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

          const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'dash_main')]]);
          await ctx.editMessageText(`✅ *Thank you for rating us ${i}/5!*\n\nYour feedback is valuable to us. 😊`, {
            parse_mode: 'Markdown',
            ...keyboard
          });
          await ctx.answerCbQuery('Rating saved!');
          logger.info(`User ${ctx.from.id} rated bot: ${i}/5`);
        } catch (error) {
          logger.error('Error in rating handler:', error);
          await ctx.answerCbQuery('Error saving rating');
        }
      });
    }

    // ===== PRODUCT INFO CALLBACK (legacy product_ prefix) =====
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

    // ===== FAQ CALLBACKS =====
    bot.action('view_faqs', MessageController.handleFAQ);
    bot.action('search_faq', (ctx) => ctx.answerCbQuery('Use /help to find FAQs'));

    // ===== PRODUCT BROWSER CALLBACKS =====
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
      const data = ctx.callbackQuery.data.replace('prod_file_', '');
      const lastUnderscore = data.lastIndexOf('_');
      const productId = data.substring(0, lastUnderscore);
      const fileIndex = parseInt(data.substring(lastUnderscore + 1));
      await ProductBrowser.showFileDetails(ctx, productId, fileIndex);
    });

    // ===== DASHBOARD CATEGORY/TEMPLATE CALLBACKS =====
    bot.action(/^dash_cat_(.+)$/, async (ctx) => {
      const category = ctx.match[1];
      await DashboardManager.renderCategoryPanel(ctx, category);
    });

    bot.action(/^dash_tmpl_nav_(.+)_(\d+)$/, async (ctx) => {
      const category = ctx.match[1];
      const index = parseInt(ctx.match[2]);
      const templates = await Template.getByCategory(category);
      await DashboardManager.renderSingleTemplatePanel(ctx, templates, index, category);
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
    const PORT = parseInt(process.env.PORT) || 8000;
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
    const shutdown = async (signal) => {
      logger.info(`${signal} received, stopping bot...`);
      try {
        await bot.stop(signal);
      } catch (e) {
        // ignore
      }
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 5 seconds if server doesn't close
      setTimeout(() => process.exit(0), 5000);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    // ===== LAUNCH BOT =====
    // Determine launch mode: webhook (preferred for Koyeb) or polling
    const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://your-app.koyeb.app

    if (WEBHOOK_URL) {
      // ===== WEBHOOK MODE (Recommended for Koyeb) =====
      logger.info('Launching bot in WEBHOOK mode...');

      // Delete any existing webhook/polling session first
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });

      const webhookPath = `/webhook/${config.telegram.botToken}`;
      const fullWebhookUrl = `${WEBHOOK_URL}${webhookPath}`;

      // Attach webhook handler to the existing HTTP server
      const webhookCallback = await bot.createWebhook({ domain: WEBHOOK_URL, path: webhookPath });

      // Replace the simple HTTP server with one that handles both health and webhook
      server.removeAllListeners('request');
      server.on('request', (req, res) => {
        if (req.url === webhookPath) {
          webhookCallback(req, res);
        } else if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Bot is running\n');
        }
      });

      logger.info(`🤖 Bot started in WEBHOOK mode!`);
      logger.info(`📡 Webhook URL: ${fullWebhookUrl}`);
    } else {
      // ===== POLLING MODE (Fallback / Local Development) =====
      logger.info('Clearing webhooks...');
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });

      logger.info('Waiting for safety delay...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      logger.info('Launching bot in POLLING mode...');
      await bot.launch({
        polling: {
          allowedUpdates: ['message', 'callback_query', 'chat_member'],
          dropPendingUpdates: true
        }
      });

      logger.info('🤖 Bot started in POLLING mode!');
    }

    logger.info(`📋 Admin ID: ${config.telegram.adminId}`);

  } catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    logger.error('BOOTSTRAP ERROR:', err);
    process.exit(1);
  }
}

bootstrap();
