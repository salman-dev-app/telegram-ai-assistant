import { Markup } from 'telegraf';
import { Template } from '../database/models/Template.js';
import { GroupSettings } from '../database/models/GroupSettings.js';
import { Product } from '../database/models/Product.js';
import { User } from '../database/models/User.js';

export class DashboardManager {
  // Main Dashboard State
  static dashboardState = {};

  // ===== MAIN DASHBOARD =====
  static async renderMainDashboard(ctx) {
    try {
      const userId = ctx.from.id;
      const user = await User.findOne({ telegramId: userId });
      
      const dashboardText = `
╔══════════════════════════════════════╗
║  🎯 SALMAN DEV AI ASSISTANT 🎯      ║
╚══════════════════════════════════════╝

👤 User: ${user?.firstName || 'Guest'}
🌐 Language: ${user?.language || 'English'}
💬 Messages: ${user?.messageCount || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT WHAT YOU NEED:
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📦 Templates', 'dash_templates'),
          Markup.button.callback('⚙️ Settings', 'dash_settings')
        ],
        [
          Markup.button.callback('👤 Profile', 'dash_profile'),
          Markup.button.callback('📊 Group', 'dash_group')
        ],
        [
          Markup.button.callback('❓ Help', 'dash_help'),
          Markup.button.callback('🛠 Admin', 'dash_admin')
        ]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(dashboardText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      } else {
        const msg = await ctx.reply(dashboardText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        DashboardManager.dashboardState[userId] = msg.message_id;
      }
    } catch (error) {
      console.error('Error in renderMainDashboard:', error);
    }
  }

  // ===== TEMPLATES PANEL =====
  static async renderTemplatesPanel(ctx) {
    try {
      const userId = ctx.from.id;
      const categories = [
        { key: 'web', emoji: '🌐', label: 'Web' },
        { key: 'mobile', emoji: '📱', label: 'Mobile' },
        { key: 'bot', emoji: '🤖', label: 'Bot' },
        { key: 'api', emoji: '⚙️', label: 'API' },
        { key: 'design', emoji: '🎨', label: 'Design' },
        { key: 'other', emoji: '📦', label: 'Other' }
      ];

      const dashboardText = `
╔══════════════════════════════════════╗
║  📦 TEMPLATES & PRODUCTS 📦          ║
╚══════════════════════════════════════╝

Choose a category to browse:
      `.trim();

      const buttons = categories.map(cat => [
        Markup.button.callback(`${cat.emoji} ${cat.label}`, `dash_cat_${cat.key}`)
      ]);
      buttons.push([Markup.button.callback('⬅️ Back', 'dash_main')]);

      const keyboard = Markup.inlineKeyboard(buttons);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(dashboardText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        await ctx.answerCbQuery();
      }
    } catch (error) {
      console.error('Error in renderTemplatesPanel:', error);
    }
  }

  // ===== CATEGORY TEMPLATES PANEL =====
  static async renderCategoryPanel(ctx, category) {
    try {
      const templates = await Template.getByCategory(category);

      if (templates.length === 0) {
        const dashboardText = `
╔══════════════════════════════════════╗
║  📦 TEMPLATES 📦                     ║
╚══════════════════════════════════════╝

❌ No templates in this category yet.
        `.trim();

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Back', 'dash_templates')]
        ]);

        await ctx.editMessageText(dashboardText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        return ctx.answerCbQuery();
      }

      // Show first template
      await DashboardManager.renderSingleTemplatePanel(ctx, templates, 0, category);
    } catch (error) {
      console.error('Error in renderCategoryPanel:', error);
    }
  }

  // ===== SINGLE TEMPLATE PANEL =====
  static async renderSingleTemplatePanel(ctx, templates, index, category) {
    try {
      const template = templates[index];
      const totalTemplates = templates.length;

      template.viewCount = (template.viewCount || 0) + 1;
      await template.save();

      let dashboardText = `
╔══════════════════════════════════════╗
║  📦 ${template.shortName.substring(0, 30)} ║
╚══════════════════════════════════════╝

💰 Price: ${template.price}

📝 Description:
${template.description.substring(0, 150)}...

✨ Features:
${template.features.slice(0, 3).map(f => `• ${f}`).join('\n')}

👁️ Views: ${template.viewCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${index + 1} / ${totalTemplates}
      `.trim();

      const buttons = [
        [
          Markup.button.callback('📝 Full Info', `dash_tmpl_info_${template._id}`),
          Markup.button.callback('🔗 Demo', `dash_tmpl_demo_${template._id}`)
        ]
      ];

      if (totalTemplates > 1) {
        const navButtons = [];
        if (index > 0) {
          navButtons.push(Markup.button.callback('⬅️', `dash_tmpl_nav_${category}_${index - 1}`));
        }
        navButtons.push(Markup.button.callback('🏠', 'dash_templates'));
        if (index < totalTemplates - 1) {
          navButtons.push(Markup.button.callback('➡️', `dash_tmpl_nav_${category}_${index + 1}`));
        }
        buttons.push(navButtons);
      } else {
        buttons.push([Markup.button.callback('⬅️ Back', 'dash_templates')]);
      }

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderSingleTemplatePanel:', error);
    }
  }

  // ===== TEMPLATE INFO PANEL =====
  static async renderTemplateInfoPanel(ctx, templateId) {
    try {
      const template = await Template.findById(templateId);

      if (!template) {
        return ctx.answerCbQuery('Template not found');
      }

      let dashboardText = `
╔══════════════════════════════════════╗
║  📦 ${template.shortName.substring(0, 30)} ║
╚══════════════════════════════════════╝

💰 Price: ${template.price}

📝 Full Description:
${template.description}

✨ All Features:
${template.features.map(f => `• ${f}`).join('\n')}

📁 Files:
${template.files.map((f, i) => `${i + 1}. ${f.fileName}`).join('\n')}
      `.trim();

      const buttons = template.files.map((file, index) => [
        Markup.button.callback(`📄 ${file.fileName}`, `dash_file_${templateId}_${index}`)
      ]);

      buttons.push([
        Markup.button.callback('🔗 Demo', `dash_tmpl_demo_${templateId}`),
        Markup.button.callback('⬅️ Back', 'dash_templates')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderTemplateInfoPanel:', error);
    }
  }

  // ===== FILE INFO PANEL =====
  static async renderFileInfoPanel(ctx, templateId, fileIndex) {
    try {
      const template = await Template.findById(templateId);

      if (!template || !template.files[fileIndex]) {
        return ctx.answerCbQuery('File not found');
      }

      const file = template.files[fileIndex];

      let dashboardText = `
╔══════════════════════════════════════╗
║  📄 ${file.fileName.substring(0, 30)} ║
╚══════════════════════════════════════╝

📝 Description:
${file.fileDescription}

${file.fileUrl ? `🔗 Link: ${file.fileUrl}` : ''}
      `.trim();

      const buttons = [];

      if (file.fileUrl) {
        buttons.push([Markup.button.url('🔗 Download/View', file.fileUrl)]);
      }

      buttons.push([
        Markup.button.callback('⬅️ Back to Template', `dash_tmpl_info_${templateId}`),
        Markup.button.callback('🏠 Home', 'dash_main')
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderFileInfoPanel:', error);
    }
  }

  // ===== SETTINGS PANEL =====
  static async renderSettingsPanel(ctx) {
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });

      const dashboardText = `
╔══════════════════════════════════════╗
║  ⚙️ SETTINGS ⚙️                      ║
╚══════════════════════════════════════╝

🌐 Language: ${user?.language || 'English'}
🔔 Notifications: Enabled
🎨 Theme: Light

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose an option:
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🌐 Language', 'dash_lang'),
          Markup.button.callback('🔔 Notifications', 'dash_notif')
        ],
        [
          Markup.button.callback('🎨 Theme', 'dash_theme'),
          Markup.button.callback('🔐 Privacy', 'dash_privacy')
        ],
        [Markup.button.callback('⬅️ Back', 'dash_main')]
      ]);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderSettingsPanel:', error);
    }
  }

  // ===== PROFILE PANEL =====
  static async renderProfilePanel(ctx) {
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });

      const joinedDate = new Date(user?.joinedAt).toLocaleDateString();

      const dashboardText = `
╔══════════════════════════════════════╗
║  👤 YOUR PROFILE 👤                  ║
╚══════════════════════════════════════╝

👤 Name: ${user?.firstName || 'Unknown'} ${user?.lastName || ''}
🆔 ID: ${user?.telegramId}
🌐 Language: ${user?.language || 'English'}

📊 Statistics:
💬 Messages: ${user?.messageCount || 0}
🎵 Songs: ${user?.songsRequested || 0}
📅 Joined: ${joinedDate}

${user?.feedbackRating ? `⭐ Rating: ${user.feedbackRating}/5` : '⭐ No rating yet'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('⭐ Rate Bot', 'dash_rate'),
          Markup.button.callback('📊 Stats', 'dash_stats')
        ],
        [Markup.button.callback('⬅️ Back', 'dash_main')]
      ]);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderProfilePanel:', error);
    }
  }

  // ===== GROUP PANEL =====
  static async renderGroupPanel(ctx) {
    try {
      const groupSettings = await GroupSettings.findOne({ groupId: ctx.chat.id });

      if (!groupSettings) {
        const dashboardText = `
╔══════════════════════════════════════╗
║  📊 GROUP MANAGEMENT 📊              ║
╚══════════════════════════════════════╝

❌ Group not initialized yet.
        `.trim();

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Back', 'dash_main')]
        ]);

        await ctx.editMessageText(dashboardText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
        return ctx.answerCbQuery();
      }

      const dashboardText = `
╔══════════════════════════════════════╗
║  📊 GROUP MANAGEMENT 📊              ║
╚══════════════════════════════════════╝

👥 Members: ${groupSettings.stats.totalMembers}
💬 Messages: ${groupSettings.stats.messagesCount}
🚫 Spam Blocked: ${groupSettings.stats.spamBlocked}
👢 Users Kicked: ${groupSettings.stats.usersKicked}

🛡️ Auto-Moderation: ${groupSettings.autoModeration.enabled ? '✅' : '❌'}
🚫 Anti-Spam: ${groupSettings.autoModeration.antiSpam ? '✅' : '❌'}
🔤 Anti-Caps: ${groupSettings.autoModeration.antiCaps ? '✅' : '❌'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📋 Rules', 'dash_rules'),
          Markup.button.callback('⚙️ Settings', 'dash_group_settings')
        ],
        [
          Markup.button.callback('🛡️ Moderation', 'dash_moderation'),
          Markup.button.callback('📊 Stats', 'dash_group_stats')
        ],
        [Markup.button.callback('⬅️ Back', 'dash_main')]
      ]);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderGroupPanel:', error);
    }
  }

  // ===== ADMIN PANEL =====
  static async renderAdminPanel(ctx) {
    try {
      const dashboardText = `
╔══════════════════════════════════════╗
║  🛠 ADMIN PANEL 🛠                    ║
╚══════════════════════════════════════╝

Choose admin function:
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📦 Manage Templates', 'dash_admin_templates'),
          Markup.button.callback('👥 Manage Users', 'dash_admin_users')
        ],
        [
          Markup.button.callback('📊 Analytics', 'dash_admin_analytics'),
          Markup.button.callback('⚙️ System', 'dash_admin_system')
        ],
        [
          Markup.button.callback('📢 Broadcast', 'dash_admin_broadcast'),
          Markup.button.callback('🛡️ Backup', 'dash_admin_backup')
        ],
        [Markup.button.callback('⬅️ Back', 'dash_main')]
      ]);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderAdminPanel:', error);
    }
  }

  // ===== HELP PANEL =====
  static async renderHelpPanel(ctx) {
    try {
      const dashboardText = `
╔══════════════════════════════════════╗
║  ❓ HELP ❓                           ║
╚══════════════════════════════════════╝

📦 Templates - Browse all templates
👤 Profile - View your profile
⚙️ Settings - Customize preferences
📊 Group - Manage group settings
🛠 Admin - Admin functions

🎵 Music: Just say "play [song]"
🌤️ Weather: Just say "weather in [city]"
🌐 Translate: Say "translate to [lang]: [text]"
🖼️ Image: Say "generate: [description]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back', 'dash_main')]
      ]);

      await ctx.editMessageText(dashboardText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Error in renderHelpPanel:', error);
    }
  }
}
