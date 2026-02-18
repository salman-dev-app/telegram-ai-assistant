# 👑 Salman Dev - Elite AI Assistant (v5.0)

_The ultimate, production-ready Telegram AI Assistant for the "Salman Dev" brand. Now with Banglish support, unified contact cards, and 100% uptime optimization._

---

## 💎 Elite Features (v5.0)

### 🚀 Banglish Language Support
- **Strict Banglish Rules**: The bot now communicates in **BANGLISH** (Bengali language written using English letters).
- **No Bengali Script**: Prevents Unicode errors and ensures a consistent conversational tone.
- **Natural Tone**: Short, conversational, and human-like responses.

### 📇 Unified Contact Card
- **Structured Interface**: Whenever a user asks for contact info, links, or portfolio, the bot sends a professional **Inline Keyboard** card.
- **One-Click Access**: Direct buttons for GitHub, WhatsApp, Telegram, and Email.

### 🛡️ 100% Uptime & Stability
- **Anti-Sleep Mechanism**: Built-in self-pinging to keep the bot alive on Render's free tier.
- **Admin Restart**: A new `/restart` command and button allow the admin to reboot the bot instance directly from Telegram.
- **409 Conflict Resolution**: Enhanced startup sequence force-clears existing connections.

### 🎮 Fully Interactive UI
- **One-Click Controls**: Manage your status (Online, Busy, Away) with a single click.
- **Seamless Navigation**: Entirely button-driven interface for Products, Help, and Language selection.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Telegraf.js
- **AI Engine**: Groq (Llama 3.3 70B)
- **Database**: MongoDB (Mongoose)
- **Server**: Built-in HTTP for health checks and uptime.

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
- `/view_memory` - 📊 System stats
- `/list_products` - 📜 Asset catalog

---

_Built with ❤️ for Salman Dev_
