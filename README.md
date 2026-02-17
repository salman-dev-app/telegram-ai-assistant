# 👑 Salman Dev - Elite AI Assistant (v2.0)

_The ultimate, production-ready Telegram AI Assistant for the "Salman Dev" brand. Engineered for 100% reliability, elite UI, and intelligent presence management._

---

## 💎 Elite Features (v2.0)

### 🚀 100% Reliable AI
- **Verified Free Models**: Fixed AI response issues by using confirmed working free models (Gemini 2.0 Flash, Llama 3.3, DeepSeek R1, Qwen 2.5).
- **Multi-Tier Fallback**: Advanced error handling ensures the bot never stays silent.
- **Romanized Language**: Professional support for **Bangla** and **Hindi** using English letters (e.g., "Kemon achen?").

### 🎮 Fully Interactive UI
- **One-Click Controls**: Manage your status (Online, Busy, Away) with a single click.
- **Seamless Navigation**: Entirely button-driven interface for Products, Help, and Language selection.
- **Elite Layouts**: Modern, structured messages with professional dividers and premium icons.

### 🛡️ Enterprise Stability
- **Conflict Fix**: Automatically clears webhooks on startup to prevent "409 Conflict" errors.
- **Port Binding**: Built-in HTTP server for 24/7 uptime on Render/Railway.
- **Intelligent Presence**: 
  - **🟢 Online**: Bot is silent. You handle all chats.
  - **🟡 Busy**: AI assists while you are busy.
  - **🔴 Away**: AI handles everything while you are offline.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Telegraf.js
- **Database**: MongoDB (Mongoose)
- **AI API**: OpenRouter (Strictly Verified Free Models)
- **Server**: Built-in HTTP for health checks

---

## ⚙️ Setup and Installation

### 1. Clone & Install
```bash
git clone https://github.com/salman-dev-app/telegram-ai-assistant.git
cd telegram-ai-assistant
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
TELEGRAM_BOT_TOKEN="your_token"
ADMIN_TELEGRAM_ID="your_id"
OPENROUTER_API_KEY="your_key"
MONGODB_URI="your_mongodb_uri"
PORT=3000
```

### 3. Run
```bash
npm start
```

---

## 🤖 Admin Command Center

- `/start` - 👑 Launch the elite dashboard
- `/help` - 📖 View user guide
- `/update_memory` - 📝 Update brand intel
- `/add_product` - 🛍️ Add new asset
- `/status` - 🚦 Presence control
- `/view_memory` - 📊 System stats
- `/list_products` - 📜 Asset catalog

---

_Built with ❤️ for Salman Dev_
