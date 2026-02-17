import { Markup } from 'telegraf';
import { UserService } from '../services/userService.js';
import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { OpenRouterAI } from '../ai/openrouter.js';
import { logger } from '../utils/logger.js';

const ai = new OpenRouterAI();

export class MessageController {
  static async handleMessage(ctx) {
    try {
      // Only respond in groups
      if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return;
      }

      // Get brand memory to check status
      const brandMemory = await BrandMemory.getMemory();
      
      // If Salman is ONLINE, the bot should NOT respond to anyone
      if (brandMemory.status === 'online') {
        logger.info('Salman is ONLINE. Bot is silent.');
        return;
      }

      const user = await UserService.getOrCreateUser(ctx);
      const message = ctx.message.text;

      // Check if user needs language selection
      if (!user.languageSelected) {
        return MessageController.showLanguageSelection(ctx);
      }

      // Check for spam
      const isSpam = await UserService.checkSpam(user.telegramId, message);
      if (isSpam) {
        logger.warn(`Ignoring spam from user ${user.telegramId}`);
        return;
      }

      // Add message to user history
      await UserService.addUserMessage(user.telegramId, message);

      // Simulate typing delay (human-like behavior)
      await MessageController.simulateTyping(ctx);

      // Get products
      const productsInfo = await Product.getAllFormatted();

      // Generate AI response
      const aiResponse = await ai.generateResponseWithContext(
        message,
        brandMemory.getFormattedMemory(),
        productsInfo,
        user.conversationContext,
        user.language
      );

      // Update user context with summary
      const contextSummary = `${message.slice(0, 100)} -> ${aiResponse.slice(0, 100)}`;
      await UserService.updateUserContext(user.telegramId, contextSummary);

      // Reply to the user's message
      await ctx.reply(aiResponse, {
        reply_to_message_id: ctx.message.message_id
      });

      logger.info(`Response sent to user ${user.telegramId}`);

    } catch (error) {
      logger.error('Error in handleMessage:', error);
    }
  }

  static async showLanguageSelection(ctx) {
    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🇧🇩 Bangla', 'lang_bangla'),
          Markup.button.callback('🇮🇳 Hindi', 'lang_hindi'),
          Markup.button.callback('🇬🇧 English', 'lang_english')
        ]
      ]);

      const text = '💎 *SALMAN DEV PREMIUM ASSISTANT* 💎\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                   'Please select your language to continue:\n\n' +
                   '👋 Swagotom! Apnar bhasha bachai korun\n' +
                   '👋 Swagat hai! Apni bhasha chunein';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } else {
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }
    } catch (error) {
      logger.error('Error in showLanguageSelection:', error);
    }
  }

  static async handleLanguageSelection(ctx) {
    try {
      const userId = ctx.from.id;
      const languageMap = {
        'lang_bangla': 'bangla',
        'lang_hindi': 'hindi',
        'lang_english': 'english'
      };

      const language = languageMap[ctx.callbackQuery.data];
      
      if (!language) {
        return ctx.answerCbQuery('Invalid selection');
      }

      await UserService.setUserLanguage(userId, language);

      const confirmMessages = {
        bangla: '✅ *Bhasha set kora hoyeche:* Bangla\n\nEkhon ami apnake shahajjo korte prostut! 🚀',
        hindi: '✅ *Bhasha set ho gayi hai:* Hindi\n\nAb main aapki madad ke liye taiyaar hoon! 🚀',
        english: '✅ *Language set:* English\n\nI am now ready to assist you! 🚀'
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ]);

      await ctx.editMessageText(confirmMessages[language], {
        parse_mode: 'Markdown',
        ...keyboard
      });

      await ctx.answerCbQuery();
      logger.info(`User ${userId} selected language: ${language}`);

    } catch (error) {
      logger.error('Error in handleLanguageSelection:', error);
      ctx.answerCbQuery('Error setting language');
    }
  }

  static async simulateTyping(ctx) {
    try {
      await ctx.sendChatAction('typing');
      const delay = Math.floor(Math.random() * (2000 - 500 + 1) + 500);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      logger.error('Error in simulateTyping:', error);
    }
  }

  static async handleStart(ctx) {
    const welcomeMessage = `
👑 *SALMAN DEV OFFICIAL AI* 👑
━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to the premium digital assistant for **Salman Dev**. I am here to provide elite support and information.

✨ *Core Capabilities:*
💎 Premium Service Insights
🔥 Exclusive Product Demos
⚡ Instant Business Queries
🛡️ 24/7 Brand Representation

━━━━━━━━━━━━━━━━━━━━━━━━
*Elite support at your fingertips.*
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📦 Products', 'view_products'),
        Markup.button.callback('📖 Help', 'help_menu')
      ],
      [
        Markup.button.callback('🌐 Language', 'lang_selection'),
        Markup.button.callback('🛠 Admin', 'admin_menu')
      ]
    ]);

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'lang_selection') {
        return MessageController.showLanguageSelection(ctx);
      }
      await ctx.editMessageText(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  static async handleHelp(ctx) {
    const helpMessage = `
📖 *PREMIUM USER GUIDE*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *For Clients:*
• Send a message in the group.
• I will reply directly to your thread.
• AI handles queries when Salman is Busy/Away.

🆘 *Direct Access:*
Contact **Salman Dev** for high-priority matters.
━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Back to Menu', 'main_menu')]
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(helpMessage, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(helpMessage, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  static async handleAdminMenu(ctx) {
    const adminMessage = `
🛠 *ADMIN COMMAND CENTER*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 \`/update_memory\` - Brand Intel
📦 \`/add_product\` - New Asset
🚦 \`/status\` - Presence Control
📊 \`/view_memory\` - System Stats
📜 \`/list_products\` - Asset Catalog

━━━━━━━━━━━━━━━━━━━━━━━━
*Select an action or use commands.*
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🚦 Status Control', 'status_menu'),
        Markup.button.callback('📊 System Stats', 'view_memory_cb')
      ],
      [Markup.button.callback('🏠 Back to Menu', 'main_menu')]
    ]);

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'status_menu') {
        // Import dynamically to avoid circular dependency if needed, 
        // but here we can just call the method if we structure it right.
        // For now, let's just show the message.
      }
      await ctx.editMessageText(adminMessage, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(adminMessage, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  static async handleListProducts(ctx) {
    try {
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        const noProductsMsg = '📦 *No assets available.*';
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'main_menu')]]);
        if (ctx.callbackQuery) return ctx.editMessageText(noProductsMsg, { parse_mode: 'Markdown', ...keyboard });
        return ctx.reply(noProductsMsg, { parse_mode: 'Markdown', ...keyboard });
      }

      const message = `📜 *ASSET CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + 
        products.map((p, i) => 
          `${i + 1}. 📦 *${p.name}* - ${p.price}\n` +
          `   📝 ${p.description}\n` +
          `   🆔 ID: \`${p._id}\``
        ).join('\n\n');

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back to Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleListProducts:', error);
    }
  }
}
