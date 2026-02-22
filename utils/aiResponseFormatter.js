import { Markup } from 'telegraf';

export class AIResponseFormatter {
  /**
   * Format AI response with inline buttons
   * NEVER send plain text - always include buttons
   */
  static formatResponse(response, intent = 'general') {
    const formatted = {
      text: response,
      buttons: this.getButtonsForIntent(intent)
    };

    return formatted;
  }

  /**
   * Get appropriate buttons based on user intent
   */
  static getButtonsForIntent(intent) {
    const buttonSets = {
      music: [
        [
          Markup.button.callback('🔄 Play Another', 'play_another'),
          Markup.button.callback('⏹️ Stop', 'stop_music')
        ],
        [
          Markup.button.callback('🎵 Playlist', 'music_playlist'),
          Markup.button.callback('🏠 Menu', 'dash_main')
        ]
      ],

      weather: [
        [
          Markup.button.callback('🔄 Another City', 'check_weather'),
          Markup.button.callback('📅 Tomorrow', 'weather_tomorrow')
        ],
        [
          Markup.button.callback('📊 Forecast', 'weather_forecast'),
          Markup.button.callback('🏠 Menu', 'dash_main')
        ]
      ],



      image: [
        [
          Markup.button.callback('🔄 Generate Another', 'generate_another'),
          Markup.button.callback('🎨 Modify', 'modify_image')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      joke: [
        [
          Markup.button.callback('😂 Another Joke', 'another_joke'),
          Markup.button.callback('😄 Funny Pics', 'funny_pics')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      quote: [
        [
          Markup.button.callback('💡 Another Quote', 'another_quote'),
          Markup.button.callback('✍️ Share', 'share_quote')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      products: [
        [
          Markup.button.callback('📦 Browse All', 'dash_templates'),
          Markup.button.callback('🔍 Search', 'search_products')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      contact: [
        [
          Markup.button.url('💬 Telegram', 'https://t.me/Otakuosenpai'),
          Markup.button.url('🐙 GitHub', 'https://github.com/salman-dev-app')
        ],
        [
          Markup.button.url('📧 Email', 'mailto:mdsalmanhelp0@gmail.com'),
          Markup.button.callback('🏠 Menu', 'dash_main')
        ]
      ],

      faq: [
        [
          Markup.button.callback('📋 View All FAQs', 'view_faqs'),
          Markup.button.callback('🔍 Search FAQ', 'search_faq')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      profile: [
        [
          Markup.button.callback('⭐ Rate Bot', 'dash_rate'),
          Markup.button.callback('📊 Stats', 'dash_stats')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      error: [
        [
          Markup.button.callback('🔄 Try Again', 'retry_action'),
          Markup.button.callback('📞 Support', 'contact_support')
        ],
        [Markup.button.callback('🏠 Menu', 'dash_main')]
      ],

      general: [
        [
          Markup.button.callback('📦 Templates', 'dash_templates'),
          Markup.button.callback('❓ Help', 'dash_help')
        ],
        [
          Markup.button.callback('👤 Profile', 'dash_profile'),
          Markup.button.callback('🏠 Menu', 'dash_main')
        ]
      ]
    };

    return Markup.inlineKeyboard(buttonSets[intent] || buttonSets.general);
  }

  /**
   * Format product response with buttons
   */
  static formatProductResponse(product) {
    const text = `
📦 *${product.name}*
━━━━━━━━━━━━━━━━━━━━━━━━

💰 *Price:* ${product.price}

📝 *Description:*
${product.description}

✨ *Features:*
${product.features.map(f => `• ${f}`).join('\n')}

👁️ *Views:* ${product.viewCount}
    `.trim();

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.url('🔗 Demo', product.demoUrl || 'https://t.me/Otakuosenpai'),
        Markup.button.url('🛒 Buy Now', product.contactUrl || 'https://t.me/Otakuosenpai')
      ],
      [
        Markup.button.callback('❓ More Info', `product_info_${product._id}`),
        Markup.button.callback('🏠 Menu', 'dash_main')
      ]
    ]);

    return { text, keyboard: buttons };
  }

  /**
   * Format weather response with buttons
   */
  static formatWeatherResponse(weatherData) {
    const text = `
🌤️ *Weather Information*
━━━━━━━━━━━━━━━━━━━━━━━━

${weatherData}
    `.trim();

    const buttons = this.getButtonsForIntent('weather');

    return { text, keyboard: buttons };
  }



  /**
   * Format image response with buttons
   */
  static formatImageResponse(prompt) {
    const text = `
🖼️ *Image Generated*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Prompt:* ${prompt}

Image is being generated...
    `.trim();

    const buttons = this.getButtonsForIntent('image');

    return { text, keyboard: buttons };
  }

  /**
   * Format joke response with buttons
   */
  static formatJokeResponse(joke) {
    const text = `
😂 *Random Joke*
━━━━━━━━━━━━━━━━━━━━━━━━

${joke}
    `.trim();

    const buttons = this.getButtonsForIntent('joke');

    return { text, keyboard: buttons };
  }

  /**
   * Format quote response with buttons
   */
  static formatQuoteResponse(quote) {
    const text = `
💡 *Quote of the Day*
━━━━━━━━━━━━━━━━━━━━━━━━

"${quote}"
    `.trim();

    const buttons = this.getButtonsForIntent('quote');

    return { text, keyboard: buttons };
  }

  /**
   * Format AI chat response with buttons
   */
  static formatChatResponse(aiResponse) {
    // Detect intent from response
    let intent = 'general';

    if (aiResponse.toLowerCase().includes('template') || aiResponse.toLowerCase().includes('product')) {
      intent = 'products';
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

    const buttons = this.getButtonsForIntent(intent);

    return { text, keyboard: buttons };
  }

  /**
   * Format error response with buttons
   */
  static formatErrorResponse(errorMessage) {
    const text = `
❌ *Error*
━━━━━━━━━━━━━━━━━━━━━━━━

${errorMessage}

Please try again or contact support.
    `.trim();

    const buttons = this.getButtonsForIntent('error');

    return { text, keyboard: buttons };
  }

  /**
   * Format confirmation response with buttons
   */
  static formatConfirmationResponse(message, confirmCallback, cancelCallback) {
    const text = `
⚠️ *Confirmation*
━━━━━━━━━━━━━━━━━━━━━━━━

${message}
    `.trim();

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm', confirmCallback),
        Markup.button.callback('❌ Cancel', cancelCallback)
      ]
    ]);

    return { text, keyboard: buttons };
  }

  /**
   * Format rating response with buttons
   */
  static formatRatingResponse(message) {
    const text = `
⭐ *Rate This*
━━━━━━━━━━━━━━━━━━━━━━━━

${message}
    `.trim();

    const buttons = Markup.inlineKeyboard([
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

    return { text, keyboard: buttons };
  }

  /**
   * Format list response with buttons (ONE item at a time)
   */
  static formatListResponse(items, currentIndex, totalItems, itemFormatter) {
    const item = items[currentIndex];
    const text = itemFormatter(item);

    const buttons = [];

    // Navigation buttons
    if (totalItems > 1) {
      const navButtons = [];
      if (currentIndex > 0) {
        navButtons.push(Markup.button.callback('⬅️ Prev', `list_nav_prev`));
      }
      navButtons.push(Markup.button.callback('🏠 Home', 'dash_main'));
      if (currentIndex < totalItems - 1) {
        navButtons.push(Markup.button.callback('Next ➡️', `list_nav_next`));
      }
      buttons.push(navButtons);
    } else {
      buttons.push([Markup.button.callback('🏠 Home', 'dash_main')]);
    }

    const keyboard = Markup.inlineKeyboard(buttons);

    return { text, keyboard, currentIndex, totalItems };
  }
}
