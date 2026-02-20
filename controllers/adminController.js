import { Markup } from 'telegraf';
import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { User } from '../database/models/User.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

export class AdminController {
  static async handleUpdateMemory(ctx) {
    try {
      const text = ctx.message.text.replace('/update_memory', '').trim();
      
      if (!text) {
        return ctx.reply(
          '📝 *UPDATE BRAND INTEL*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/update_memory [field] [value]`\n\n' +
          '💎 *Available Fields:*\n' +
          '• `about` - Brand Identity\n' +
          '• `services` - Premium Services\n' +
          '• `offers` - Exclusive Deals\n' +
          '• `availability` - Presence Info\n' +
          '• `notes` - Custom Intel\n\n' +
          '💡 *Example:*\n' +
          '`/update_memory about Salman Dev is an elite full-stack developer.`',
          { parse_mode: 'Markdown' }
        );
      }

      const memory = await BrandMemory.getMemory();
      
      // Parse field and value
      const parts = text.split(' ');
      const field = parts[0].toLowerCase();
      const value = parts.slice(1).join(' ');

      if (!value) {
        return ctx.reply('❌ *Error:* Please provide a value for the field.');
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
          return ctx.reply('❌ *Error:* Invalid field. Use: about, services, offers, availability, or notes');
      }

      memory.lastUpdated = Date.now();
      await memory.save();

      logger.info(`Brand memory updated by admin: ${field}`);
      ctx.reply(`✅ *Intel Updated Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n💎 *Field:* ${field}\n💎 *Value:* ${value}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleUpdateMemory:', error);
      ctx.reply('❌ *Error:* Failed to update memory. Please try again.');
    }
  }

  static async handleAddProduct(ctx) {
    try {
      const text = ctx.message.text.replace('/add_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '🛍️ *ADD NEW ASSET*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/add_product [name] | [description] | [price] | [features] | [demo_url]`\n\n' +
          '💡 *Example:*\n' +
          '`/add_product Elite Bot | Custom AI for business | $1000 | 24/7 support, Multi-language | https://demo.com`\n\n' +
          '⚠️ *Note:* Features should be comma-separated. Demo URL is optional.',
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return ctx.reply('❌ *Error:* Invalid format. Please provide at least: name | description | price');
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
        `✅ *Asset Added Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *${product.name}*\n` +
        `💰 *Price:* ${product.price}\n` +
        `📝 *Description:* ${product.description}\n` +
        `${features.length > 0 ? `✨ *Features:* ${features.join(', ')}\n` : ''}` +
        `${demoUrl ? `🔗 *Demo:* ${demoUrl}` : ''}`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      logger.error('Error in handleAddProduct:', error);
      ctx.reply('❌ *Error:* Failed to add product. Please try again.');
    }
  }

  static async handleRemoveProduct(ctx) {
    try {
      const text = ctx.message.text.replace('/remove_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '🗑️ *REMOVE ASSET*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/remove_product [Product ID]`\n\n' +
          '💡 *Tip:* Use `/list_products` to find the ID of the asset you want to remove.',
          { parse_mode: 'Markdown' }
        );
      }

      const product = await Product.findById(text);
      
      if (!product) {
        return ctx.reply('❌ *Error:* Product not found. Please check the ID.');
      }

      await Product.findByIdAndDelete(text);
      
      logger.info(`Product removed by admin: ${product.name} (${text})`);
      
      ctx.reply(
        `✅ *Asset Removed Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Name:* ${product.name}\n` +
        `🆔 *ID:* \`${text}\``,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      logger.error('Error in handleRemoveProduct:', error);
      ctx.reply('❌ *Error:* Failed to remove product. Make sure you provided a valid MongoDB ID.');
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

      const text = '🚦 *PRESENCE CONTROL CENTER*\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                   'Select your current status below:\n\n' +
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
      ctx.reply('❌ *Error:* Failed to open status control.');
    }
  }

  static async handleStatusCallback(ctx) {
    try {
      const status = ctx.callbackQuery.data.replace('status_', '');
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
        [Markup.button.callback('🚦 Back to Status', 'status_menu')],
        [Markup.button.callback('🏠 Main Menu', 'main_menu')]
      ]);

      await ctx.editMessageText(
        `✅ *Presence Updated Successfully!*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusEmoji[status]} *New Status:* **${statusText[status]}**`,
        { parse_mode: 'Markdown', ...keyboard }
      );

      await ctx.answerCbQuery(`Status set to ${status.toUpperCase()}`);
      logger.info(`Status updated via button: ${status}`);

    } catch (error) {
      logger.error('Error in handleStatusCallback:', error);
      ctx.answerCbQuery('Error updating status');
    }
  }

  static async handleViewMemory(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      const products = await Product.find({ isActive: true });
      const userCount = await User.countDocuments();

      const statusEmoji = {
        online: '🟢',
        busy: '🟡',
        away: '🔴'
      };

      const message = `
📊 *SYSTEM ANALYTICS & STATS*
━━━━━━━━━━━━━━━━━━━━━━━━

🚦 *Current Status:* ${statusEmoji[memory.status]} **${memory.status.toUpperCase()}**
👥 *Total Users:* **${userCount}**
📦 *Active Assets:* **${products.length}**

👤 *Brand Identity:*
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
      ctx.reply('❌ *Error:* Failed to retrieve memory. Please try again.');
    }
  }

  static async handleListProducts(ctx) {
    try {
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        return ctx.reply('📦 *No assets available.*');
      }

      const message = products.map((p, i) => 
        `${i + 1}. 📦 *${p.name}* - ${p.price}\n` +
        `   📝 ${p.description}\n` +
        `   👁️ Views: ${p.viewCount}\n` +
        `   🆔 ID: \`${p._id}\``
      ).join('\n\n');

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back to Menu', 'main_menu')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(`📜 *ASSET CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${message}`, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(`📜 *ASSET CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${message}`, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (error) {
      logger.error('Error in handleListProducts:', error);
      ctx.reply('❌ *Error:* Failed to retrieve products. Please try again.');
    }
  }

  // --- NEW: BROADCAST SYSTEM ---
  static async handleBroadcast(ctx) {
    const text = ctx.message.text.replace('/broadcast', '').trim();
    if (!text) {
      return ctx.reply(
        '📢 *BROADCAST SYSTEM*\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Usage: `/broadcast [your message]`\n\n' +
        'This will send a message to ALL users who have talked to the bot.',
        { parse_mode: 'Markdown' }
      );
    }

    try {
      const users = await User.find({ isBlocked: false });
      let successCount = 0;
      let failCount = 0;

      await ctx.reply(`📢 *Starting broadcast to ${users.length} users...*`, { parse_mode: 'Markdown' });

      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(user.telegramId, `📢 *BROADCAST FROM SALMAN DEV*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${text}`, { parse_mode: 'Markdown' });
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 50)); // Avoid rate limits
        } catch (err) {
          failCount++;
          logger.error(`Broadcast failed for user ${user.telegramId}: ${err.message}`);
        }
      }

      await ctx.reply(`✅ *Broadcast Complete!*\n\n🚀 Success: ${successCount}\n❌ Failed: ${failCount}`, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleBroadcast:', error);
      ctx.reply('❌ *Error:* Failed to complete broadcast.');
    }
  }

  // --- NEW: AUTO-BACKUP SYSTEM ---
  static async handleBackup(ctx) {
    try {
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
          language: u.language
        }))
      };

      const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(process.cwd(), fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      await ctx.replyWithDocument({ source: filePath, filename: fileName }, {
        caption: '🛡️ *SYSTEM BACKUP COMPLETE*\n\nThis file contains all your brand memory, products, and user data.',
        parse_mode: 'Markdown'
      });

      fs.unlinkSync(filePath); // Clean up
      if (ctx.callbackQuery) await ctx.answerCbQuery('Backup sent!');
    } catch (error) {
      logger.error('Error in handleBackup:', error);
      ctx.reply('❌ *Error:* Failed to create backup.');
    }
  }
}
