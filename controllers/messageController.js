import { config } from '../config/index.js';
import { UserService } from '../services/userService.js';
import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { CommandStats } from '../database/models/CommandStats.js';
import { GroqAI } from '../ai/groq.js';
import { logger } from '../utils/logger.js';
import {
  detectMusicRequest,
  detectWeatherRequest,
  getWeather,
  detectImageRequest,
  generateImage,
  calculateTypingDelay,
  getRandomJoke,
  getQuoteOfTheDay
} from '../utils/helpers.js';
import { DashboardManager } from '../utils/dashboardManager.js';
import { StrictResponseFormatter } from '../utils/strictResponseFormatter.js';
import { ProductBrowser } from '../utils/productBrowser.js';
import { Markup } from 'telegraf';


const ai = new GroqAI();

export class MessageController {
  static async handleMessage(ctx) {
    try {
      if (!ctx.message || !ctx.chat) return;
      
      const message = ctx.message.text;
      if (!message) return;

      // Get user or create new one
      const user = await UserService.getOrCreateUser(ctx);

      // Handle private chats differently
      if (ctx.chat.type === 'private') {
        // If it's a command, let the command handlers handle it
        if (message.startsWith('/')) return;
        
        // If language not selected, show language selection
        if (!user.languageSelected) {
          return MessageController.showLanguageSelection(ctx);
        }
        
        // Otherwise, show the dashboard
        return MessageController.handleStart(ctx);
      }

      // Check if user needs language selection (even in groups)
      if (!user.languageSelected) {
        // Only show language selection if the message is directed at the bot or is a question
        const isDirected = await ai.shouldRespond(message, ctx.botInfo.username);
        if (isDirected) {
          return MessageController.showLanguageSelection(ctx);
        }
        return; // Don't block group chat with language selection
      }

      // Get brand memory to check status
      const brandMemory = await BrandMemory.getMemory();
      
      // If Salman is ONLINE, the bot should NOT respond to anyone
      if (brandMemory && brandMemory.status === 'online') {
        logger.info('Salman is ONLINE. Bot is silent.');
        return;
      }

      // ===== AUTO-TRIGGER: MUSIC REQUEST =====
      const songName = detectMusicRequest(message);
      if (songName) {
        await CommandStats.trackCommand('music_request', user.telegramId, 'Music Request');
        await user.addMessage(message);
        
        const formatted = StrictResponseFormatter.formatMusicResponse(songName);
        return ctx.reply(formatted.text, {
          parse_mode: 'Markdown',
          ...formatted.keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: WEATHER REQUEST =====
      const city = detectWeatherRequest(message);
      if (city) {
        await CommandStats.trackCommand('weather_request', user.telegramId, 'Weather');
        await user.addMessage(message);
        const weatherData = await getWeather(city, config.weather.apiKey);
        
        const formatted = StrictResponseFormatter.formatWeatherResponse(weatherData);
        return ctx.reply(formatted.text, {
          parse_mode: 'Markdown',
          ...formatted.keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: IMAGE GENERATION =====
      const prompt = detectImageRequest(message);
      if (prompt) {
        await CommandStats.trackCommand('image_request', user.telegramId, 'Image Gen');
        await user.addMessage(message);
        
        const formatted = StrictResponseFormatter.formatImageResponse(prompt);
        await ctx.reply(formatted.text, {
          parse_mode: 'Markdown',
          ...formatted.keyboard,
          reply_to_message_id: ctx.message.message_id
        });

        const imageBuffer = await generateImage(prompt, config.imageGeneration);
        if (imageBuffer) {
          return ctx.replyWithPhoto({ source: imageBuffer }, {
            caption: `✅ *Generated:* ${prompt}`,
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id
          });
        } else {
          return ctx.reply('❌ Failed to generate image. Please try again.');
        }
      }

      // ===== AUTO-TRIGGER: JOKE REQUEST =====
      if (/joke|funny|laugh|haha|lol/.test(message.toLowerCase())) {
        await CommandStats.trackCommand('joke_request', user.telegramId, 'Joke');
        await user.addMessage(message);
        const joke = getRandomJoke();
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('😂 Another Joke', 'another_joke')],
          [Markup.button.callback('🏠 Menu', 'main_menu')]
        ]);
        
        return ctx.reply(`😂 ${joke}`, {
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: QUOTE REQUEST =====
      if (/quote|inspiration|motivat|wisdom/.test(message.toLowerCase())) {
        await CommandStats.trackCommand('quote_request', user.telegramId, 'Quote');
        await user.addMessage(message);
        const quote = getQuoteOfTheDay();
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('💡 Another Quote', 'another_quote')],
          [Markup.button.callback('🏠 Menu', 'main_menu')]
        ]);
        
        return ctx.reply(`💡 *Quote of the Day:*\n\n"${quote}"`, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // Check for contact/portfolio/links request
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('contact') || lowerMsg.includes('portfolio') || lowerMsg.includes('link') || lowerMsg.includes('github') || lowerMsg.includes('whatsapp') || lowerMsg.includes('email') || lowerMsg.includes('salman dev')) {
        await CommandStats.trackCommand('contact_request', user.telegramId, 'Contact Request');
        return MessageController.sendContactCard(ctx);
      }

      // SPAM CHECK REMOVED AS PER USER REQUEST
      // We still log for internal metrics but don't block or send messages
      const isSpam = await UserService.checkSpam(user.telegramId, message);
      if (isSpam) {
        logger.info(`Spam detected from user ${user.telegramId} (ignoring block)`);
      }

      // Add message to user history
      await UserService.addUserMessage(user.telegramId, message);

      // Only respond if directed at bot or in private chat
      const shouldRespond = await ai.shouldRespond(message, ctx.botInfo.username);
      if (!shouldRespond && ctx.chat.type !== 'private') return;

      // Simulate typing delay
      const typingDelay = calculateTypingDelay(message.length);
      await ctx.sendChatAction('typing');
      await new Promise(resolve => setTimeout(resolve, typingDelay));

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

      // Update user context
      const contextSummary = `${message.slice(0, 100)} -> ${aiResponse.slice(0, 100)}`;
      await UserService.updateUserContext(user.telegramId, contextSummary);

      // Track general interaction
      await CommandStats.trackCommand('general_message', user.telegramId, 'General Message');

      // ===== STRICT FORMATTER: ENSURE ALL RESPONSES HAVE BUTTONS =====
      const formatted = StrictResponseFormatter.formatChatResponse(aiResponse);
      
      await ctx.reply(formatted.text, {
        parse_mode: 'Markdown',
        ...formatted.keyboard,
        reply_to_message_id: ctx.message.message_id
      }).catch(async (err) => {
        logger.error('Error sending AI response (Markdown), trying plain text:', err);
        await ctx.reply(formatted.text, {
          ...formatted.keyboard,
          reply_to_message_id: ctx.message.message_id
        }).catch(e => logger.error('Final fallback failed:', e));
      });

      logger.info(`Response sent to user ${user.telegramId}`);

    } catch (error) {
      logger.error('Error in handleMessage:', error);
    }
  }

  static async sendContactCard(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      
      const buttons = [
        [Markup.button.url('💬 Telegram', memory.socialLinks.telegram)]
      ];
      
      if (memory.socialLinks.github) {
        buttons.push([Markup.button.url('🐙 GitHub', memory.socialLinks.github)]);
      }
      if (memory.socialLinks.whatsapp) {
        buttons.push([Markup.button.url('💬 WhatsApp', memory.socialLinks.whatsapp)]);
      }
      if (memory.socialLinks.email) {
        buttons.push([Markup.button.url('📧 Email', `mailto:${memory.socialLinks.email}`)]);
      }
      if (memory.socialLinks.portfolio) {
        buttons.push([Markup.button.url('🌐 Portfolio', memory.socialLinks.portfolio)]);
      }

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.reply(
        "📞 *Connect with Salman Dev:*\n\nChoose your preferred contact method:",
        {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message?.message_id
        }
      );
    } catch (error) {
      logger.error('Error in sendContactCard:', error);
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

      const text = '🌐 *SELECT YOUR LANGUAGE*\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                   'Choose your preferred language:\n\n' +
                   '🇧🇩 Bangla - Romanized Bengali\n' +
                   '🇮🇳 Hindi - Romanized Hindi\n' +
                   '🇬🇧 English - Standard English\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard }).catch(() => {});
      } else {
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message?.message_id
        }).catch(() => {});
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
      await CommandStats.trackCommand('language_selection', userId, `Language: ${language}`);

      const confirmMessages = {
        bangla: '✅ Language set to: Bangla\n\nEkhon ami apnake sahajjo korte prostut! 🚀',
        hindi: '✅ Language set to: Hindi\n\nAb main aapki madad ke liye taiyaar hoon! 🚀',
        english: '✅ Language set to: English\n\nI am now ready to assist you! 🚀'
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Dashboard', 'main_menu')]
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

  static async handleStart(ctx) {
    try {
      await CommandStats.trackCommand('start_command', ctx.from.id, 'Start Command');
      await DashboardManager.renderMainDashboard(ctx);
    } catch (error) {
      logger.error('Error in handleStart:', error);
    }
  }

  static async handleHelp(ctx) {
    try {
      await CommandStats.trackCommand('help_command', ctx.from.id, 'Help Command');

      const helpMessage = `
📖 *USER GUIDE*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *For Everyone:*
• Send a message in the group
• I'll reply directly to your message
• Ask about products, services, or anything else

🎵 *Music:* Just say "play [song name]"
🌤️ *Weather:* Just ask "weather in [city]"

🖼️ *Images:* Just say "generate: [description]"
😂 *Jokes:* Just ask "tell me a joke"
💡 *Quotes:* Just ask for "inspiration"

📞 *Contact:* Ask for "contact" or "portfolio"

🆘 *Direct Access:*
Contact **Salman Dev** for urgent matters.
━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(helpMessage, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(helpMessage, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleHelp:', error);
    }
  }

  static async handleAdminMenu(ctx) {
    try {
      const adminMessage = `
🛠 *ADMIN COMMAND CENTER*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 \`/update_memory\` - Update brand info
📦 \`/add_product\` - Add new product
🗑 \`/remove_product\` - Delete product
🚦 \`/status\` - Set online/busy/away
📊 \`/view_memory\` - System stats
📜 \`/list_products\` - View all products
📢 \`/broadcast\` - Send to all users
🛡️ \`/backup\` - Download backup
🔄 \`/restart\` - Restart bot
📈 \`/stats\` - Command statistics

👥 *Group Management:*
\`/kick @user\` - Remove user
\`/ban @user\` - Ban user
\`/unban @user\` - Unban user
\`/promote @user\` - Make moderator

❓ *FAQ Management:*
\`/add_faq [question] | [answer]\`
\`/remove_faq [index]\`

━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🚦 Status', 'status_menu'),
          Markup.button.callback('📊 Stats', 'view_memory_cb')
        ],
        [
          Markup.button.callback('📈 Commands', 'command_stats')
        ],
        [
          Markup.button.callback('🔄 Restart', 'restart_bot')
        ],
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(adminMessage, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(adminMessage, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleAdminMenu:', error);
    }
  }

  static async handleListProducts(ctx) {
    try {
      await CommandStats.trackCommand('view_products', ctx.from.id, 'View Products');
      // Use ProductBrowser instead of DashboardManager
      await ProductBrowser.showProductList(ctx, 0);
    } catch (error) {
      logger.error('Error in handleListProducts:', error);
    }
  }

  static async handleMyProfile(ctx) {
    try {
      const user = await UserService.getOrCreateUser(ctx);
      
      const joinedDate = new Date(user.joinedAt).toLocaleDateString();
      const interactionDays = Math.floor((Date.now() - user.joinedAt) / (1000 * 60 * 60 * 24));

      const profileMsg = `
👤 *YOUR PROFILE*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${user.firstName || 'Unknown'} ${user.lastName || ''}
🆔 *ID:* \`${user.telegramId}\`
🌐 *Language:* ${user.language || 'Not set'}

📊 *Statistics:*
💬 Messages: ${user.messageCount}
🎵 Songs Requested: ${user.songsRequested || 0}
📅 Joined: ${joinedDate}
⏱️ Active for: ${interactionDays} days

${user.feedbackRating ? `⭐ Your Rating: ${user.feedbackRating}/5` : '⭐ No rating yet'}

━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Rate Bot', 'rate_bot')],
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(profileMsg, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(profileMsg, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleMyProfile:', error);
    }
  }

  static async handleFAQ(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      
      if (!memory.faqs || memory.faqs.length === 0) {
        const noFaqMsg = '❓ No FAQs available yet.';
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Back', 'main_menu')]]);
        if (ctx.callbackQuery) {
          await ctx.editMessageText(noFaqMsg, { parse_mode: 'Markdown', ...keyboard });
          return ctx.answerCbQuery();
        }
        return ctx.reply(noFaqMsg, { parse_mode: 'Markdown', ...keyboard });
      }

      let faqText = '❓ *FREQUENTLY ASKED QUESTIONS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      for (let i = 0; i < memory.faqs.length; i++) {
        faqText += `*${i + 1}. ${memory.faqs[i].question}*\n${memory.faqs[i].answer}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Back', 'main_menu')]]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(faqText, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(faqText, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleFAQ:', error);
    }
  }
}
