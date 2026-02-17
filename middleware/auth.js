import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const isAdmin = (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (userId === config.telegram.adminId) {
    return next();
  }
  
  logger.warn(`Unauthorized admin access attempt by user ${userId}`);
  ctx.reply('⛔ This command is only available to the admin.');
  return;
};

export const isGroupChat = (ctx, next) => {
  const chatType = ctx.chat?.type;
  
  if (chatType === 'group' || chatType === 'supergroup') {
    return next();
  }
  
  ctx.reply('This bot is designed to work in group chats.');
  return;
};
