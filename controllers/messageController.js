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

      // Get brand memory and products
      const brandMemory = await BrandMemory.getMemory();
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
        '👋 Welcome! Please choose your preferred language:\n' +
        'স্বাগতম! আপনার পছন্দের ভাষা নির্বাচন করুন:\n' +
        'स्वागत है! कृपया अपनी पसंदीदा भाषा चुनें:',
        {
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
        bangla: '✅ ভাষা সেট করা হয়েছে: বাংলা',
        hindi: '✅ भाषा सेट की गई: हिंदी',
        english: '✅ Language set: English'
      };

      // Delete the language selection message
      await ctx.deleteMessage();
      
      // Send confirmation as reply to original message
      await ctx.reply(confirmMessages[language], {
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
      
      // Random delay between min and max
      const delay = Math.floor(
        Math.random() * (3000 - 1000 + 1) + 1000
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      logger.error('Error in simulateTyping:', error);
    }
  }

  static async handleStart(ctx) {
    const welcomeMessage = `
👋 *Welcome to Salman Dev AI Assistant!*

I'm here to help you learn about Salman Dev's services and products.

*How I work:*
• I respond to messages in group chats
• I can communicate in Bangla, Hindi, and English
• I'll help answer your questions about services
• For final confirmations, I'll connect you with Salman Dev

*Admin Commands:*
• \`/update_memory\` - Update brand information
• \`/add_product\` - Add new product
• \`/status\` - Update availability status
• \`/view_memory\` - View current memory
• \`/list_products\` - List all products

Let's get started! 🚀
    `.trim();

    ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  }

  static async handleHelp(ctx) {
    const helpMessage = `
ℹ️ *Help & Information*

*For Users:*
• Simply send a message in the group
• I'll respond to your questions
• Choose your language on first interaction

*For Admin:*
• \`/update_memory [field] [value]\` - Update brand info
• \`/add_product [details]\` - Add product
• \`/status [online|busy|away]\` - Set status
• \`/view_memory\` - View current settings
• \`/list_products\` - View all products

*Need more help?*
Contact Salman Dev directly for assistance.
    `.trim();

    ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  }
}
