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
      // Fail silently to avoid exposing errors to users
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

      await ctx.reply(
        '💎 *SALMAN DEV PREMIUM ASSISTANT* 💎\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Please select your language to continue:\n\n' +
        '👋 Swagotom! Apnar bhasha bachai korun\n' +
        '👋 Swagat hai! Apni bhasha chunein',
        {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        }
      );
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

      // Delete the language selection message
      await ctx.deleteMessage();
      
      // Send confirmation as reply to original message
      await ctx.reply(confirmMessages[language], {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.callbackQuery.message.reply_to_message.message_id
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
      
      // Faster typing delay for better UX
      const delay = Math.floor(
        Math.random() * (2000 - 500 + 1) + 500
      );
      
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

🛠 *Admin Command Center:*
📝 \`/update_memory\` - Brand Intel
📦 \`/add_product\` - New Asset
🚦 \`/status\` - Presence Control
📊 \`/view_memory\` - System Stats
📜 \`/list_products\` - Asset Catalog

━━━━━━━━━━━━━━━━━━━━━━━━
*Elite support at your fingertips.*
    `.trim();

    ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  }

  static async handleHelp(ctx) {
    const helpMessage = `
📖 *PREMIUM USER GUIDE*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *For Clients:*
• Send a message in the group.
• I will reply directly to your thread.
• AI handles queries when Salman is Busy/Away.

🔑 *For Admin:*
• \`/update_memory [field] [value]\`
• \`/add_product [name] | [desc] | [price] | [features] | [demo]\`
• \`/status [online|busy|away]\`
• \`/view_memory\`
• \`/list_products\`

🆘 *Direct Access:*
Contact **Salman Dev** for high-priority matters.
━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  }
}
