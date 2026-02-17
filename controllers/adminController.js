import { BrandMemory } from '../database/models/BrandMemory.js';
import { Product } from '../database/models/Product.js';
import { logger } from '../utils/logger.js';

export class AdminController {
  static async handleUpdateMemory(ctx) {
    try {
      const text = ctx.message.text.replace('/update_memory', '').trim();
      
      if (!text) {
        return ctx.reply(
          '📝 *Update Brand Memory*\n\n' +
          'Usage: `/update_memory [field] [value]`\n\n' +
          'Available fields:\n' +
          '• `about` - About Salman Dev\n' +
          '• `services` - Services offered (comma-separated)\n' +
          '• `offers` - Current offers\n' +
          '• `availability` - Availability status\n' +
          '• `notes` - Custom notes\n\n' +
          'Example:\n' +
          '`/update_memory about Salman Dev is a full-stack developer specializing in AI solutions`',
          { parse_mode: 'Markdown' }
        );
      }

      const memory = await BrandMemory.getMemory();
      
      // Parse field and value
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
      ctx.reply(`✅ Brand memory updated successfully!\n\nField: ${field}\nValue: ${value}`);

    } catch (error) {
      logger.error('Error in handleUpdateMemory:', error);
      ctx.reply('❌ Failed to update memory. Please try again.');
    }
  }

  static async handleAddProduct(ctx) {
    try {
      const text = ctx.message.text.replace('/add_product', '').trim();
      
      if (!text) {
        return ctx.reply(
          '🛍️ *Add Product*\n\n' +
          'Usage: `/add_product [name] | [description] | [price] | [features] | [demo_url]`\n\n' +
          'Example:\n' +
          '`/add_product AI Chatbot | Custom AI assistant for businesses | $500 | 24/7 support, Multi-language, Custom training | https://demo.example.com`\n\n' +
          'Note: Features should be comma-separated. Demo URL is optional.',
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        return ctx.reply('❌ Invalid format. Please provide at least: name | description | price');
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
        `✅ Product added successfully!\n\n` +
        `📦 *${product.name}*\n` +
        `💰 ${product.price}\n` +
        `📝 ${product.description}\n` +
        `${features.length > 0 ? `✨ Features: ${features.join(', ')}\n` : ''}` +
        `${demoUrl ? `🔗 Demo: ${demoUrl}` : ''}`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      logger.error('Error in handleAddProduct:', error);
      ctx.reply('❌ Failed to add product. Please try again.');
    }
  }

  static async handleStatus(ctx) {
    try {
      const text = ctx.message.text.replace('/status', '').trim().toLowerCase();
      
      if (!text || !['online', 'busy', 'away'].includes(text)) {
        return ctx.reply(
          '🔄 *Update Status*\n\n' +
          'Usage: `/status [online|busy|away]`\n\n' +
          'Current status will affect how the bot responds to users.',
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
      ctx.reply(`${statusEmoji[text]} Status updated to: *${text}*`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleStatus:', error);
      ctx.reply('❌ Failed to update status. Please try again.');
    }
  }

  static async handleViewMemory(ctx) {
    try {
      const memory = await BrandMemory.getMemory();
      const products = await Product.find({ isActive: true });

      const message = `
📊 *Current Brand Memory*

${memory.getFormattedMemory()}

📦 *Products* (${products.length}):
${products.map(p => `• ${p.name} - ${p.price}`).join('\n') || 'No products added yet'}

Last Updated: ${memory.lastUpdated.toLocaleString()}
      `.trim();

      ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleViewMemory:', error);
      ctx.reply('❌ Failed to retrieve memory. Please try again.');
    }
  }

  static async handleListProducts(ctx) {
    try {
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        return ctx.reply('📦 No products available.');
      }

      const message = products.map((p, i) => 
        `${i + 1}. *${p.name}* - ${p.price}\n` +
        `   ${p.description}\n` +
        `   Views: ${p.viewCount}\n` +
        `   ID: \`${p._id}\``
      ).join('\n\n');

      ctx.reply(`📦 *Active Products*\n\n${message}`, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Error in handleListProducts:', error);
      ctx.reply('❌ Failed to retrieve products. Please try again.');
    }
  }
}
