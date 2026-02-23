import { Markup } from 'telegraf';
import { GroupSettings } from '../database/models/GroupSettings.js';
import { CommandStats } from '../database/models/CommandStats.js';
import { logger } from '../utils/logger.js';

export class GroupController {
  // Initialize group settings
  static async initializeGroup(ctx) {
    try {
      const groupId = ctx.chat.id;
      
      let groupSettings = await GroupSettings.findOne({ groupId });
      
      if (!groupSettings) {
        groupSettings = await GroupSettings.create({
          groupId,
          groupName: ctx.chat.title || 'Unknown Group',
          autoModeration: {
            enabled: true,
            antiSpam: true,
            antiLinks: false,
            antiCaps: true,
            antiRepeated: true,
            maxWarnings: 3,
            autoKickAfterWarnings: true
          },
          welcomeMessage: {
            enabled: true,
            text: `👋 Welcome to ${ctx.chat.title}! Please follow the group rules.`
          },
          rules: [
            'Be respectful to all members',
            'No spam or flooding',
            'No explicit content',
            'Stay on topic'
          ]
        });
        
        logger.info(`Group ${groupId} initialized with settings`);
      }
      
      return groupSettings;
    } catch (error) {
      logger.error('Error in initializeGroup:', error);
    }
  }

  // Auto-moderation check
  static async checkAutoModeration(ctx) {
    try {
      const groupId = ctx.chat.id;
      const userId = ctx.from.id;
      const message = ctx.message.text || '';

      let groupSettings = await GroupSettings.findOne({ groupId });
      
      if (!groupSettings) {
        groupSettings = await GroupController.initializeGroup(ctx);
      }

      if (!groupSettings.autoModeration.enabled) {
        return true; // Allow message
      }

      // Check if user is muted
      if (groupSettings.isUserMuted(userId)) {
        try {
          await ctx.deleteMessage();
          return false;
        } catch (err) {
          logger.warn('Could not delete message from muted user');
        }
      }

      // Anti-spam check (SILENT)
      if (groupSettings.autoModeration.antiSpam) {
        const isSpam = await GroupController.detectSpam(message, userId, groupSettings);
        if (isSpam) {
          // Silent detection - just log and return false to ignore message
          logger.info(`Spam detected from user ${userId} in group ${groupId} (Silent)`);
          try { await ctx.deleteMessage(); } catch(e) {}
          return false;
        }
      }

      // Anti-caps check
      if (groupSettings.autoModeration.antiCaps) {
        if (message.length > 20 && message === message.toUpperCase() && /[A-Z]/.test(message)) {
          // Just delete the message instead of warning
          try { await ctx.deleteMessage(); } catch(e) {}
          return false;
        }
      }

      // Anti-repeated check
      if (groupSettings.autoModeration.antiRepeated) {
        if (/(.)\1{15,}/.test(message)) {
          try { await ctx.deleteMessage(); } catch(e) {}
          return false;
        }
      }

      // Anti-links check
      if (groupSettings.autoModeration.antiLinks) {
        if (/https?:\/\/|www\./i.test(message)) {
          try { await ctx.deleteMessage(); } catch(e) {}
          return false;
        }
      }

      return true; // Allow message
    } catch (error) {
      logger.error('Error in checkAutoModeration:', error);
      return true; // Allow message on error
    }
  }

  // Detect spam
  static async detectSpam(message, userId, groupSettings) {
    // Simple spam detection
    if (message.length > 4000) return true;
    if (/[!@#$%^&*]{10,}/.test(message)) return true;
    
    return false;
  }

  // Warn user (Disabled silent version)
  static async warnUser(ctx, userId, groupSettings, reason) {
    // Logic kept but message sending removed as per user request
    try {
      await groupSettings.addWarning(userId, reason);
      logger.info(`User ${userId} warned for: ${reason}`);
    } catch (error) {
      logger.error('Error in warnUser:', error);
    }
  }

  // Welcome new member
  static async welcomeNewMember(ctx) {
    try {
      let groupSettings = await GroupSettings.findOne({ groupId: ctx.chat.id });
      
      if (!groupSettings) {
        groupSettings = await GroupController.initializeGroup(ctx);
      }

      if (groupSettings.welcomeMessage.enabled) {
        const welcomeText = groupSettings.welcomeMessage.text || 
          `👋 Welcome to ${ctx.chat.title}! Please follow the group rules.`;

        // Show rules as inline buttons
        const buttons = [];
        if (groupSettings.rules.length > 0) {
          buttons.push([Markup.button.callback('📋 View Rules', 'view_rules')]);
        }
        buttons.push([Markup.button.callback('✅ Got it', 'rules_acknowledged')]);

        const keyboard = Markup.inlineKeyboard(buttons);

        await ctx.reply(welcomeText, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
      }

      groupSettings.stats.totalMembers += 1;
      await groupSettings.save();
    } catch (error) {
      logger.error('Error in welcomeNewMember:', error);
    }
  }

  // Show rules
  static async showRules(ctx) {
    try {
      const groupSettings = await GroupSettings.findOne({ groupId: ctx.chat.id });

      if (!groupSettings || groupSettings.rules.length === 0) {
        return ctx.answerCbQuery('No rules set');
      }

      let rulesText = '📋 *GROUP RULES*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      groupSettings.rules.forEach((rule, index) => {
        rulesText += `${index + 1}. ${rule}\n`;
      });

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Understood', 'rules_acknowledged')],
        [Markup.button.callback('🏠 Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(rulesText, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(rulesText, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
      }
    } catch (error) {
      logger.error('Error in showRules:', error);
    }
  }

  // Acknowledge rules
  static async acknowledgeRules(ctx) {
    try {
      await ctx.editMessageText('✅ *Thanks for understanding the rules!*\n\nEnjoy the group!', {
        parse_mode: 'Markdown'
      }).catch(() => {});
      await ctx.answerCbQuery('Rules acknowledged');
    } catch (error) {
      logger.error('Error in acknowledgeRules:', error);
    }
  }

  // Show group stats (admin)
  static async showGroupStats(ctx) {
    try {
      const groupSettings = await GroupSettings.findOne({ groupId: ctx.chat.id });

      if (!groupSettings) {
        return ctx.reply('❌ Group not initialized yet');
      }

      const statsMsg = `
📊 *GROUP STATISTICS*
━━━━━━━━━━━━━━━━━━━━━━━━

👥 *Total Members:* ${groupSettings.stats.totalMembers}
💬 *Messages:* ${groupSettings.stats.messagesCount}
🚫 *Spam Blocked:* ${groupSettings.stats.spamBlocked}
👢 *Users Kicked:* ${groupSettings.stats.usersKicked}
🚷 *Users Banned:* ${groupSettings.stats.usersBanned}

⚙️ *Auto-Moderation:* ${groupSettings.autoModeration.enabled ? '✅ Enabled' : '❌ Disabled'}
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ Settings', 'group_settings')],
        [Markup.button.callback('🏠 Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(statsMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(statsMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
      }
    } catch (error) {
      logger.error('Error in showGroupStats:', error);
    }
  }

  // Show group settings (admin)
  static async showGroupSettings(ctx) {
    try {
      let groupSettings = await GroupSettings.findOne({ groupId: ctx.chat.id });

      if (!groupSettings) {
        groupSettings = await GroupController.initializeGroup(ctx);
      }

      const settingsMsg = `
⚙️ *GROUP SETTINGS*
━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ *Auto-Moderation:* ${groupSettings.autoModeration.enabled ? '✅' : '❌'}
🚫 *Anti-Spam:* ${groupSettings.autoModeration.antiSpam ? '✅' : '❌'}
🔗 *Anti-Links:* ${groupSettings.autoModeration.antiLinks ? '✅' : '❌'}
🔤 *Anti-Caps:* ${groupSettings.autoModeration.antiCaps ? '✅' : '❌'}
🔄 *Anti-Repeated:* ${groupSettings.autoModeration.antiRepeated ? '✅' : '❌'}
👋 *Welcome Message:* ${groupSettings.welcomeMessage.enabled ? '✅' : '❌'}

Max Warnings: ${groupSettings.autoModeration.maxWarnings}
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🛡️ Toggle Auto-Mod', 'toggle_moderation'),
          Markup.button.callback('🚫 Toggle Anti-Spam', 'toggle_antispam')
        ],
        [
          Markup.button.callback('🔗 Toggle Anti-Links', 'toggle_antilinks'),
          Markup.button.callback('🔤 Toggle Anti-Caps', 'toggle_anticaps')
        ],
        [Markup.button.callback('🏠 Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(settingsMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(settingsMsg, {
          parse_mode: 'Markdown',
          ...keyboard
        }).catch(() => {});
      }
    } catch (error) {
      logger.error('Error in showGroupSettings:', error);
    }
  }
}
