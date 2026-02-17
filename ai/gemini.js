import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class GeminiAI {
  constructor() {
    // Use the same key from config or a new one if provided
    this.genAI = new GoogleGenerativeAI(config.openRouter.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateResponse(prompt, userLanguage = 'english') {
    try {
      logger.info(`Attempting AI request with Google Gemini (Free Tier)`);
      
      const systemPrompt = this.getSystemPrompt(userLanguage);
      
      const result = await this.model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Message: ${prompt}` }] }
        ],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        }
      });

      const aiResponse = result.response.text().trim();
      
      if (!aiResponse) {
        throw new Error('Empty response from Gemini');
      }

      logger.info(`Gemini response generated successfully`);
      return aiResponse;

    } catch (error) {
      logger.error(`Gemini request failed: ${error.message}`);
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
