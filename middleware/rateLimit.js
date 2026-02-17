import { RateLimit } from '../database/models/RateLimit.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const rateLimitMiddleware = async (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return next();
  }
  
  try {
    const isLimited = await RateLimit.checkLimit(
      userId, 
      config.bot.maxRepliesPerMinute
    );
    
    if (isLimited) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      // Silently ignore - don't reply to avoid spam
      return;
    }
    
    return next();
  } catch (error) {
    logger.error('Rate limit check error:', error);
    return next(); // Allow on error to not block legitimate users
  }
};
