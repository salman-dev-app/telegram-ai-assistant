import { User } from '../database/models/User.js';
import { logger } from '../utils/logger.js';

export class UserService {
  static async getOrCreateUser(ctx) {
    try {
      const telegramId = ctx.from.id;
      const username = ctx.from.username || null;
      const firstName = ctx.from.first_name || null;
      const lastName = ctx.from.last_name || null;

      let user = await User.findOne({ telegramId });

      if (!user) {
        user = await User.create({
          telegramId,
          username,
          firstName,
          lastName
        });
        logger.info(`New user created: ${telegramId}`);
      } else {
        // Update user info if changed
        user.username = username;
        user.firstName = firstName;
        user.lastName = lastName;
        await user.save();
      }

      return user;
    } catch (error) {
      logger.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  static async setUserLanguage(userId, language) {
    try {
      const user = await User.findOne({ telegramId: userId });
      if (user) {
        user.language = language;
        user.languageSelected = true;
        await user.save();
        logger.info(`User ${userId} language set to ${language}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error in setUserLanguage:', error);
      return false;
    }
  }

  static async checkSpam(userId, message) {
    try {
      const user = await User.findOne({ telegramId: userId });
      if (!user) return false;

      const isSpam = user.checkSpam(message);
      
      if (isSpam) {
        user.spamScore += 1;
        await user.save();
        logger.warn(`Spam detected from user ${userId}`);
      }

      return isSpam;
    } catch (error) {
      logger.error('Error in checkSpam:', error);
      return false;
    }
  }

  static async addUserMessage(userId, message) {
    try {
      const user = await User.findOne({ telegramId: userId });
      if (user) {
        await user.addMessage(message);
      }
    } catch (error) {
      logger.error('Error in addUserMessage:', error);
    }
  }

  static async updateUserContext(userId, context) {
    try {
      const user = await User.findOne({ telegramId: userId });
      if (user) {
        await user.updateContext(context);
      }
    } catch (error) {
      logger.error('Error in updateUserContext:', error);
    }
  }
}
