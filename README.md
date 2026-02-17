# 🚀 Salman Dev - Premium Telegram AI Assistant

_A production-ready, highly stylish, and human-like Telegram AI Assistant for the "Salman Dev" brand. This bot is engineered to provide a premium user experience with advanced AI, robust error handling, and a sleek UI._

---

## 💎 Premium Features

### 🎨 Stylish UI & UX
- **Modern Layouts**: Clean, structured messages with professional dividers and icons.
- **Enhanced Emojis**: Carefully selected icons for a premium look and feel.
- **Interactive Buttons**: Stylish inline keyboards for language selection and navigation.
- **Human Simulation**: Realistic typing delays and natural conversation flow.

### 🧠 Advanced AI System
- **Multi-Model Fallback**: 4-tier fallback system using top-tier models (Gemini 2.0, Llama 3.3, Mistral, Stepfun).
- **Context Awareness**: Remembers recent interactions for seamless conversations.
- **Brand Memory**: Dynamically injected brand knowledge for consistent messaging.
- **Multi-Language**: Native support for **Bangla**, **Hindi**, and **English**.

### 🛡️ Enterprise-Grade Reliability
- **Port Binding**: Fixed deployment issues on Render/Railway with built-in health check server.
- **Anti-Spam**: Sophisticated rate limiting and duplicate message detection.
- **Admin Security**: Restricted access to critical management commands.
- **Structured Logging**: Comprehensive Winston logging for monitoring and debugging.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Telegraf.js
- **Database**: MongoDB (Mongoose)
- **AI API**: OpenRouter
- **Server**: Built-in HTTP for health checks
- **Logging**: Winston

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

## 🚀 Deployment (Fixed for Render/Railway)

This version includes a built-in HTTP server to prevent "No open ports detected" errors during deployment.

### Render Deployment:
1. Connect your GitHub repo.
2. Set **Build Command** to `npm install`.
3. Set **Start Command** to `npm start`.
4. Add your environment variables.
5. Render will now detect the port and stay online!

---

## 🤖 Admin Commands

- `/start` - 🚀 Launch the assistant
- `/help` - ℹ️ View help menu
- `/update_memory` - 📝 Update brand info
- `/add_product` - 🛍️ Add new product
- `/status` - 🚦 Change availability
- `/view_memory` - 📊 System overview
- `/list_products` - 📜 Product catalog

---

_Built with ❤️ for Salman Dev_
