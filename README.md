# 👑 Salman Dev - Elite AI Assistant (v5.2)

_The ultimate, production-ready Telegram AI Assistant for the "Salman Dev" brand. Now with fixed AI context, admin-only product removal, and one-click deployment for Koyeb._

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/salman-dev-app/telegram-ai-assistant&branch=main&name=telegram-ai-assistant)

---

## 💎 Elite Features (v5.2)

### 🚀 One-Click Deployment
- **Koyeb Ready**: Now includes a `koyeb.yaml` configuration and a one-click deploy button for seamless hosting on Koyeb.

### 🗑️ Admin-Only Product Removal
- **Full Control**: Admin can now remove products using the `/remove_product [Product ID]` command.
- **Safety**: Only the authorized admin (defined by `ADMIN_TELEGRAM_ID`) can perform this action.

### 🛡️ Fixed AI Engine
- **OpenRouter Integration**: Switched to OpenRouter by default to match environment variable expectations.
- **Reliable Context**: Fixed AI prompt formatting to ensure the bot remembers brand details and product info correctly.

### 🛡️ Robust Startup & Uptime
- **Force Kill Logic**: Implemented a robust startup sequence that force-clears existing connections and waits for old instances to shut down. This permanently fixes the "409 Conflict" error.
- **Anti-Sleep Mechanism**: Built-in self-pinging to keep the bot alive.
- **Admin Restart**: A new `/restart` command and button allow the admin to reboot the bot instance directly from Telegram.

### 🚀 Banglish Language Support
- **Strict Banglish Rules**: The bot communicates exclusively in **BANGLISH** (Bengali language written using English letters).
- **No Bengali Script**: Prevents Unicode errors and ensures a consistent conversational tone.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Telegraf.js
- **AI Engine**: OpenRouter (Multiple Free Models)
- **Database**: MongoDB (Mongoose)
- **Server**: Built-in HTTP for health checks and uptime.

---

## ⚙️ Setup and Installation

### 1. Get an OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/).
2. Create an API Key.

### 2. Clone & Install
```bash
git clone https://github.com/salman-dev-app/telegram-ai-assistant.git
cd telegram-ai-assistant
npm install
```

### 3. Configure Environment
Create a `.env` file:
```env
TELEGRAM_BOT_TOKEN="your_telegram_token"
ADMIN_TELEGRAM_ID="your_id"
OPENROUTER_API_KEY="your_openrouter_api_key"
MONGODB_URI="your_mongodb_uri"
PORT=3000
RENDER_EXTERNAL_URL="https://your-app-name.onrender.com" # Optional for self-ping
```

### 4. Run
```bash
npm start
```

---

## 🤖 Admin Command Center

- `/start` - 👑 Launch the elite dashboard
- `/restart` - 🔄 System Reboot (Admin Only)
- `/status` - 🚦 Presence control
- `/update_memory` - 📝 Update brand intel
- `/add_product` - 🛍️ Add new asset
- `/remove_product` - 🗑️ Remove asset (Admin Only)
- `/view_memory` - 📊 System stats
- `/list_products` - 📜 Asset catalog

---

_Built with ❤️ for Salman Dev_
