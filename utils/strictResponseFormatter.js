import { Markup } from 'telegraf';
import { logger } from './logger.js';

/**
 * STRICT RESPONSE FORMATTER
 * 
 * RULE: EVERY response MUST have inline buttons
 * NO plain text responses allowed
 * NO links in text - use buttons instead
 */
export class StrictResponseFormatter {
  // ===== ENFORCE INLINE BUTTONS ON ALL RESPONSES =====
  static formatResponse(text, intent = 'general', options = {}) {
    // Remove any URLs from text (they should be in buttons)
    let cleanText = text.replace(/https?:\/\/[^\s]+/g, '[Link]');

    // Ensure text is not empty
    if (!cleanText || cleanText.trim().length === 0) {
      cleanText = 'Response received.';
    }

    // Get buttons for this intent
    const buttons = this.getButtonsForIntent(intent, options);

    return {
      text: cleanText,
      keyboard: buttons
    };
  }

  // ===== GET BUTTONS BASED ON INTENT =====
  static getButtonsForIntent(intent, options = {}) {
    const buttonSets = {
      // ===== PRODUCT RESPONSES =====
      product_list: [
        [
          Markup.button.callback('📦 Browse Products', 'prod_list_0'),
          Markup.button.callback('🔍 Search', 'search_products')
        ],
        [
          Markup.button.callback('⭐ Top Rated', 'top_products'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ],

      product_selected: [
        [
          Markup.button.url('🔗 Demo', options.demoUrl || 'https://t.me/Otakuosenpai'),
          Markup.button.url('🛒 Buy Now', options.contactUrl || 'https://t.me/Otakuosenpai')
        ],
        [
          Markup.button.callback('📝 Full Description', `prod_desc_${options.productId}`),
          Markup.button.callback('📋 Files', `prod_files_${options.productId}`)
        ],
        [
          Markup.button.callback('⬅️ Back to List', 'prod_list_0'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ],

      // ===== MUSIC RESPONSES =====
      music: [
        [
          Markup.button.callback('🔄 Play Another', 'play_another'),
          Markup.button.callback('⏹️ Stop', 'stop_music')
        ],
        [
          Markup.button.callback('🎵 Playlist', 'music_playlist'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ],

      // ===== WEATHER RESPONSES =====
      weather: [
        [
          Markup.button.callback('🔄 Another City', 'check_weather'),
          Markup.button.callback('📅 Tomorrow', 'weather_tomorrow')
        ],
        [
          Markup.button.callback('📊 Forecast', 'weather_forecast'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ],

      // ===== TRANSLATION RESPONSES =====
      translate: [
        [
          Markup.button.callback('🔄 Translate Again', 'translate_again'),
          Markup.button.callback('🌐 Change Language', 'dash_lang')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ],

      // ===== IMAGE GENERATION RESPONSES =====
      image: [
        [
          Markup.button.callback('🔄 Generate Another', 'generate_another'),
          Markup.button.callback('🎨 Modify', 'modify_image')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ],

      // ===== JOKE RESPONSES =====
      joke: [
        [
          Markup.button.callback('😂 Another Joke', 'another_joke'),
          Markup.button.callback('😄 Funny Pics', 'funny_pics')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ],

      // ===== QUOTE RESPONSES =====
      quote: [
        [
          Markup.button.callback('💡 Another Quote', 'another_quote'),
          Markup.button.callback('✍️ Share', 'share_quote')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
   === CONTACT RESPONSES =====
      contact: [
        [
          Markup.button.url('💬 Telegram', 'https://t.me/Otakuosenpai'),
          Markup.button.url('🐙 GitHub', 'https://github.com/salman-dev-app')
        ],
        [
          Markup.button.url('📧 Email', 'mailto:mdsalmanhelp0@gmail.com'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ],

      // ===== FAQ RESPONSES =====
      faq: [
        [
          Markup.button.callback('📋 View All FAQs', 'view_faqs'),
          Markup.button.callback('🔍 Search FAQ', 'search_faq')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ],

      // ===== ERROR RESPONSES =====
      error: [
        [
          Markup.button.callback('🔄 Try Again', 'retry_action'),
          Markup.button.callback('📞 Support', 'contact_support')
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ],

      // ===== CONFIRMATION RESPONSES =====
      confirm: [
        [
          Markup.button.callback('✅ Yes', options.confirmCallback || 'confirm_yes'),
          Markup.button.callback('❌ No', options.cancelCallback || 'confirm_no')
        ]
      ],

      // ===== RATING RESPONSES =====
      rating: [
        [
          Markup.button.callback('⭐ 1', 'rate_1'),
          Markup.button.callback('⭐⭐ 2', 'rate_2'),
          Markup.button.callback('⭐⭐⭐ 3', 'rate_3')
        ],
        [
          Markup.button.callback('⭐⭐⭐⭐ 4', 'rate_4'),
          Markup.button.callback('⭐⭐⭐⭐⭐ 5', 'rate_5')
        ]
      ],

      // ===== DEFAULT RESPONSES =====
      general: [
        [
          Markup.button.callback('📦 Products', 'prod_list_0'),
          Markup.button.callback('❓ Help', 'dash_help')
        ],
        [
          Markup.button.callback('👤 Profile', 'dash_profile'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ]
    };

    return Markup.inlineKeyboard(buttonSets[intent] || buttonSets.general);
  }

  // ===== FORMAT PRODUCT RESPONSE =====
  static formatProductResponse(product) {
    const text = `
📦 *${product.name}*
━━━━━━━━━━━━━━━━━━━━━━━━

💰 *Price:* ${product.price}

📝 *Description:*
${product.description}

✨ *Features:*
${product.features.map(f => `• ${f}`).join('\n')}

👁️ *Views:* ${product.viewCount || 0}
    `.trim();

    const keyboard = this.getButtonsForIntent('product_selected', {
      productId: product._id,
      demoUrl: product.demoUrl,
      contactUrl: product.contactUrl
    });

    return { text, keyboard };
  }

  // ===== FORMAT MUSIC RESPONSE =====
  static formatMusicResponse(songName) {
    const text = `
🎵 *Music Request Detected!*

Now playing: *${songName}*

Command sent to music bot:
\`/play ${songName}\`
    `.trim();

    const keyboard = this.getButtonsForIntent('music');

    return { text, keyboard };
  }

  // ===== FORMAT WEATHER RESPONSE =====
  static formatWeatherResponse(weatherData) {
    const text = `
🌤️ *Weather Information*
━━━━━━━━━━━━━━━━━━━━━━━━

${weatherData}
    `.trim();

    const keyboard = this.getButtonsForIntent('weather');

    return { text, keyboard };
  }

  // ===== FORMAT TRANSLATION RESPONSE =====
  static formatTranslationResponse(originalText, translatedText, targetLanguage) {
    const text = `
🌐 *Translation to ${targetLanguage}*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Original:*
${originalText}

🔤 *Translated:*
${translatedText}
    `.trim();

    const keyboard = this.getButtonsForIntent('translate');

    return { text, keyboard };
  }

  // ===== FORMAT IMAGE RESPONSE =====
  static formatImageResponse(prompt) {
    const text = `
🖼️ *Image Generated*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Prompt:* ${prompt}

Image is being generated...
    `.trim();

    const keyboard = this.getButtonsForIntent('image');

    return { text, keyboard };
  }

  // ===== FORMAT JOKE RESPONSE =====
  static formatJokeResponse(joke) {
    const text = `
😂 *Random Joke*
━━━━━━━━━━━━━━━━━━━━━━━━

${joke}
    `.trim();

    const keyboard = this.getButtonsForIntent('joke');

    return { text, keyboard };
  }

  // ===== FORMAT QUOTE RESPONSE =====
  static formatQuoteResponse(quote) {
    const text = `
💡 *Quote of the Day*
━━━━━━━━━━━━━━━━━━━━━━━━

"${quote}"
    `.trim();

    const keyboard = this.getButtonsForIntent('quote');

    return { text, keyboard };
  }

  // ===== FORMAT VOICE RESPONSE =====
  static formatVoiceResponse() {
    const text = `
🎤 *Voice Message Sent*
━━━━━━━━━━━━━━━━━━━━━━━━

Listen to your response above!
    `.trim();

    const keyboard = this.getButtonsForIntent('voice');

    return { text, keyboard };
  }

  // ===== FORMAT AI CHAT RESPONSE =====
  static formatChatResponse(aiResponse) {
    // Detect intent from response
    let intent = 'general';

    if (aiResponse.toLowerCase().includes('template') || aiResponse.toLowerCase().includes('product')) {
      intent = 'product_list';
    } else if (aiResponse.toLowerCase().includes('contact') || aiResponse.toLowerCase().includes('reach')) {
      intent = 'contact';
    } else if (aiResponse.toLowerCase().includes('help') || aiResponse.toLowerCase().includes('guide')) {
      intent = 'faq';
    }

    const text = `
💬 *Response*
━━━━━━━━━━━━━━━━━━━━━━━━

${aiResponse}
    `.trim();

    const keyboard = this.getButtonsForIntent(intent);

    return { text, keyboard };
  }

  // ===== FORMAT ERROR RESPONSE =====
  static formatErrorResponse(errorMessage) {
    const text = `
❌ *Error*
━━━━━━━━━━━━━━━━━━━━━━━━

${errorMessage}

Please try again or contact support.
    `.trim();

    const keyboard = this.getButtonsForIntent('error');

    return { text, keyboard };
  }

  // ===== FORMAT CONFIRMATION RESPONSE =====
  static formatConfirmationResponse(message, confirmCallback = 'confirm_yes', cancelCallback = 'confirm_no') {
    const text = `
⚠️ *Confirmation*
━━━━━━━━━━━━━━━━━━━━━━━━

${message}
    `.trim();

    const keyboard = this.getButtonsForIntent('confirm', {
      confirmCallback,
      cancelCallback
    });

    return { text, keyboard };
  }

  // ===== FORMAT RATING RESPONSE =====
  static formatRatingResponse(message) {
    const text = `
⭐ *Rate This*
━━━━━━━━━━━━━━━━━━━━━━━━

${message}
    `.trim();

    const keyboard = this.getButtonsForIntent('rating');

    return { text, keyboard };
  }

  // ===== ENSURE NO PLAIN TEXT ESCAPES =====
  static validateResponse(text, keyboard) {
    // Check if text is empty
    if (!text || text.trim().length === 0) {
      logger.warn('⚠️ Empty response text detected');
      return false;
    }

    // Check if keyboard is provided
    if (!keyboard) {
      logger.warn('⚠️ Response missing inline buttons');
      return false;
    }

    logger.info('✅ Response validated: has text and buttons');
    return true;
  }
}
