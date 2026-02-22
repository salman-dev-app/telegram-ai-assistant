import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class GroqAI {
  constructor() {
    this.apiKey = config.openRouter.apiKey;
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
          max_tokens: 200,
          temperature: 0.75,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 12000
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
        - Tone: Natural, conversational, friendly, short (1-3 sentences max).
        - Examples: 
          "Salman Dev ekhon offline achen, ektu por abar try korun."
          "Apni chaile message rekhe jete paren, Salman bhai reply korben."
          "Ektu wait korun, ami check kortesi."
          "Haa, eta possible! Salman bhai er sathe directly kotha bolte paren."
        - Sound like a real Bangladeshi friend, not a robot.
        - NEVER say you are an AI unless directly asked.
      `,
      hindi: `
        You MUST respond in Romanized Hindi (Hindi words written in English letters).
        Example: "Kaise hain aap? Main aapki kya madad kar sakta hoon?"
        Tone: Friendly, natural, short (1-3 sentences max).
        Sound like a real person, not a robot.
        NEVER say you are an AI unless directly asked.
      `,
      english: `
        You will respond in English.
        Tone: Professional yet friendly, short (1-3 sentences max).
        Sound like a real human assistant, not a robot.
        NEVER say you are an AI unless directly asked.
      `
    };

    return `You are a smart, human-like digital assistant for Salman Dev, a professional developer and tech entrepreneur from Bangladesh.

Your role:
- Assist potential clients and group members in a friendly, human-like manner.
- Explain services and products clearly and concisely.
- Keep conversations engaging and natural.
- NEVER sound robotic or like ChatGPT.
- Keep responses SHORT (1-3 sentences maximum).
- Act like a real human business assistant who genuinely cares.
- If someone is just chatting casually, respond casually. If they need help, be helpful.
- SMART DETECTION: Only respond when someone is genuinely talking to you or asking something relevant. Do NOT respond to general group chatter that has nothing to do with services, products, or Salman Dev.
- If someone asks about pricing, services, demos, or products, always be helpful and offer to connect them.
- If someone asks something you don't know, say you'll check and they can contact Salman Dev directly.

${languageInstructions[language] || languageInstructions.english}

Remember: You're representing a real person's brand. Be authentic, helpful, and human.`;
  }

  getFallbackResponse(language) {
    const fallbacks = {
      bangla: 'Dukkito, ekhon ektu problem hochhe. Salman bhai ke directly message korun: @Otakuosenpai',
      hindi: 'Maaf kijiye, abhi thodi takleef ho rahi hai. Salman Dev ko directly message karein: @Otakuosenpai',
      english: 'Sorry, I\'m having a small issue right now. Please contact Salman Dev directly: @Otakuosenpai'
    };

    return fallbacks[language] || fallbacks.english;
  }

  async generateResponseWithContext(userMessage, brandMemory, products, userContext, userLanguage) {
    const contextPrompt = `
Brand Memory:
${brandMemory}

Available Products/Services:
${products}

User's previous conversation context: ${userContext || 'First interaction'}

User's current message: ${userMessage}

Respond naturally and helpfully. Keep it brief and human-like. If the user is asking about a product, mention it naturally and offer to help them get more info or a demo.
`.trim();

    return this.generateResponse(contextPrompt, userLanguage);
  }

  // Detect if a message is genuinely directed at the bot or needs a response
  async shouldRespond(message, botName, brandKeywords) {
    const lowerMsg = message.toLowerCase();
    
    // Always respond if bot is mentioned
    if (botName && lowerMsg.includes(botName.toLowerCase())) return true;
    
    // Always respond to questions
    if (message.includes('?')) return true;
    
    // Respond to brand/service keywords
    const keywords = [
      'salman', 'dev', 'bot', 'price', 'cost', 'service', 'product', 'demo',
      'help', 'contact', 'hire', 'project', 'work', 'website', 'app', 'build',
      'daam', 'ki', 'koto', 'kivabe', 'kemon', 'lagbe', 'chai', 'dorkar',
      'bhai', 'vai', 'apu', 'boss', 'sir',
      ...(brandKeywords || [])
    ];
    
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) return true;
    }
    
    // Don't respond to very short messages that are just reactions
    if (message.length < 4) return false;
    
    // Don't respond to messages that look like they're talking to someone else
    // (contain @username that is not this bot)
    if (message.includes('@') && !message.includes('@' + botName)) return false;
    
    return false;
  }
}
