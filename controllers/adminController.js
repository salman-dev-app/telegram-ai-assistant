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

      if (!value) return ctx.reply('❌ Please provide a value.');

      switch (field) {
        case 'about': memory.about = value; break;
        case 'services': memory.services = value.split(',').map(s => s.trim()); break;
        case 'offers': memory.offers = value; break;
        case 'availability': memory.availability = value; break;
        case 'notes': memory.notes = value; break;
        default: return ctx.reply('❌ Invalid field.');
      }

      await memory.save();
      ctx.reply(`✅ *Brand ${field} updated successfully!*`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleUpdateMemory:', error);
      ctx.reply('❌ Error updating memory.');
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
          'Usage: `/add_product Name | Description | Price | Category`\n\n' +
          '💡 *Example:*\n' +
          '`/add_product Telegram Bot | A smart AI bot | $50 | Bots`',
          { parse_mode: 'Markdown' }
        );
      }

      const [name, description, price, category] = text.split('|').map(s => s.trim());

      if (!name || !description || !price) {
        return ctx.reply('❌ Missing information. Use: `Name | Description | Price | Category`');
      }

      const product = await Product.create({
        name,
        description,
        price,
        category: category || 'General'
      });

      ctx.reply(`✅ *Product Added:*\n\n*Name:* ${product.name}\n*Price:* ${product.price}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleAddProduct:', error);
      ctx.reply('❌ Error adding product.');
    }
  }

  static async handleRemoveProduct(ctx) {
    try {
      await CommandStats.trackCommand('remove_product', ctx.from.id, 'Remove Product');
      
      const text = ctx.message.text.replace('/remove_product', '').trim();
      
      if (!text) {
        return ctx.reply('🗑 *REMOVE PRODUCT*\nUsage: `/remove_product [Product ID]`\nUse `/list_products` to find IDs.', { parse_mode: 'Markdown' });
      }

      // Check if ID is valid MongoDB ObjectId
      if (!text.match(/^[0-9a-fA-F]{24}$/)) {
        return ctx.reply('❌ Invalid Product ID format.');
      }

      const product = await Product.findByIdAndDelete(text);
      
      if (!product) {
        return ctx.reply('❌ Product not found.');
      }

      // Escape special characters in name for Markdown
      const escapedName = product.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
      ctx.reply(`✅ *Product Removed:* ${escapedName}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleRemoveProduct:', error);
      ctx.reply('❌ Error removing product.');
    }
  }

  static async handleListProducts(ctx) {
    try {
      await CommandStats.trackCommand('list_products', ctx.from.id, 'List Products');
      const products = await Product.find();

      if (products.length === 0) {
        return ctx.reply('📦 No products found.');
      }

      let list = '📦 *ALL PRODUCTS:*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      products.forEach((p, i) => {
        const escapedName = p.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
        list += `${i + 1}. *${escapedName}*\n🆔 \`${p._id}\`\n💰 ${p.price}\n\n`;
      });

      ctx.reply(list, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleListProducts:', error);
      ctx.reply('❌ Error listing products.');
    }
  }

  static async handleStatus(ctx) {
    try {
      await CommandStats.trackCommand('status_command', ctx.from.id, 'Status Command');
      
      const text = ctx.message.text.replace('/status', '').trim().toLowerCase();
      const validStatuses = ['online', 'busy', 'away'];

      if (!validStatuses.includes(text)) {
        return ctx.reply('🚦 *SET STATUS*\nUsage: `/status [online/busy/away]`', { parse_mode: 'Markdown' });
      }

      const memory = await BrandMemory.getMemory();
      memory.status = text;
      await memory.save();

      ctx.reply(`🚦 *Status updated to:* ${text.toUpperCase()}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleStatus:', error);
    }
  }

  static async handleStatusCallback(ctx) {
    try {
      const status = ctx.match.input.replace('status_', '');
      const memory = await BrandMemory.getMemory();
      memory.status = status;
      await memory.save();

      await ctx.answerCbQuery(`Status set to ${status}`);
      await ctx.editMessageText(`🚦 *Status updated to:* ${status.toUpperCase()}`, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleStatusCallback:', error);
    }
  }

  static async handleBroadcast(ctx) {
    try {
      await CommandStats.trackCommand('broadcast', ctx.from.id, 'Broadcast');
      
      const message = ctx.message.text.replace('/broadcast', '').trim();
      
      if (!message) {
        return ctx.reply('📢 *BROADCAST*\nUsage: `/broadcast [Your message]`', { parse_mode: 'Markdown' });
      }

      const users = await User.find({ isBlocked: false });
      let success = 0;
      let failed = 0;

      ctx.reply(`📢 *Starting broadcast to ${users.length} users...*`, { parse_mode: 'Markdown' });

      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
          success++;
          // Small delay to avoid hitting Telegram limits
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          failed++;
        }
      }

      ctx.reply(`✅ *Broadcast Complete*\n\n👤 Total Users: ${users.length}\n✅ Success: ${success}\n❌ Failed: ${failed}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleBroadcast:', error);
    }
  }

  static async handleBackup(ctx) {
    try {
      await CommandStats.trackCommand('backup', ctx.from.id, 'Backup');
      
      const products = await Product.find();
      const users = await User.find();
      const memory = await BrandMemory.getMemory();

      const backupData = {
        timestamp: new Date().toISOString(),
        products,
        users,
        brandMemory: memory
      };

      const filePath = path.join(process.cwd(), 'backup.json');
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      await ctx.replyWithDocument({ source: filePath, filename: `backup_${new Date().getTime()}.json` }, {
        caption: '🛡️ *System Backup Complete*'
      });

      fs.unlinkSync(filePath);

    } catch (error) {
      logger.error('Error in handleBackup:', error);
      ctx.reply('❌ Error generating backup.');
    }
  }

  static async handleCommandStats(ctx) {
    try {
      const stats = await CommandStats.getStats();
      
      let statsMsg = '📊 *COMMAND STATISTICS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      stats.forEach(s => {
        statsMsg += `• *${s.commandName}:* ${s.count} uses\n`;
      });

      if (stats.length === 0) statsMsg += 'No stats available yet.';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(statsMsg, { parse_mode: 'Markdown' });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(statsMsg, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      logger.error('Error in handleCommandStats:', error);
    }
  }

  static async handleViewMemory(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      const usersCount = await User.countDocuments();
      const productsCount = await Product.countDocuments();

      const memoryMsg = `
📊 *SYSTEM OVERVIEW*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Total Users:* ${usersCount}
📦 *Products:* ${productsCount}
🚦 *Current Status:* ${memory.status.toUpperCase()}

📝 *About:* ${memory.about.substring(0, 100)}...
🛠 *Services:* ${memory.services.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      if (ctx.callbackQuery) {
        await ctx.editMessageText(memoryMsg, { parse_mode: 'Markdown' });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(memoryMsg, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      logger.error('Error in handleViewMemory:', error);
    }
  }

  // Group Moderation Handlers
  static async handleKickUser(ctx) {
    const target = ctx.message.text.split(' ')[1];
    if (!target) return ctx.reply('Usage: /kick [user_id]');
    const success = await kickUser(ctx, target);
    ctx.reply(success ? '✅ User kicked.' : '❌ Failed to kick user.');
  }

  static async handleBanUser(ctx) {
    const target = ctx.message.text.split(' ')[1];
    if (!target) return ctx.reply('Usage: /ban [user_id]');
    const success = await banUser(ctx, target);
    ctx.reply(success ? '✅ User banned.' : '❌ Failed to ban user.');
  }

  static async handleUnbanUser(ctx) {
    const target = ctx.message.text.split(' ')[1];
    if (!target) return ctx.reply('Usage: /unban [user_id]');
    const success = await unbanUser(ctx, target);
    ctx.reply(success ? '✅ User unbanned.' : '❌ Failed to unban user.');
  }

  static async handlePromoteUser(ctx) {
    const target = ctx.message.text.split(' ')[1];
    if (!target) return ctx.reply('Usage: /promote [user_id]');
    const success = await promoteModerator(ctx, target);
    ctx.reply(success ? '✅ User promoted to moderator.' : '❌ Failed to promote user.');
  }

  static async handleAddFAQ(ctx) {
    try {
      const text = ctx.message.text.replace('/add_faq', '').trim();
      if (!text.includes('|')) return ctx.reply('Usage: /add_faq Question | Answer');
      
      const [q, a] = text.split('|').map(s => s.trim());
      const memory = await BrandMemory.getMemory();
      memory.faqs.push({ question: q, answer: a });
      await memory.save();
      ctx.reply('✅ FAQ added.');
    } catch (e) {
      ctx.reply('❌ Error adding FAQ.');
    }
  }

  static async handleRemoveFAQ(ctx) {
    try {
      const index = parseInt(ctx.message.text.split(' ')[1]) - 1;
      const memory = await BrandMemory.getMemory();
      if (index >= 0 && index < memory.faqs.length) {
        memory.faqs.splice(index, 1);
        await memory.save();
        ctx.reply('✅ FAQ removed.');
      } else {
        ctx.reply('❌ Invalid index.');
      }
    } catch (e) {
      ctx.reply('❌ Error removing FAQ.');
    }
  }
}
