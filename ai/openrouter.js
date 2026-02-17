import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class OpenRouterAI {
  constructor() {
    this.apiKey = config.openRouter.apiKey;
    this.baseUrl = config.openRouter.baseUrl;
    // Using confirmed working free models from OpenRouter
    this.models = [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/pixtral-12b:free'
    ];
  }

  async generateResponse(prompt, userLanguage = 'english', retryCount = 0) {
    const currentModel = this.models[retryCount];
    
    if (!currentModel) {
      logger.error('All AI models failed');
      return this.getFallbackResponse(userLanguage);
    }

    try {
      logger.info(`Attempting AI request with model: ${currentModel}`);
      
      const systemPrompt = this.getSystemPrompt(userLanguage);
      
      const response = await axios.post(
        this.baseUrl,
        {
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/salman-dev-app',
            'X-Title': 'Salman Dev AI Assistant'
          },
          timeout: 10000 // Reduced timeout for faster fallback
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('Empty response from AI');
      }

      logger.info(`AI response generated successfully with ${currentModel}`);
      return aiResponse;

    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error(`AI request failed with ${currentModel}: ${errorMessage}`);
      
      // Try next model
      if (retryCount < this.models.length - 1) {
        logger.info(`Falling back to next model...`);
        return this.generateResponse(prompt, userLanguage, retryCount + 1);
      }
      
      // All models failed
      return this.getFallbackResponse(userLanguage);
    }
  }

  getSystemPrompt(language) {
    const languageInstructions = {
      bangla: 'You MUST respond in Romanized Bangla (Bangla words written in English letters/alphabet). Example: "Kemon achen? Ami apnar ki shahajjo korte pari?"',
      hindi: 'You MUST respond in Romanized Hindi (Hindi words written in English letters/alphabet). Example: "Kaise hain aap? Main aapki kya madad kar sakta hoon?"',
      english: 'You will respond in English.'
    };

    return `You are a professional digital assistant for Salman Dev, a tech entrepreneur and developer.

Your role:
- Assist potential clients in a friendly, human-like manner
- Explain services and products clearly and concisely
- Keep conversations engaging and natural
- NEVER sound robotic or like ChatGPT
- Keep responses VERY SHORT (1-2 sentences maximum)
- Be helpful but redirect sales confirmations to Salman Dev
- Act like a real human business assistant

Communication style:
- Casual but professional
- Warm and approachable
- Brief and to the point
- Natural conversation flow

${languageInstructions[language] || languageInstructions.english}

Remember: You're representing a real person's brand. Be authentic, helpful, and human.`;
  }

  getFallbackResponse(language) {
    const fallbacks = {
      bangla: 'Dukkito, ami ekhon reply dite parchi na. Ektu por abar try korun.',
      hindi: 'Maaf kijiye, main abhi jawab nahi de pa raha hoon. Kripya thodi der baad fir koshish karein.',
      english: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.'
    };

    return fallbacks[language] || fallbacks.english;
  }

  async generateResponseWithContext(userMessage, brandMemory, products, userContext, userLanguage) {
    const contextPrompt = `
${brandMemory}

Available Products:
${products}

User's previous context: ${userContext || 'First interaction'}

User's message: ${userMessage}

Respond naturally and helpfully. Keep it brief and human-like.
`.trim();

    return this.generateResponse(contextPrompt, userLanguage);
  }
}
