import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class GroqAI {
  constructor() {
    this.apiKey = config.openRouter.apiKey; // Reusing the key from config
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ];
  }

  async generateResponse(prompt, userLanguage = 'english', retryCount = 0) {
    const currentModel = this.models[retryCount];
    
    if (!currentModel) {
      logger.error('All Groq models failed');
      return this.getFallbackResponse(userLanguage);
    }

    try {
      logger.info(`Attempting AI request with Groq model: ${currentModel}`);
      
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
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('Empty response from Groq');
      }

      logger.info(`Groq response generated successfully with ${currentModel}`);
      return aiResponse;

    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error(`Groq request failed with ${currentModel}: ${errorMessage}`);
      
      if (retryCount < this.models.length - 1) {
        logger.info(`Falling back to next Groq model...`);
        return this.generateResponse(prompt, userLanguage, retryCount + 1);
      }
      
      return this.getFallbackResponse(userLanguage);
    }
  }

  getSystemPrompt(language) {
    const languageInstructions = {
      bangla: `
        CRITICAL RULE: You MUST respond in BANGLISH (Bengali language written using English letters).
        - Do NOT use Bengali Unicode characters/script.
        - Use Romanized Bengali only.
        - Example: "Apnake kivabe sahajjo korte pari?"
        - Tone: Natural, conversational, short (1-2 sentences).
        - Examples: "Salman Dev ekhon offline achen.", "Apni chaile message rekhe jete paren.", "Ektu wait korun, ami check kortesi."
      `,
      hindi: 'You MUST respond in Romanized Hindi (Hindi words written in English letters). Example: "Kaise hain aap? Main aapki kya madad kar sakta hoon?"',
      english: 'You will respond in English.'
    };

    return `You are a professional digital assistant for Salman Dev, a tech entrepreneur and developer.

Your role:
- Assist potential clients in a friendly, human-like manner.
- Explain services and products clearly and concisely.
- Keep conversations engaging and natural.
- NEVER sound robotic or like ChatGPT.
- Keep responses VERY SHORT (1-2 sentences maximum).
- Act like a real human business assistant.

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
