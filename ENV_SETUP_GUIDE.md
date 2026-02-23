# Environment Variables Setup Guide

This guide provides all the environment variables needed for your Telegram AI Assistant bot to work properly.

## Quick Start

Create a `.env` file in the root directory of your project and add all the variables below:

```bash
# Copy this template and fill in your actual values
cp .env.example .env
```

---

## Required Environment Variables

### 1. **Telegram Bot Configuration** (REQUIRED)

```env
# Your Telegram Bot Token (get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Your Telegram User ID (get from @userinfobot)
ADMIN_TELEGRAM_ID=your_telegram_id_here
```

**How to get these:**
- **TELEGRAM_BOT_TOKEN**: Message [@BotFather](https://t.me/botfather) on Telegram and create a new bot
- **ADMIN_TELEGRAM_ID**: Message [@userinfobot](https://t.me/userinfobot) to get your ID

---

### 2. **MongoDB Database** (REQUIRED)

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**How to set up:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Replace `username`, `password`, `cluster`, and `database_name`

---

### 3. **AI/LLM API Keys** (REQUIRED for AI responses)

#### Option A: OpenRouter (Recommended - Free Models Available)

```env
# OpenRouter API Key (supports free models)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**How to get:**
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up with GitHub or email
3. Go to Keys section
4. Create a new API key
5. Copy and paste it

**Free Models Available:**
- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `deepseek/deepseek-r1:free`

#### Option B: Groq (Alternative)

```env
# Groq API Key (very fast, free tier available)
GROQ_API_KEY=your_groq_api_key_here
```

**How to get:**
1. Go to [Groq Console](https://console.groq.com)
2. Sign up
3. Create API key
4. Copy and paste it

---

### 4. **Image Generation APIs** (OPTIONAL but recommended)

Choose at least ONE of these for image generation features:

#### Option A: Stability AI (Recommended)

```env
# Stability AI API Key
STABILITY_API_KEY=your_stability_api_key_here
```

**How to get:**
1. Go to [Stability AI](https://platform.stability.ai)
2. Sign up
3. Go to API Keys
4. Create new key
5. Copy and paste it

**Free Credits:** $5-10 free credits for testing

#### Option B: Hugging Face (Free)

```env
# Hugging Face API Key
HUGGING_FACE_API_KEY=your_huggingface_api_key_here
```

**How to get:**
1. Go to [Hugging Face](https://huggingface.co)
2. Sign up
3. Go to Settings → Access Tokens
4. Create new token (read access is enough)
5. Copy and paste it

**Cost:** Free for inference API

#### Option C: Replicate (Alternative)

```env
# Replicate API Key
REPLICATE_API_KEY=your_replicate_api_key_here
```

**How to get:**
1. Go to [Replicate](https://replicate.com)
2. Sign up with GitHub
3. Go to API tokens
4. Copy your token
5. Paste it

**Cost:** Pay per prediction (very affordable)

---

### 5. **Weather API** (OPTIONAL)

```env
# OpenWeatherMap API Key
WEATHER_API_KEY=your_openweather_api_key_here
```

**How to get:**
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up
3. Go to API Keys
4. Copy your key
5. Paste it

**Cost:** Free tier available (1000 calls/day)

---

### 6. **Optional: Music Bot Username**

```env
# Music bot username (if you have a music bot integration)
MUSIC_BOT_USERNAME=YourMusicBot
```

---

### 7. **Optional: Group ID**

```env
# Group ID for daily greetings (optional)
GROUP_ID=your_group_id_here
```

---

### 8. **Optional: Port Configuration**

```env
# Port for health check server (default: 3000)
PORT=3000
```

---

## Complete Example .env File

```env
# ===== TELEGRAM CONFIGURATION =====
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ADMIN_TELEGRAM_ID=987654321

# ===== DATABASE =====
MONGODB_URI=mongodb+srv://salman:password123@cluster.mongodb.net/telegram_bot?retryWrites=true&w=majority

# ===== AI/LLM APIS =====
OPENROUTER_API_KEY=sk-or-v1-abc123def456ghi789jkl012mno345pqr

# ===== IMAGE GENERATION APIS =====
# Choose at least one:
STABILITY_API_KEY=sk-abc123def456ghi789jkl012mno345pqr
HUGGING_FACE_API_KEY=hf_abc123def456ghi789jkl012mno345pqr
REPLICATE_API_KEY=abc123def456ghi789jkl012mno345pqr

# ===== WEATHER API =====
WEATHER_API_KEY=abc123def456ghi789jkl012mno345pqr

# ===== OPTIONAL =====
MUSIC_BOT_USERNAME=YourMusicBot
GROUP_ID=your_group_id
PORT=3000
```

---

## How to Use Environment Variables

### Local Development

1. Create `.env` file in root directory
2. Add all variables
3. Run bot: `npm start`
4. The bot will automatically load variables from `.env`

### Production (Koyeb, Heroku, Railway, etc.)

1. Go to your deployment platform's dashboard
2. Find "Environment Variables" or "Config Vars" section
3. Add each variable one by one
4. Deploy/restart your application

**Example for Koyeb:**
```
Settings → Environment Variables → Add Variable
Key: TELEGRAM_BOT_TOKEN
Value: your_actual_token
```

---

## Troubleshooting

### "Bot token not found"
- Make sure `TELEGRAM_BOT_TOKEN` is set
- Check for typos
- Get a new token from @BotFather if needed

### "MongoDB connection failed"
- Verify `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure database exists

### "Image generation not working"
- At least one image API key must be set
- Check API key is valid
- Verify API has credits/quota remaining
- Check internet connection

### "AI responses not working"
- Verify `OPENROUTER_API_KEY` or `GROQ_API_KEY` is set
- Check API key is valid
- Ensure API has quota remaining
- Check bot has internet connection

### "Buttons not responding"
- This was fixed in the latest update
- Make sure you have the latest code
- Restart the bot after updating

---

## Security Tips

1. **Never commit `.env` file to GitHub**
   - Add to `.gitignore`: `echo ".env" >> .gitignore`

2. **Use strong API keys**
   - Don't share your keys with anyone
   - Rotate keys regularly

3. **For production:**
   - Use environment variables from your hosting platform
   - Don't hardcode secrets in code

4. **Protect your Telegram Admin ID**
   - Only you should have admin access
   - Don't share it publicly

---

## Cost Summary (Approximate)

| Service | Cost | Notes |
|---------|------|-------|
| Telegram Bot | FREE | Official Telegram API |
| MongoDB | FREE | 512MB free tier |
| OpenRouter | FREE | Free models available |
| Groq | FREE | Free tier available |
| Stability AI | $5-10 | Free credits for testing |
| Hugging Face | FREE | Free inference API |
| Replicate | PAY-AS-YOU-GO | ~$0.001-0.01 per image |
| OpenWeatherMap | FREE | 1000 calls/day free |

**Total for basic setup: FREE to $5**

---

## Next Steps

1. Set up all required environment variables
2. Test bot locally with `npm start`
3. Deploy to production (Koyeb, Railway, Heroku, etc.)
4. Monitor logs for errors
5. Add your bot to Telegram groups

---

**Last Updated:** February 23, 2026
**Bot Version:** 2.0.0 (Fixed)
