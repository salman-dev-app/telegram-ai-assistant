import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export class VoiceMessageHandler {
  // ===== TEXT TO SPEECH USING FREE API =====
  static async generateVoiceMessage(text, language = 'en') {
    try {
      // Limit text to 50 seconds worth (approximately 250-300 characters)
      const maxChars = 300;
      const limitedText = text.substring(0, maxChars);

      // Try multiple free TTS APIs
      const audioBuffer = await VoiceMessageHandler.tryTTSApis(limitedText, language);

      if (!audioBuffer) {
        logger.error('All TTS APIs failed');
        return null;
      }

      return audioBuffer;
    } catch (error) {
      logger.error('Error in generateVoiceMessage:', error);
      return null;
    }
  }

  // ===== TRY MULTIPLE FREE TTS APIS =====
  static async tryTTSApis(text, language) {
    // API 1: Google Translate TTS (Free, no key required)
    try {
      const audioBuffer = await VoiceMessageHandler.googleTranslateTTS(text, language);
      if (audioBuffer) {
        logger.info('✅ Google Translate TTS succeeded');
        return audioBuffer;
      }
    } catch (error) {
      logger.warn('Google Translate TTS failed:', error.message);
    }

    // API 2: ElevenLabs Free Tier (if available)
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (apiKey) {
        const audioBuffer = await VoiceMessageHandler.elevenLabsTTS(text, apiKey);
        if (audioBuffer) {
          logger.info('✅ ElevenLabs TTS succeeded');
          return audioBuffer;
        }
      }
    } catch (error) {
      logger.warn('ElevenLabs TTS failed:', error.message);
    }

    // API 3: OpenAI TTS (if API key available)
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const audioBuffer = await VoiceMessageHandler.openaiTTS(text, apiKey);
        if (audioBuffer) {
          logger.info('✅ OpenAI TTS succeeded');
          return audioBuffer;
        }
      }
    } catch (error) {
      logger.warn('OpenAI TTS failed:', error.message);
    }

    // API 4: Pyttsx3 (Fallback - local)
    try {
      const audioBuffer = await VoiceMessageHandler.pyttsx3TTS(text);
      if (audioBuffer) {
        logger.info('✅ Pyttsx3 TTS succeeded');
        return audioBuffer;
      }
    } catch (error) {
      logger.warn('Pyttsx3 TTS failed:', error.message);
    }

    return null;
  }

  // ===== GOOGLE TRANSLATE TTS =====
  static async googleTranslateTTS(text, language = 'en') {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${language}&client=tw-ob`;

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data.length > 0) {
        return Buffer.from(response.data);
      }

      return null;
    } catch (error) {
      logger.error('Google Translate TTS error:', error.message);
      return null;
    }
  }

  // ===== ELEVENLABS TTS =====
  static async elevenLabsTTS(text, apiKey) {
    try {
      const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice (free tier)

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.length > 0) {
        return Buffer.from(response.data);
      }

      return null;
    } catch (error) {
      logger.error('ElevenLabs TTS error:', error.message);
      return null;
    }
  }

  // ===== OPENAI TTS =====
  static async openaiTTS(text, apiKey) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: 'alloy'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data.length > 0) {
        return Buffer.from(response.data);
      }

      return null;
    } catch (error) {
      logger.error('OpenAI TTS error:', error.message);
      return null;
    }
  }

  // ===== PYTTSX3 TTS (LOCAL FALLBACK) =====
  static async pyttsx3TTS(text) {
    try {
      const { spawn } = await import('child_process');
      const tempFile = path.join('/tmp', `voice_${Date.now()}.mp3`);

      const pythonScript = `
import pyttsx3
engine = pyttsx3.init()
engine.setProperty('rate', 150)
engine.save_to_file('${text}', '${tempFile}')
engine.runAndWait()
`;

      const pythonProcess = spawn('python3', ['-c', pythonScript]);

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code === 0 && fs.existsSync(tempFile)) {
            const audioBuffer = fs.readFileSync(tempFile);
            fs.unlinkSync(tempFile); // Clean up
            resolve(Buffer.from(audioBuffer));
          } else {
            reject(new Error('Pyttsx3 failed'));
          }
        });

        pythonProcess.on('error', reject);
      });
    } catch (error) {
      logger.error('Pyttsx3 TTS error:', error.message);
      return null;
    }
  }

  // ===== SAVE VOICE MESSAGE AND GET FILE PATH =====
  static async saveVoiceMessage(audioBuffer, userId) {
    try {
      const voiceDir = path.join('/tmp', 'voice_messages');

      // Create directory if it doesn't exist
      if (!fs.existsSync(voiceDir)) {
        fs.mkdirSync(voiceDir, { recursive: true });
      }

      const fileName = `voice_${userId}_${Date.now()}.ogg`;
      const filePath = path.join(voiceDir, fileName);

      fs.writeFileSync(filePath, audioBuffer);

      logger.info(`✅ Voice message saved: ${filePath}`);

      return filePath;
    } catch (error) {
      logger.error('Error in saveVoiceMessage:', error);
      return null;
    }
  }

  // ===== SEND VOICE MESSAGE TO TELEGRAM =====
  static async sendVoiceMessage(ctx, text, language = 'en') {
    try {
      // Show typing indicator
      await ctx.sendChatAction('record_audio');

      // Generate voice message
      const audioBuffer = await VoiceMessageHandler.generateVoiceMessage(text, language);

      if (!audioBuffer) {
        return ctx.reply('❌ Could not generate voice message. Please try again.');
      }

      // Save voice message
      const filePath = await VoiceMessageHandler.saveVoiceMessage(audioBuffer, ctx.from.id);

      if (!filePath) {
        return ctx.reply('❌ Could not save voice message. Please try again.');
      }

      // Send voice message
      await ctx.replyWithVoice(
        { source: filePath },
        {
          caption: '🎤 Voice Response',
          reply_to_message_id: ctx.message?.message_id
        }
      );

      // Clean up after sending
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);

      return true;
    } catch (error) {
      logger.error('Error in sendVoiceMessage:', error);
      return ctx.reply('❌ Error sending voice message. Please try again.');
    }
  }

  // ===== DETECT VOICE MESSAGE REQUEST =====
  static detectVoiceRequest(message) {
    const voiceKeywords = [
      'voice',
      'audio',
      'speak',
      'say',
      'tell me',
      'read',
      'sound',
      'hear',
      'listen'
    ];

    const lowerMessage = message.toLowerCase();
    return voiceKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // ===== HANDLE VOICE MESSAGE REQUEST =====
  static async handleVoiceRequest(ctx, aiResponse) {
    try {
      const language = ctx.session?.language || 'en';

      // Limit response to 50 seconds (approximately 300 characters)
      const limitedResponse = aiResponse.substring(0, 300);

      // Send voice message
      await VoiceMessageHandler.sendVoiceMessage(ctx, limitedResponse, language);

      return true;
    } catch (error) {
      logger.error('Error in handleVoiceRequest:', error);
      return false;
    }
  }
}
