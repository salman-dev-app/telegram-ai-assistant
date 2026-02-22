import { Markup } from 'telegraf';
import { UserService } from '../services/userService.js';
import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { CommandStats } from '../database/models/CommandStats.js';
import { GroqAI } from '../ai/groq.js';
import { logger } from '../utils/logger.js';
import {
  UIButtons,
  detectMusicRequest,
  detectWeatherRequest,
  getWeather,
  detectTranslationRequest,
  translateMessage,
  detectImageRequest,
  generateImage,
  detectIntent,
  getWelcomeMessage,
  calculateTypingDelay,
  getRandomJoke,
  createPoll,
  kickUser,
  banUser,
  unbanUser,
  restrictUser,
  promoteModerator,
  getQuoteOfTheDay,
  analyzeSentiment,
  getTimeBasedGreeting,
  getQuickReplies,
  isSpamMessage,
  filterProfanity,
  extractKeywords,
  logActivity
} from '../utils/helpers.js';

const ai = new GroqAI();

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

      if (!message) return;

      // Check if user needs language selection
      if (!user.languageSelected) {
        return MessageController.showLanguageSelection(ctx);
      }

      // ===== AUTO-TRIGGER: MUSIC REQUEST =====
      const songName = detectMusicRequest(message);
      if (songName) {
        await CommandStats.trackCommand('music_request', user.telegramId, 'Music Request');
        await user.addMessage(message);
        user.songsRequested = (user.songsRequested || 0) + 1;
        await user.save();
        
        // Send formatted command to music bot
        const musicMsg = `🎵 *Music Request Detected!*\n\nNow playing: **${songName}**\n\nCommand sent to music bot:\n\`/play ${songName}\``;
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Play Another', 'play_another')],
          [Markup.button.callback('⏹️ Stop', 'stop_music')]
        ]);
        
        return ctx.reply(musicMsg, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: WEATHER REQUEST =====
      const city = detectWeatherRequest(message);
      if (city) {
        await CommandStats.trackCommand('weather_request', user.telegramId, 'Weather Check');
        await user.addMessage(message);
        const weatherApiKey = process.env.WEATHER_API_KEY || null;
        const weatherInfo = await getWeather(city, weatherApiKey);
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Another City', 'check_weather')],
          [Markup.button.callback('📅 Tomorrow', 'weather_tomorrow')]
        ]);
        
        return ctx.reply(weatherInfo, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: TRANSLATION REQUEST =====
      const translationReq = detectTranslationRequest(message);
      if (translationReq) {
        await CommandStats.trackCommand('translation_request', user.telegramId, 'Translation');
        await user.addMessage(message);
        await ctx.sendChatAction('typing');
        const translated = await translateMessage(translationReq.text, translationReq.language);
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Translate Again', 'translate_again')],
          [Markup.button.callback('🏠 Menu', 'main_menu')]
        ]);
        
        return ctx.reply(`🌐 *Translation to ${translationReq.language}:*\n\n${translated}`, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // ===== AUTO-TRIGGER: IMAGE GENERATION =====
      const imagePrompt = detectImageRequest(message);
      if (imagePrompt) {
        await CommandStats.trackCommand('image_generation', user.telegramId, 'Image Generation');
        await user.addMessage(message);
        const imageApiKey = process.env.HUGGING_FACE_API_KEY || null;
        
        if (!imageApiKey) {
          return ctx.reply('🖼️ Image generation API not configured. Please contact admin.', {
            reply_to_message_id: ctx.message.message_id
          });
        }
        
        await ctx.sendChatAction('upload_photo');
        const imageBuffer = await generateImage(imagePrompt, imageApiKey);
        
        if (imageBuffer) {
          return ctx.replyWithPhoto({ source: imageBuffer }, {
            caption: `🖼️ Generated: ${imagePrompt}`,
            reply_to_message_id: ctx.message.message_id
          });
        } else {
          return ctx.reply('❌ Could not generate image. Please try again.', {
            reply_to_message_id: ctx.message.message_id
          });
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

      // Check for spam
      const isSpam = await UserService.checkSpam(user.telegramId, message);
      if (isSpam) {
        logger.warn(`Ignoring spam from user ${user.telegramId}`);
        return;
      }

      // Add message to user history
      await UserService.addUserMessage(user.telegramId, message);

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

      // Reply to the user's message
      await ctx.reply(aiResponse, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
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
          Markup.button.callback('Bangla', 'lang_bangla'),
          Markup.button.callback('Hindi', 'lang_hindi'),
          Markup.button.callback('English', 'lang_english')
        ]
      ]);

      const text = '🌐 *SELECT YOUR LANGUAGE*\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                   'Choose your preferred language:\n\n' +
                   '🇧🇩 Bangla - Bengali in English letters\n' +
                   '🇮🇳 Hindi - Romanized Hindi\n' +
                   '🇬🇧 English - Standard English\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } else {
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...keyboard,
          reply_to_message_id: ctx.message?.message_id
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

      const welcomeMessage = `
👑 *SALMAN DEV AI ASSISTANT* 👑
━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to the premium AI assistant for **Salman Dev**. I provide intelligent support and brand representation.

✨ *What I Can Do:*
💎 Answer product & service queries
🎵 Detect music requests (auto-play)
🌤️ Check weather (auto-detect city)
🌐 Translate messages (auto-translate)
🖼️ Generate images (auto-create)
😂 Tell jokes & quotes
📊 Group management
⭐ User feedback & ratings
❓ FAQ & help
🛡️ 24/7 Support

━━━━━━━━━━━━━━━━━━━━━━━━
*Choose an option below to get started.*
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📦 Products', 'view_products'),
          Markup.button.callback('📖 Help', 'help_menu')
        ],
        [
          Markup.button.callback('🌐 Language', 'lang_selection'),
          Markup.button.callback('👤 Profile', 'my_profile')
        ],
        [
          Markup.button.callback('❓ FAQ', 'faq_menu'),
          Markup.button.callback('🛠 Admin', 'admin_menu')
        ],
        [
          Markup.button.url('💬 Contact', 'https://t.me/Otakuosenpai')
        ]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
      }
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
🌐 *Translate:* Just say "translate to [language]: [text]"
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
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        const noProductsMsg = '📦 No products available at the moment.';
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Dashboard', 'main_menu')]]);
        if (ctx.callbackQuery) {
          await ctx.editMessageText(noProductsMsg, { parse_mode: 'Markdown', ...keyboard });
          return ctx.answerCbQuery();
        }
        return ctx.reply(noProductsMsg, { parse_mode: 'Markdown', ...keyboard });
      }

      // Send each product as a separate FULLY INTERACTIVE card with inline buttons
      for (const product of products) {
        const productMsg = `
📦 *${product.name}*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 ${product.description}

💰 *Price:* ${product.price}

${product.features.length > 0 ? `✨ *Features:*\n${product.features.map(f => `• ${f}`).join('\n')}\n` : ''}

🆔 ID: \`${product._id}\`
        `.trim();

        const productButtons = [
          [
            Markup.button.url('🔗 View Demo', product.demoUrl || 'https://t.me/Otakuosenpai'),
            Markup.button.url('🛒 Buy Now', product.contactUrl || 'https://t.me/Otakuosenpai')
          ]
        ];

        productButtons.push([Markup.button.callback('ℹ️ More Info', `product_${product._id}`)]);

        const keyboard = Markup.inlineKeyboard(productButtons);

        await ctx.reply(productMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        });

        // Track product view
        product.viewCount = (product.viewCount || 0) + 1;
        await product.save();
      }

      const backKeyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Back', 'main_menu')]]);
      await ctx.reply('━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ End of products list.', { ...backKeyboard });

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
