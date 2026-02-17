# 👑 Salman Dev - Elite AI Assistant (v4.0)

_The ultimate, production-ready Telegram AI Assistant for the "Salman Dev" brand. Now powered by Groq for lightning-fast, reliable AI responses._

---

## 💎 Elite Features (v4.0)

### 🚀 Powered by Groq (Ultra-Fast AI)
- **Llama 3.3 70B Integration**: Replaced Gemini with **Groq**, the world's fastest AI inference engine. This provides near-instant responses and 100% reliability.
- **Zero Cost**: Uses Groq's generous free tier for developers.
- **Romanized Language**: Professional support for **Bangla** and **Hindi** using English letters (e.g., "Kemon achen?").

### 🛡️ Rock-Solid Stability
- **Anti-Conflict Logic**: Enhanced startup sequence that force-clears existing connections and waits for old instances to shut down. This fixes the "409 Conflict" error permanently.
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
- **AI Engine**: Groq (Llama 3.3 70B & Llama 3.1 8B)
- **Database**: MongoDB (Mongoose)
- **Server**: Built-in HTTP for health checks

---

## ⚙️ Setup and Installation

### 1. Get a Groq API Key
1. Go to [GroqCloud](https://console.groq.com/).
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
OPENROUTER_API_KEY="your_groq_api_key" # Put your Groq key here
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
