import { Markup } from 'telegraf';
import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { User } from '../database/models/User.js';
import { CommandStats } from '../database/models/CommandStats.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import {
  kickUser,
  banUser,
  unbanUser,
  restrictUser,
  promoteModerator
} from '../utils/helpers.js';

export class AdminController {
  static async handleUpdateMemory(ctx) {
    try {
      await CommandStats.trackCommand('update_memory', ctx.from.id, 'Update Memory');
      
      const text = ctx.message.text.replace('/update_memory', '').trim();
      
      if (!text) {
        return ctx.reply(
          '📝 *UPDATE BRAND INFO*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/update_memory [field] [value]`\n\n' +
          '💎 *Available Fields:*\n' +
          '• `about` - About you\n' +
          '• `services` - Your services (comma-separated)\n' +
          '• `offers` - Current offers\n' +
          '• `availability` - Availability info\n' +
          '• `notes` - Custom notes\n\n' +
          '💡 *Example:*\n' +
          '`/update_memory about I am a full-stack developer from Bangladesh`',
          { parse_mode: 'Markdown' }
        );
      }

      const memory = await BrandMemory.getMemory();
      
      const parts = text.split(' ');
      const field = parts[0].toLowerCase();
      const value = parts.slice(1).join(' ');

      if (!value) {
        return ctx.reply('❌ Please provide a value for the field.');
      }

      switch (field) {
        case 'about':
          memory.about = value;
          break;
        case 'services':
          memory.services = value.split(',').map(s => s.trim());
          break;
        case 'offers':
          memory.offers = value;
          break;
        case 'availability':
          memory.availability = value;
          break;
        case 'notes':
          memory.customNotes = value;
          break;
        default:
          return ctx.reply('❌ Invalid field. Use: about, services, offers, availability, or notes');
      }

      memory.lastUpdated = Date.now();
      await memory.save();

      logger.info(`Brand memory updated by admin: ${field}`);
      ctx.reply(`✅ *Updated Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n💎 *Field:* ${field}\n💎 *Value:* ${value}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleUpdateMemory:', error);
      ctx.reply('❌ Failed to update memory. Please try again.');
    }
  }

  static async handleAddProduct(ctx) {
    try {
      await CommandStats.trackCommand('add_product', ctx.from.id, 'Add Product');
      
      const text = ctx.message.text.replace('/add_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '🛍️ *ADD NEW PRODUCT*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/add_product [name] | [description] | [price] | [features] | [demo_url]`\n\n' +
          '💡 *Example:*\n' +
          '`/add_product Elite Bot | Custom AI for business | $1000 | 24/7 support, Multi-language | https://demo.com`\n\n' +
          '⚠️ *Note:* Features should be comma-separated.',
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return ctx.reply('❌ Invalid format. Provide at least: name | description | price');
      }

      const [name, description, price, featuresStr, demoUrl] = parts;
      
      const features = featuresStr 
        ? featuresStr.split(',').map(f => f.trim())
        : [];

      const product = await Product.create({
        name,
        description,
        price,
        features,
        demoUrl: demoUrl || null
      });

      logger.info(`Product added by admin: ${name}`);
      
      ctx.reply(
        `✅ *Product Added!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *${product.name}*\n` +
        `💰 *Price:* ${product.price}\n` +
        `📝 *Description:* ${product.description}\n` +
        `${features.length > 0 ? `✨ *Features:* ${features.join(', ')}\n` : ''}` +
        `${demoUrl ? `🔗 *Demo:* ${demoUrl}` : ''}`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      logger.error('Error in handleAddProduct:', error);
      ctx.reply('❌ Failed to add product. Please try again.');
    }
  }

  static async handleRemoveProduct(ctx) {
    try {
      await CommandStats.trackCommand('remove_product', ctx.from.id, 'Remove Product');
      
      const text = ctx.message.text.replace('/remove_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '🗑️ *REMOVE PRODUCT*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/remove_product [Product ID]`\n\n' +
          '💡 *Tip:* Use `/list_products` to find the ID.',
          { parse_mode: 'Markdown' }
        );
      }

      const product = await Product.findById(text);
      
      if (!product) {
        return ctx.reply('❌ Product not found. Please check the ID.');
      }

      await Product.findByIdAndDelete(text);
      
      logger.info(`Product removed by admin: ${product.name}`);
      
      ctx.reply(
        `✅ *Product Removed!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Name:* ${product.name}\n` +
        `🆔 *ID:* \`${text}\``,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      logger.error('Error in handleRemoveProduct:', error);
      ctx.reply('❌ Failed to remove product.');
    }
  }

  static async handleStatus(ctx) {
    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🟢 Online', 'status_online'),
          Markup.button.callback('🟡 Busy', 'status_busy'),
          Markup.button.callback('🔴 Away', 'status_away')
        ],
        [Markup.button.callback('🛠 Admin Menu', 'admin_menu')]
      ]);

      const text = '🚦 *PRESENCE CONTROL*\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                   'Select your status:\n\n' +
                   '🟢 *Online:* Bot is silent. You handle all.\n' +
                   '🟡 *Busy:* AI handles queries. You are busy.\n' +
                   '🔴 *Away:* AI handles all. You are offline.';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleStatus:', error);
      ctx.reply('❌ Failed to open status control.');
    }
  }

  static async handleStatusCallback(ctx) {
    try {
      const status = ctx.callbackQuery.data.replace('status_', '');
      await CommandStats.trackCommand('status_change', ctx.from.id, `Status: ${status}`);
      
      const memory = await BrandMemory.getMemory();
      memory.status = status;
      await memory.save();

      const statusEmoji = {
        online: '🟢',
        busy: '🟡',
        away: '🔴'
      };

      const statusText = {
        online: 'ONLINE (Bot Silent)',
        busy: 'BUSY (AI Assisting)',
        away: 'AWAY (AI Handling All)'
      };

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚦 Back', 'status_menu')],
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ]);

      await ctx.editMessageText(
        `✅ *Status Updated!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusEmoji[status]} *New Status:* **${statusText[status]}**`,
        { parse_mode: 'Markdown', ...keyboard }
      );

      await ctx.answerCbQuery(`Status set to ${status.toUpperCase()}`);
      logger.info(`Status updated: ${status}`);

    } catch (error) {
      logger.error('Error in handleStatusCallback:', error);
      ctx.answerCbQuery('Error updating status');
    }
  }

  static async handleViewMemory(ctx) {
    try {
      await CommandStats.trackCommand('view_memory', ctx.from.id, 'View Memory');
      
      const memory = await BrandMemory.getMemory();
      const products = await Product.find({ isActive: true });
      const userCount = await User.countDocuments();

      const statusEmoji = {
        online: '🟢',
        busy: '🟡',
        away: '🔴'
      };

      const message = `
📊 *SYSTEM ANALYTICS*
━━━━━━━━━━━━━━━━━━━━━━━━

🚦 *Status:* ${statusEmoji[memory.status]} **${memory.status.toUpperCase()}**
👥 *Total Users:* **${userCount}**
📦 *Active Products:* **${products.length}**

👤 *Brand Info:*
${memory.getFormattedMemory()}

━━━━━━━━━━━━━━━━━━━━━━━━
🕒 *Last Updated:* ${memory.lastUpdated.toLocaleString()}
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📢 Broadcast', 'broadcast_menu'),
          Markup.button.callback('🛡️ Backup', 'backup_system')
        ],
        [Markup.button.callback('🛠 Admin Menu', 'admin_menu')],
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleViewMemory:', error);
      ctx.reply('❌ Failed to retrieve memory.');
    }
  }

  static async handleListProducts(ctx) {
    try {
      await CommandStats.trackCommand('list_products', ctx.from.id, 'List Products');
      
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        return ctx.reply('📦 No products available.');
      }

      const message = products.map((p, i) => 
        `${i + 1}. 📦 *${p.name}* - ${p.price}\n` +
        `   📝 ${p.description}\n` +
        `   👁️ Views: ${p.viewCount}\n` +
        `   🆔 ID: \`${p._id}\``
      ).join('\n\n');

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(`📜 *PRODUCT CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${message}`, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(`📜 *PRODUCT CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${message}`, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleListProducts:', error);
      ctx.reply('❌ Failed to retrieve products.');
    }
  }

  // ===== NEW: COMMAND STATISTICS =====
  static async handleCommandStats(ctx) {
    try {
      await CommandStats.trackCommand('view_stats', ctx.from.id, 'View Stats');
      
      const topCommands = await CommandStats.getTopCommands(15);
      
      if (topCommands.length === 0) {
        const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🏠 Back', 'admin_menu')]]);
        return ctx.editMessageText('📈 No command statistics yet.', { ...keyboard });
      }

      let statsMsg = '📈 *COMMAND STATISTICS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      for (let i = 0; i < topCommands.length; i++) {
        const cmd = topCommands[i];
        statsMsg += `${i + 1}. *${cmd.commandName}*\n   Total: ${cmd.count} | Users: ${cmd.users.length}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', 'command_stats')],
        [Markup.button.callback('🏠 Back', 'admin_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(statsMsg, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(statsMsg, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleCommandStats:', error);
    }
  }

  static async handleBroadcast(ctx) {
    try {
      await CommandStats.trackCommand('broadcast', ctx.from.id, 'Broadcast');
      
      const text = ctx.message.text.replace('/broadcast', '').trim();
      if (!text) {
        return ctx.reply(
          '📢 *BROADCAST SYSTEM*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/broadcast [your message]`\n\n' +
          'This will send a message to ALL users.',
          { parse_mode: 'Markdown' }
        );
      }

      const users = await User.find({ isBlocked: false });
      let successCount = 0;
      let failCount = 0;

      await ctx.reply(`📢 *Broadcasting to ${users.length} users...*`, { parse_mode: 'Markdown' });

      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(user.telegramId, `📢 *BROADCAST FROM SALMAN DEV*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${text}`, { parse_mode: 'Markdown' });
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          failCount++;
          logger.error(`Broadcast failed for user ${user.telegramId}`);
        }
      }

      await ctx.reply(`✅ *Broadcast Complete!*\n\n🚀 Success: ${successCount}\n❌ Failed: ${failCount}`, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleBroadcast:', error);
      ctx.reply('❌ Broadcast failed.');
    }
  }

  static async handleBackup(ctx) {
    try {
      await CommandStats.trackCommand('backup', ctx.from.id, 'Backup');
      
      const memory = await BrandMemory.find();
      const products = await Product.find();
      const users = await User.find();

      const backupData = {
        timestamp: new Date().toISOString(),
        brandMemory: memory,
        products: products,
        users: users.map(u => ({
          telegramId: u.telegramId,
          username: u.username,
          language: u.language,
          messageCount: u.messageCount
        }))
      };

      const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const filePath = path.join(backupDir, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      await ctx.replyWithDocument({ source: filePath, filename: fileName }, {
        caption: '🛡️ *SYSTEM BACKUP COMPLETE*\n\nThis file contains all your data.',
        parse_mode: 'Markdown'
      }).catch(err => logger.error('Error sending backup document:', err));

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (ctx.callbackQuery) await ctx.answerCbQuery('Backup sent!');
    } catch (error) {
      logger.error('Error in handleBackup:', error);
      ctx.reply('❌ Failed to create backup.');
    }
  }

  // ===== GROUP MANAGEMENT =====
  static async handleKickUser(ctx) {
    try {
      await CommandStats.trackCommand('kick_user', ctx.from.id, 'Kick User');
      
      const text = ctx.message.text.replace('/kick', '').trim();
      
      if (!text) {
        return ctx.reply('Usage: `/kick @username` or `/kick user_id`', { parse_mode: 'Markdown' });
      }

      const userId = parseInt(text) || text;
      const success = await kickUser(ctx, userId);

      if (success) {
        ctx.reply(`✅ User kicked from the group.`);
      } else {
        ctx.reply(`❌ Failed to kick user. Check if user exists.`);
      }
    } catch (error) {
      logger.error('Error in handleKickUser:', error);
      ctx.reply('❌ Error kicking user.');
    }
  }

  static async handleBanUser(ctx) {
    try {
      await CommandStats.trackCommand('ban_user', ctx.from.id, 'Ban User');
      
      const text = ctx.message.text.replace('/ban', '').trim();
      
      if (!text) {
        return ctx.reply('Usage: `/ban @username` or `/ban user_id`', { parse_mode: 'Markdown' });
      }

      const userId = parseInt(text) || text;
      const success = await banUser(ctx, userId);

      if (success) {
        ctx.reply(`✅ User banned from the group.`);
      } else {
        ctx.reply(`❌ Failed to ban user.`);
      }
    } catch (error) {
      logger.error('Error in handleBanUser:', error);
      ctx.reply('❌ Error banning user.');
    }
  }

  static async handleUnbanUser(ctx) {
    try {
      await CommandStats.trackCommand('unban_user', ctx.from.id, 'Unban User');
      
      const text = ctx.message.text.replace('/unban', '').trim();
      
      if (!text) {
        return ctx.reply('Usage: `/unban @username` or `/unban user_id`', { parse_mode: 'Markdown' });
      }

      const userId = parseInt(text) || text;
      const success = await unbanUser(ctx, userId);

      if (success) {
        ctx.reply(`✅ User unbanned.`);
      } else {
        ctx.reply(`❌ Failed to unban user.`);
      }
    } catch (error) {
      logger.error('Error in handleUnbanUser:', error);
      ctx.reply('❌ Error unbanning user.');
    }
  }

  static async handlePromoteUser(ctx) {
    try {
      await CommandStats.trackCommand('promote_user', ctx.from.id, 'Promote User');
      
      const text = ctx.message.text.replace('/promote', '').trim();
      
      if (!text) {
        return ctx.reply('Usage: `/promote @username` or `/promote user_id`', { parse_mode: 'Markdown' });
      }

      const userId = parseInt(text) || text;
      const success = await promoteModerator(ctx, userId);

      if (success) {
        ctx.reply(`✅ User promoted to moderator.`);
      } else {
        ctx.reply(`❌ Failed to promote user.`);
      }
    } catch (error) {
      logger.error('Error in handlePromoteUser:', error);
      ctx.reply('❌ Error promoting user.');
    }
  }

  // ===== FAQ MANAGEMENT =====
  static async handleAddFAQ(ctx) {
    try {
      await CommandStats.trackCommand('add_faq', ctx.from.id, 'Add FAQ');
      
      const text = ctx.message.text.replace('/add_faq', '').trim();
      
      if (!text) {
        return ctx.reply(
          '❓ *ADD FAQ*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/add_faq [question] | [answer]`\n\n' +
          '💡 *Example:*\n' +
          '`/add_faq What is your price? | Our pricing starts at $500`',
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 2) {
        return ctx.reply('❌ Invalid format. Use: question | answer');
      }

      const [question, answer] = parts;
      const memory = await BrandMemory.getMemory();
      
      if (!memory.faqs) memory.faqs = [];
      
      memory.faqs.push({ question, answer });
      await memory.save();

      ctx.reply(`✅ *FAQ Added!*\n\n❓ *Q:* ${question}\n📝 *A:* ${answer}`, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleAddFAQ:', error);
      ctx.reply('❌ Failed to add FAQ.');
    }
  }

  static async handleRemoveFAQ(ctx) {
    try {
      await CommandStats.trackCommand('remove_faq', ctx.from.id, 'Remove FAQ');
      
      const text = ctx.message.text.replace('/remove_faq', '').trim();
      
      if (!text) {
        return ctx.reply('Usage: `/remove_faq [index]` (e.g., `/remove_faq 1` for first FAQ)', { parse_mode: 'Markdown' });
      }

      const index = parseInt(text) - 1;
      const memory = await BrandMemory.getMemory();
      
      if (!memory.faqs || index < 0 || index >= memory.faqs.length) {
        return ctx.reply('❌ Invalid FAQ index.');
      }

      const removed = memory.faqs.splice(index, 1)[0];
      await memory.save();

      ctx.reply(`✅ *FAQ Removed!*\n\n❓ *Q:* ${removed.question}`, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleRemoveFAQ:', error);
      ctx.reply('❌ Failed to remove FAQ.');
    }
  }
}
