import { Markup } from 'telegraf';
import { Product } from '../database/models/Product.js';
import { logger } from './logger.js';

export class ProductBrowser {
  // ===== SHOW PRODUCT LIST AS INLINE BUTTONS =====
  static async showProductList(ctx, page = 0, itemsPerPage = 6) {
    try {
      const products = await Product.find({ isActive: true });

      if (products.length === 0) {
        const text = `
╔══════════════════════════════════════╗
║  📦 PRODUCTS 📦                      ║
╚══════════════════════════════════════╝

❌ No products available at the moment.
        `.trim();

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Home', 'dash_main')]
        ]);

        if (ctx.callbackQuery) {
          await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
          return ctx.answerCbQuery();
        }
        return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }

      // Paginate products
      const totalPages = Math.ceil(products.length / itemsPerPage);
      const startIdx = page * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const paginatedProducts = products.slice(startIdx, endIdx);

      let text = `
╔══════════════════════════════════════╗
║  📦 SELECT A PRODUCT 📦              ║
╚══════════════════════════════════════╝

Choose a product to view details:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page ${page + 1} / ${totalPages}
      `.trim();

      // Create product buttons (ONE per row)
      const buttons = paginatedProducts.map(product => [
        Markup.button.callback(`📦 ${product.name}`, `prod_select_${product._id}`)
      ]);

      // Add pagination buttons
      const paginationButtons = [];
      if (page > 0) {
        paginationButtons.push(Markup.button.callback('⬅️ Prev', `prod_list_${page - 1}`));
      }
      paginationButtons.push(Markup.button.callback('🏠 Home', 'dash_main'));
      if (page < totalPages - 1) {
        paginationButtons.push(Markup.button.callback('Next ➡️', `prod_list_${page + 1}`));
      }

      buttons.push(paginationButtons);

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        return ctx.answerCbQuery();
      }

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in showProductList:', error);
    }
  }

  // ===== SHOW SINGLE PRODUCT WITH OPTIONS =====
  static async showProductDetails(ctx, productId) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        await ctx.answerCbQuery('❌ Product not found');
        return;
      }

      // Increment view count
      product.viewCount = (product.viewCount || 0) + 1;
      await product.save();

      const text = `
╔══════════════════════════════════════╗
║  📦 ${product.name.substring(0, 28)} ║
╚══════════════════════════════════════╝

💰 *Price:* ${product.price}

📝 *Description:*
${product.description}

✨ *Features:*
${product.features.map(f => `• ${f}`).join('\n')}

👁️ *Views:* ${product.viewCount}
      `.trim();

      const buttons = [
        [
          Markup.button.url('🔗 Demo', product.demoUrl || 'https://t.me/Otakuosenpai'),
          Markup.button.url('🛒 Buy Now', product.contactUrl || 'https://t.me/Otakuosenpai')
        ],
        [
          Markup.button.callback('📝 Full Description', `prod_desc_${productId}`),
          Markup.button.callback('📋 Files', `prod_files_${productId}`)
        ],
        [
          Markup.button.callback('⬅️ Back to List', 'prod_list_0'),
          Markup.button.callback('🏠 Home', 'dash_main')
        ]
      ];

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        return ctx.answerCbQuery();
      }

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in showProductDetails:', error);
    }
  }

  // ===== SHOW FULL PRODUCT DESCRIPTION =====
  static async showProductDescription(ctx, productId) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        return ctx.answerCbQuery('❌ Product not found');
      }

      const text = `
╔══════════════════════════════════════╗
║  📦 ${product.name.substring(0, 28)} ║
╚══════════════════════════════════════╝

💰 *Price:* ${product.price}

📝 *Full Description:*
${product.description}

✨ *All Features:*
${product.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

📁 *Files Included:* ${product.files?.length || 0} files

${product.category ? `🏷️ *Category:* ${product.category}` : ''}
${product.thumbnail ? `🖼️ *Thumbnail:* [View Image](${product.thumbnail})` : ''}

👁️ *Views:* ${product.viewCount}
      `.trim();

      const buttons = [
        [
          Markup.button.url('🔗 Demo', product.demoUrl || 'https://t.me/Otakuosenpai'),
          Markup.button.url('🛒 Buy Now', product.contactUrl || 'https://t.me/Otakuosenpai')
        ],
        [
          Markup.button.callback('📋 Files', `prod_files_${productId}`),
          Markup.button.callback('⬅️ Back', `prod_select_${productId}`)
        ],
        [Markup.button.callback('🏠 Home', 'dash_main')]
      ];

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        return ctx.answerCbQuery();
      }

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in showProductDescription:', error);
    }
  }

  // ===== SHOW PRODUCT FILES =====
  static async showProductFiles(ctx, productId) {
    try {
      const product = await Product.findById(productId);

      if (!product || !product.files || product.files.length === 0) {
        return ctx.answerCbQuery('❌ No files available');
      }

      let text = `
╔══════════════════════════════════════╗
║  📦 ${product.name.substring(0, 28)} ║
╚══════════════════════════════════════╝

📁 *Files:*
      `.trim();

      const buttons = product.files.map((file, index) => [
        Markup.button.callback(`📄 ${file.fileName}`, `prod_file_${productId}_${index}`)
      ]);

      buttons.push([
        Markup.button.callback('⬅️ Back', `prod_select_${productId}`),
        Markup.button.callback('🏠 Home', 'dash_main')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        return ctx.answerCbQuery();
      }

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in showProductFiles:', error);
    }
  }

  // ===== SHOW SINGLE FILE DETAILS =====
  static async showFileDetails(ctx, productId, fileIndex) {
    try {
      const product = await Product.findById(productId);

      if (!product || !product.files || !product.files[fileIndex]) {
        return ctx.answerCbQuery('❌ File not found');
      }

      const file = product.files[fileIndex];

      const text = `
╔══════════════════════════════════════╗
║  📄 ${file.fileName.substring(0, 30)} ║
╚══════════════════════════════════════╝

📝 *Description:*
${file.fileDescription || 'No description available'}

${file.fileUrl ? `🔗 *Link:* [Download/View](${file.fileUrl})` : ''}
      `.trim();

      const buttons = [];

      if (file.fileUrl) {
        buttons.push([Markup.button.url('🔗 Download/View', file.fileUrl)]);
      }

      buttons.push([
        Markup.button.callback('⬅️ Back to Files', `prod_files_${productId}`),
        Markup.button.callback('🏠 Home', 'dash_main')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        return ctx.answerCbQuery();
      }

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in showFileDetails:', error);
    }
  }

  // ===== SEARCH PRODUCTS BY NAME =====
  static async searchProducts(ctx, query) {
    try {
      const products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      });

      if (products.length === 0) {
        const text = `
╔══════════════════════════════════════╗
║  🔍 SEARCH RESULTS 🔍                ║
╚══════════════════════════════════════╝

❌ No products found for: "${query}"

Try another search or browse all products.
        `.trim();

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('📦 Browse All', 'prod_list_0')],
          [Markup.button.callback('🏠 Home', 'dash_main')]
        ]);

        return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }

      let text = `
╔══════════════════════════════════════╗
║  🔍 SEARCH RESULTS 🔍                ║
╚══════════════════════════════════════╝

Found ${products.length} product(s) for: "${query}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose a product:
      `.trim();

      const buttons = products.map(product => [
        Markup.button.callback(`📦 ${product.name}`, `prod_select_${product._id}`)
      ]);

      buttons.push([
        Markup.button.callback('📦 Browse All', 'prod_list_0'),
        Markup.button.callback('🏠 Home', 'dash_main')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      return ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      logger.error('Error in searchProducts:', error);
    }
  }
}
