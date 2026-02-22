import { Markup } from 'telegraf';
import { Template } from '../database/models/Template.js';
import { CommandStats } from '../database/models/CommandStats.js';
import { logger } from '../utils/logger.js';

export class TemplateController {
  // Show category selection
  static async showCategories(ctx) {
    try {
      await CommandStats.trackCommand('template_categories', ctx.from.id, 'View Categories');

      const categories = [
        { key: 'web', emoji: '🌐', label: 'Web Templates' },
        { key: 'mobile', emoji: '📱', label: 'Mobile Apps' },
        { key: 'bot', emoji: '🤖', label: 'Bot Templates' },
        { key: 'api', emoji: '⚙️', label: 'API Solutions' },
        { key: 'design', emoji: '🎨', label: 'Design Kits' },
        { key: 'other', emoji: '📦', label: 'Other' }
      ];

      const keyboard = Markup.inlineKeyboard(
        categories.map(cat => [
          Markup.button.callback(`${cat.emoji} ${cat.label}`, `cat_${cat.key}`)
        ])
      );

      const message = '📦 *SELECT TEMPLATE CATEGORY*\n\nChoose a category to browse templates:';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      }
    } catch (error) {
      logger.error('Error in showCategories:', error);
    }
  }

  // Show templates in category
  static async showCategoryTemplates(ctx) {
    try {
      const category = ctx.callbackQuery.data.replace('cat_', '');
      const templates = await Template.getByCategory(category);

      if (templates.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Back', 'template_categories')]
        ]);

        await ctx.editMessageText('❌ No templates in this category yet.', { ...keyboard });
        return ctx.answerCbQuery();
      }

      // Show only ONE template at a time with navigation
      const templateIndex = 0;
      await TemplateController.showSingleTemplate(ctx, templates, templateIndex, category);

    } catch (error) {
      logger.error('Error in showCategoryTemplates:', error);
    }
  }

  // Show single template with options
  static async showSingleTemplate(ctx, templates, index, category) {
    try {
      const template = templates[index];
      const totalTemplates = templates.length;

      // Increment view count
      template.viewCount = (template.viewCount || 0) + 1;
      await template.save();

      const message = `
📦 *${template.shortName}*
━━━━━━━━━━━━━━━━━━━━━━━━

💰 *Price:* ${template.price}

${template.features.length > 0 ? `✨ *Features:*\n${template.features.slice(0, 3).map(f => `• ${f}`).join('\n')}\n` : ''}

👁️ *Views:* ${template.viewCount}

━━━━━━━━━━━━━━━━━━━━━━━━
*${index + 1} of ${totalTemplates}*
      `.trim();

      const buttons = [
        [
          Markup.button.callback('📝 Description', `tmpl_desc_${template._id}`),
          Markup.button.callback('🔗 Demo', `tmpl_demo_${template._id}`)
        ]
      ];

      // Navigation buttons
      if (totalTemplates > 1) {
        const navButtons = [];
        if (index > 0) {
          navButtons.push(Markup.button.callback('⬅️ Prev', `tmpl_nav_${category}_${index - 1}`));
        }
        navButtons.push(Markup.button.callback('⬅️ Back', 'template_categories'));
        if (index < totalTemplates - 1) {
          navButtons.push(Markup.button.callback('Next ➡️', `tmpl_nav_${category}_${index + 1}`));
        }
        buttons.push(navButtons);
      } else {
        buttons.push([Markup.button.callback('⬅️ Back', 'template_categories')]);
      }

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } else {
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      }
    } catch (error) {
      logger.error('Error in showSingleTemplate:', error);
    }
  }

  // Show template description
  static async showTemplateDescription(ctx) {
    try {
      const templateId = ctx.callbackQuery.data.replace('tmpl_desc_', '');
      const template = await Template.findById(templateId);

      if (!template) {
        return ctx.answerCbQuery('Template not found');
      }

      const message = `
📦 *${template.name}*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Description:*
${template.description}

💰 *Price:* ${template.price}

✨ *Features:*
${template.features.map(f => `• ${f}`).join('\n')}

📁 *Files Included:*
${template.files.length > 0 ? template.files.map((f, i) => `${i + 1}. ${f.fileName}`).join('\n') : 'No files info'}

━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const buttons = [];

      // File details buttons
      if (template.files.length > 0) {
        template.files.forEach((file, index) => {
          buttons.push([
            Markup.button.callback(`📄 ${file.fileName}`, `file_info_${template._id}_${index}`)
          ]);
        });
      }

      buttons.push([
        Markup.button.callback('🔗 Demo', `tmpl_demo_${template._id}`),
        Markup.button.callback('⬅️ Back', 'template_categories')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in showTemplateDescription:', error);
    }
  }

  // Show file information
  static async showFileInfo(ctx) {
    try {
      const data = ctx.callbackQuery.data.replace('file_info_', '');
      const [templateId, fileIndex] = data.split('_');

      const template = await Template.findById(templateId);

      if (!template || !template.files[fileIndex]) {
        return ctx.answerCbQuery('File not found');
      }

      const file = template.files[fileIndex];

      const message = `
📄 *${file.fileName}*
━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Description:*
${file.fileDescription}

${file.fileUrl ? `🔗 *Link:* [Download](${file.fileUrl})` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const buttons = [];

      if (file.fileUrl) {
        buttons.push([Markup.button.url('🔗 Download/View', file.fileUrl)]);
      }

      buttons.push([
        Markup.button.callback('⬅️ Back to Description', `tmpl_desc_${template._id}`),
        Markup.button.callback('🏠 Menu', 'main_menu')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in showFileInfo:', error);
    }
  }

  // Show demo
  static async showTemplateDemo(ctx) {
    try {
      const templateId = ctx.callbackQuery.data.replace('tmpl_demo_', '');
      const template = await Template.findById(templateId);

      if (!template || !template.demoUrl) {
        await ctx.answerCbQuery('Demo not available');
        return;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('🔗 Open Demo', template.demoUrl)],
        [
          Markup.button.callback('📝 Description', `tmpl_desc_${template._id}`),
          Markup.button.callback('⬅️ Back', 'template_categories')
        ]
      ]);

      const message = `🔗 *Demo Available*\n\nClick the button below to view the demo of this template.`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in showTemplateDemo:', error);
    }
  }

  // Navigate templates
  static async navigateTemplates(ctx) {
    try {
      const data = ctx.callbackQuery.data.replace('tmpl_nav_', '');
      const parts = data.split('_');
      const category = parts[0];
      const index = parseInt(parts[1]);

      const templates = await Template.getByCategory(category);

      if (index < 0 || index >= templates.length) {
        return ctx.answerCbQuery('Invalid index');
      }

      await TemplateController.showSingleTemplate(ctx, templates, index, category);
    } catch (error) {
      logger.error('Error in navigateTemplates:', error);
    }
  }

  // Add template (admin)
  static async addTemplate(ctx, templateData) {
    try {
      const template = await Template.create(templateData);
      await CommandStats.trackCommand('add_template', ctx.from.id, `Add Template: ${template.name}`);
      return template;
    } catch (error) {
      logger.error('Error in addTemplate:', error);
      throw error;
    }
  }

  // Remove template (admin)
  static async removeTemplate(ctx, templateId) {
    try {
      const template = await Template.findByIdAndDelete(templateId);
      await CommandStats.trackCommand('remove_template', ctx.from.id, `Remove Template: ${template?.name}`);
      return template;
    } catch (error) {
      logger.error('Error in removeTemplate:', error);
      throw error;
    }
  }
}
