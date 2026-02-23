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
          return ctx.reply('❌ Invalid field. Available: about, services, offers, availability, notes');
      }

      await memory.save();
      ctx.reply(`✅ *Brand info updated:* ${field}`, { parse_mode: 'Markdown' });
      logger.info(`Admin updated brand memory: ${field}`);

    } catch (error) {
      logger.error('Error in handleUpdateMemory:', error);
      ctx.reply('❌ Failed to update brand info.');
    }
  }

  static async handleAddProduct(ctx) {
    try {
      await CommandStats.trackCommand('add_product', ctx.from.id, 'Add Product');
      
      const text = ctx.message.text.replace('/add_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '📦 *ADD NEW PRODUCT*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/add_product [Name] | [Price] | [Description] | [Features, comma-sep]`\n\n' +
          '💡 *Example:*\n' +
          '`/add_product My Script | $50 | Awesome script | fast, secure, easy`',
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return ctx.reply('❌ Invalid format. Please provide at least Name, Price, and Description.');
      }

      const [name, price, description, features] = parts;
      
      const product = await Product.create({
        name,
        price,
        description,
        features: features ? features.split(',').map(f => f.trim()) : [],
        isActive: true
      });

      ctx.reply(
        `✅ *Product Added!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Name:* ${name}\n` +
        `💰 *Price:* ${price}\n` +
        `🆔 *ID:* \`${product._id}\``,
        { parse_mode: 'Markdown' }
      );
      
      logger.info(`New product added by admin: ${name}`);

    } catch (error) {
      logger.error('Error in handleAddProduct:', error);
      ctx.reply('❌ Failed to add product.');
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

      // Check if text is a valid ObjectId before querying
      if (!text.match(/^[0-9a-fA-F]{24}$/)) {
        return ctx.reply('❌ Invalid Product ID format. ID must be a 24-character hex string.');
      }

      const product = await Product.findById(text);
      
      if (!product) {
        return ctx.reply('❌ Product not found. Please check the ID.');
      }

      await Product.findByIdAndDelete(text);
      
      logger.info(`Product removed by admin: ${product.name}`);
      
      // Escape product name to prevent Markdown parsing errors
      const escapedName = product.name.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
      
      ctx.reply(
        `✅ *Product Removed!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Name:* ${escapedName}\n` +
        `🆔 *ID:* \`${text}\``,
        { parse_mode: 'Markdown' }
      ).catch(async () => {
        // Fallback to plain text if Markdown fails
        await ctx.reply(`✅ Product Removed!\nName: ${product.name}\nID: ${text}`);
      });

    } catch (error) {
      logger.error('Error in handleRemoveProduct:', error);
      ctx.reply('❌ Failed to remove product.');
    }
  }

  static async handleStatus(ctx) {
    try {
      await CommandStats.trackCommand('status_command', ctx.from.id, 'Status Command');
      
      const text = ctx.message?.text?.replace('/status', '').trim().toLowerCase();
      const memory = await BrandMemory.getMemory();

      if (!text) {
        const keyboard = [
          [
            Markup.button.callback('🟢 Online', 'status_online'),
            Markup.button.callback('🟡 Busy', 'status_busy'),
            Markup.button.callback('🔴 Away', 'status_away')
          ]
        ];

        return ctx.reply(
          `🚦 *CURRENT STATUS:* ${memory.status.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          'Choose your current status:',
          { 
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(keyboard)
          }
        );
      }

      if (['online', 'busy', 'away'].includes(text)) {
        memory.status = text;
        await memory.save();
        ctx.reply(`✅ *Status updated to:* ${text.toUpperCase()}`, { parse_mode: 'Markdown' });
        logger.info(`Admin updated status to: ${text}`);
      } else {
        ctx.reply('❌ Invalid status. Choose: online, busy, away');
      }

    } catch (error) {
      logger.error('Error in handleStatus:', error);
    }
  }

  static async handleStatusCallback(ctx) {
    try {
      const status = ctx.callbackQuery.data.replace('status_', '');
      const memory = await BrandMemory.getMemory();
      
      memory.status = status;
      await memory.save();
      
      await ctx.editMessageText(`✅ *Status updated to:* ${status.toUpperCase()}`, { parse_mode: 'Markdown' });
      await ctx.answerCbQuery(`Status: ${status}`);
      logger.info(`Admin updated status via callback: ${status}`);
    } catch (error) {
      logger.error('Error in handleStatusCallback:', error);
    }
  }

  static async handleViewMemory(ctx) {
    try {
      await CommandStats.trackCommand('view_memory', ctx.from.id, 'View Memory');
      
      const memory = await BrandMemory.getMemory();
      const productsCount = await Product.countDocuments({ isActive: true });
      const usersCount = await User.countDocuments();

      const memoryMsg = `
📊 *SYSTEM STATISTICS*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Users:* ${usersCount}
📦 *Products:* ${productsCount}
🚦 *Status:* ${memory.status.toUpperCase()}

📝 *About:*
${memory.about}

🛠 *Services:*
${memory.services.join(', ')}

📅 *Last Updated:* ${new Date(memory.lastUpdated).toLocaleString()}
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back', 'admin_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(memoryMsg, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(memoryMsg, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleViewMemory:', error);
    }
  }

  static async handleBroadcast(ctx) {
    try {
      await CommandStats.trackCommand('broadcast_command', ctx.from.id, 'Broadcast');
      
      const text = ctx.message.text.replace('/broadcast', '').trim();
      
      if (!text) {
        return ctx.reply('❌ Usage: `/broadcast [your message]`', { parse_mode: 'Markdown' });
      }

      const users = await User.find();
      let successCount = 0;
      let failCount = 0;

      ctx.reply(`📢 *Starting broadcast to ${users.length} users...*`, { parse_mode: 'Markdown' });

      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(user.telegramId, text, { parse_mode: 'Markdown' });
          successCount++;
          // Small delay to avoid Telegram rate limits
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          failCount++;
        }
      }

      ctx.reply(
        `✅ *Broadcast Completed!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🟢 Success: ${successCount}\n` +
        `🔴 Failed: ${failCount}`,
        { parse_mode: 'Markdown' }
      );
      
      logger.info(`Admin broadcast sent to ${successCount} users`);

    } catch (error) {
      logger.error('Error in handleBroadcast:', error);
      ctx.reply('❌ Broadcast failed.');
    }
  }

  static async handleBackup(ctx) {
    try {
      await CommandStats.trackCommand('backup_command', ctx.from.id, 'Backup');
      
      const products = await Product.find();
      const memory = await BrandMemory.findOne();
      
      const backupData = {
        products,
        memory,
        timestamp: new Date().toISOString()
      };

      const backupPath = path.join(process.cwd(), 'backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      await ctx.replyWithDocument({ source: backupPath, filename: `backup_${new Date().getTime()}.json` }, {
        caption: '🛡️ *SYSTEM BACKUP*\n\nContains products and brand memory.',
        parse_mode: 'Markdown'
      });

      fs.unlinkSync(backupPath);
      logger.info('System backup generated and sent to admin');

    } catch (error) {
      logger.error('Error in handleBackup:', error);
      ctx.reply('❌ Backup failed.');
    }
  }

  static async handleKickUser(ctx) {
    try {
      const text = ctx.message.text.replace('/kick', '').trim();
      if (!text) return ctx.reply('❌ Usage: `/kick @username` or `/kick [user_id]`');
      
      const success = await kickUser(ctx, text);
      if (success) {
        ctx.reply(`👢 *User kicked successfully.*`, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('❌ Failed to kick user. Make sure I have admin rights and the user is in the group.');
      }
    } catch (error) {
      logger.error('Error in handleKickUser:', error);
    }
  }

  static async handleBanUser(ctx) {
    try {
      const text = ctx.message.text.replace('/ban', '').trim();
      if (!text) return ctx.reply('❌ Usage: `/ban @username` or `/ban [user_id]`');
      
      const success = await banUser(ctx, text);
      if (success) {
        ctx.reply(`🚫 *User banned successfully.*`, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('❌ Failed to ban user.');
      }
    } catch (error) {
      logger.error('Error in handleBanUser:', error);
    }
  }

  static async handleUnbanUser(ctx) {
    try {
      const text = ctx.message.text.replace('/unban', '').trim();
      if (!text) return ctx.reply('❌ Usage: `/unban @username` or `/unban [user_id]`');
      
      const success = await unbanUser(ctx, text);
      if (success) {
        ctx.reply(`✅ *User unbanned successfully.*`, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('❌ Failed to unban user.');
      }
    } catch (error) {
      logger.error('Error in handleUnbanUser:', error);
    }
  }

  static async handlePromoteUser(ctx) {
    try {
      const text = ctx.message.text.replace('/promote', '').trim();
      if (!text) return ctx.reply('❌ Usage: `/promote @username` or `/promote [user_id]`');
      
      const success = await promoteModerator(ctx, text);
      if (success) {
        ctx.reply(`⭐ *User promoted to moderator.*`, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('❌ Failed to promote user.');
      }
    } catch (error) {
      logger.error('Error in handlePromoteUser:', error);
    }
  }

  static async handleAddFAQ(ctx) {
    try {
      const text = ctx.message.text.replace('/add_faq', '').trim();
      if (!text || !text.includes('|')) {
        return ctx.reply('❌ Usage: `/add_faq [Question] | [Answer]`');
      }

      const [question, answer] = text.split('|').map(t => t.trim());
      const memory = await BrandMemory.getMemory();
      
      memory.faqs.push({ question, answer });
      await memory.save();

      ctx.reply('✅ *FAQ added successfully.*', { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleAddFAQ:', error);
    }
  }

  static async handleRemoveFAQ(ctx) {
    try {
      const text = ctx.message.text.replace('/remove_faq', '').trim();
      if (!text) return ctx.reply('❌ Usage: `/remove_faq [index]`');

      const index = parseInt(text) - 1;
      const memory = await BrandMemory.getMemory();
      
      if (isNaN(index) || index < 0 || index >= memory.faqs.length) {
        return ctx.reply('❌ Invalid index.');
      }

      memory.faqs.splice(index, 1);
      await memory.save();

      ctx.reply('✅ *FAQ removed successfully.*', { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleRemoveFAQ:', error);
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
        `${i + 1}. 📦 *${p.name.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')}*\n` +
        `   📝 ${p.description.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')}\n` +
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

  static async handleCommandStats(ctx) {
    try {
      await CommandStats.trackCommand('command_stats', ctx.from.id, 'View Stats');
      
      const topCommands = await CommandStats.getTopCommands(10);
      
      if (topCommands.length === 0) {
        return ctx.reply('📊 No command statistics available yet.');
      }

      let statsMsg = '📈 *TOP COMMANDS USAGE*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      topCommands.forEach((stat, index) => {
        statsMsg += `${index + 1}. \`${stat.commandName}\`: ${stat.count} uses\n`;
      });

      const keyboard = Markup.inlineKeyboard([
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
}
