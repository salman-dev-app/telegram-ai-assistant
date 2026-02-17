import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { logger } from '../utils/logger.js';

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

  static async handleStatus(ctx) {
    try {
      const text = ctx.message.text.replace('/status', '').trim().toLowerCase();
      
      if (!text || !['online', 'busy', 'away'].includes(text)) {
        return ctx.reply(
          '🚦 *PRESENCE CONTROL*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Usage: `/status [online|busy|away]`\n\n' +
          '🟢 *Online:* Bot is silent. Salman handles all.\n' +
          '🟡 *Busy:* AI handles queries. Salman is busy.\n' +
          '🔴 *Away:* AI handles all. Salman is offline.',
          { parse_mode: 'Markdown' }
        );
      }

      const memory = await BrandMemory.getMemory();
      memory.status = text;
      await memory.save();

      const statusEmoji = {
        online: '🟢',
        busy: '🟡',
        away: '🔴'
      };

      logger.info(`Status updated by admin: ${text}`);
      ctx.reply(`${statusEmoji[text]} *Presence Updated:* **${text.toUpperCase()}**`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleStatus:', error);
      ctx.reply('❌ *Error:* Failed to update status. Please try again.');
    }
  }

  static async handleViewMemory(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      const products = await Product.find({ isActive: true });

      const message = `
📊 *SYSTEM STATS*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Brand Identity:*
${memory.getFormattedMemory()}

📦 *Active Assets:* (${products.length})
${products.map(p => `• ${p.name} - ${p.price}`).join('\n') || 'No assets added yet'}

━━━━━━━━━━━━━━━━━━━━━━━━
🕒 *Last Updated:* ${memory.lastUpdated.toLocaleString()}
      `.trim();

      ctx.reply(message, { parse_mode: 'Markdown' });

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

      ctx.reply(`📜 *ASSET CATALOG*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${message}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleListProducts:', error);
      ctx.reply('❌ *Error:* Failed to retrieve products. Please try again.');
    }
  }
}
