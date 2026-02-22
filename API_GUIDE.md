# 🗝️ Salman Dev AI Bot - API Key Guide

To use all the features of your bot, you need to add these free API keys to your **Koyeb Environment Variables**.

---

### 1. **Groq API Key** (Required for AI Chat)
- **Feature:** Smart AI Chat & Conversation
- **How to get:**
  1. Go to [Groq Console](https://console.groq.com/keys)
  2. Sign up/Login
  3. Click **"Create API Key"**
  4. **Koyeb Variable Name:** `GROQ_API_KEY`

---

### 2. **OpenWeatherMap API Key** (For Weather)
- **Feature:** "What is the weather in Dhaka?"
- **How to get:**
  1. Go to [OpenWeatherMap](https://home.openweathermap.org/api_keys)
  2. Sign up for a **Free** account
  3. Go to "API Keys" and copy your key
  4. **Koyeb Variable Name:** `WEATHER_API_KEY`

---

### 3. **Hugging Face API Key** (For Image Generation)
- **Feature:** "Generate: a cat on a moon"
- **How to get:**
  1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
  2. Sign up/Login
  3. Click **"New token"** (Select "Read" role)
  4. **Koyeb Variable Name:** `HUGGING_FACE_API_KEY`

---

### 4. **Telegram Bot Token** (Required)
- **Feature:** Running the bot
- **How to get:**
  1. Message [@BotFather](https://t.me/BotFather) on Telegram
  2. Use `/newbot` and follow steps
  3. **Koyeb Variable Name:** `TELEGRAM_BOT_TOKEN`

---

### 5. **MongoDB URI** (Required)
- **Feature:** Saving users, products, and settings
- **How to get:**
  1. Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (Free Shared Cluster)
  2. Create a database and get the "Connection String"
  3. **Koyeb Variable Name:** `MONGODB_URI`

---

## 🚀 How to add to Koyeb:
1. Go to your **Koyeb Service Settings**
2. Scroll down to **"Environment Variables"**
3. Click **"Add Variable"**
4. Enter the **Name** and **Value** for each key above
5. **Save & Redeploy**

Your bot will automatically pick up these keys and start working! 🌟
