# 👑 Salman Dev - Elite AI Assistant (v3.0)

_The ultimate, production-ready Telegram AI Assistant for the "Salman Dev" brand. Now powered by Google Gemini for 100% reliability and zero cost._

---

## 💎 Elite Features (v3.0)

### 🚀 100% Reliable AI (Powered by Google Gemini)
- **Direct Gemini Integration**: Replaced OpenRouter with direct **Google Gemini 1.5 Flash** integration. This provides much faster responses and 100% reliability on the free tier.
- **Zero Cost**: Uses Google's official free tier for developers.
- **Romanized Language**: Professional support for **Bangla** and **Hindi** using English letters (e.g., "Kemon achen?").

### 🛡️ Rock-Solid Stability
- **Anti-Conflict Logic**: Enhanced startup sequence that force-clears existing connections. This fixes the "409 Conflict" error permanently.
- **Port Binding**: Built-in HTTP server for 24/7 uptime on Render/Railway.
- **Intelligent Presence**: 
  - **🟢 Online**: Bot is silent. You handle all chats.
  - **🟡 Busy**: AI assists while you are busy.
  - **🔴 Away**: AI handles everything while you are offline.

### 🎮 Fully Interactive UI
- **One-Click Controls**: Manage your status (Online, Busy, Away) with a single click.
- **Seamless Navigation**: Entirely button-driven interface for Products, Help, and Language selection.
- **Elite Layouts**: Modern, structured messages with professional dividers and premium icons.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Telegraf.js
- **AI Engine**: Google Generative AI (Gemini 1.5 Flash)
- **Database**: MongoDB (Mongoose)
- **Server**: Built-in HTTP for health checks

---

## ⚙️ Setup and Installation

### 1. Get a Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a free API Key.

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
OPENROUTER_API_KEY="your_gemini_api_key" # Put your Gemini key here
MONGODB_URI="your_mongodb_uri"
PORT=3000
```

### 4. Run
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
