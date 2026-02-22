# Complete Bot Command List for BotFather

Copy and paste these commands into BotFather to set up your bot's command menu.

## User Commands

```
start - Start the bot and see dashboard
help - View help menu and features
```

## Admin Commands

```
update_memory - Update brand information
add_product - Add a new product
remove_product - Remove a product
status - Set your online/busy/away status
view_memory - View system statistics
list_products - List all products
broadcast - Send message to all users
backup - Download system backup
restart - Restart the bot
kick - Kick user from group
ban - Ban user from group
unban - Unban user from group
promote - Promote user to moderator
add_faq - Add a frequently asked question
remove_faq - Remove a FAQ entry
```

---

## Auto-Trigger Features (NO COMMANDS NEEDED)

Just type naturally - the bot will automatically detect and respond:

### 🎵 Music
- "play [song name]"
- "play song [song name]"
- "baja [song name]"
- "gaan baja [song name]"
- "play me [song name]"
- "i want to listen [song name]"

**Response:** Bot sends `/play [song name]` to your music bot

### 🌤️ Weather
- "weather in [city]"
- "[city] weather"
- "what's the weather in [city]"
- "how's the weather in [city]"
- "temperature in [city]"

**Response:** Shows real-time weather with temperature, humidity, wind

### 🌐 Translation
- "translate to [language]: [text]"
- "translate [language]: [text]"
- "translate this to [language]: [text]"
- "[language] to [language]: [text]"
- "translate [language] [text]"

**Response:** Translates text to English, Bangla, or Hindi

### 🖼️ Image Generation
- "generate: [description]"
- "generate image: [description]"
- "create image: [description]"
- "draw: [description]"
- "image of [description]"
- "make an image of [description]"
- "can you generate [description]"

**Response:** Generates image using AI (requires API key)

### 😂 Jokes
- "tell me a joke"
- "joke"
- "funny"
- "make me laugh"
- "haha"

**Response:** Sends random joke

### 💡 Quotes
- "quote"
- "inspiration"
- "motivate me"
- "wisdom"

**Response:** Sends quote of the day

### 📞 Contact
- "contact"
- "portfolio"
- "link"
- "github"
- "whatsapp"
- "email"
- "salman dev"

**Response:** Shows contact card with all social links

### 📦 Products
- "product"
- "service"
- "price"
- "demo"
- "buy"
- "order"

**Response:** Shows all products with inline buttons (Demo + Buy Now)

### ❓ Help
- "help"
- "how to"
- "what is"
- "guide"

**Response:** Shows help menu

### 👤 Profile
- "profile"
- "my info"
- "my profile"
- "stats"

**Response:** Shows user profile with statistics

### ⭐ Feedback
- "feedback"
- "rating"
- "rate"
- "review"

**Response:** Shows rating buttons (1-5 stars)

---

## Inline Button Actions

All responses use inline buttons - NO plain text:

### Product Cards
- 🔗 **View Demo** - Opens demo link
- 🛒 **Buy Now** - Opens Telegram contact
- ℹ️ **More Info** - Shows detailed product info

### Music Responses
- 🔄 **Play Another** - Ready for next song
- ⏹️ **Stop** - Stop music

### Weather Responses
- 🔄 **Another City** - Check different city
- 📅 **Tomorrow** - Check tomorrow's weather

### Translation Responses
- 🔄 **Translate Again** - Ready for another translation
- 🏠 **Menu** - Back to main menu

### Joke/Quote Responses
- 😂 **Another Joke** - Get another joke
- 💡 **Another Quote** - Get another quote
- 🏠 **Menu** - Back to main menu

### Rating System
- ⭐ 1 Star
- ⭐⭐ 2 Stars
- ⭐⭐⭐ 3 Stars
- ⭐⭐⭐⭐ 4 Stars
- ⭐⭐⭐⭐⭐ 5 Stars

---

## Main Menu Navigation

From any screen, use inline buttons to navigate:

- 📦 **Products** - View all products
- 📖 **Help** - View help guide
- 🌐 **Language** - Change language (Bangla, Hindi, English)
- 👤 **Profile** - View your profile
- ❓ **FAQ** - View FAQs
- 🛠 **Admin** - Admin panel (admin only)
- 💬 **Contact** - Contact Salman Dev
- 🏠 **Back** - Go back to previous menu

---

## Admin-Only Features

### Status Control
- 🟢 **Online** - Bot is silent, you handle all
- 🟡 **Busy** - AI handles queries, you are busy
- 🔴 **Away** - AI handles all, you are offline

### System Management
- 📢 **Broadcast** - Send message to all users
- 🛡️ **Backup** - Download system backup
- 📊 **System Stats** - View analytics
- 📈 **Command Stats** - View command usage statistics
- 🔄 **Restart** - Restart bot

### Group Management
- 👢 **Kick** - Remove user from group
- 🚫 **Ban** - Ban user permanently
- ✅ **Unban** - Unban user
- 👤 **Promote** - Make user moderator

---

## 10 New Features

1. **Sentiment Analysis** - Bot understands positive/negative messages
2. **Quote of the Day** - Daily inspirational quotes
3. **Poll Creation** - Create polls in groups
4. **Reminder System** - Set reminders (database ready)
5. **Advanced Spam Filter** - Detects repeated chars, caps, spam
6. **Profanity Filter** - Filters inappropriate words
7. **Keyword Extraction** - Extracts important keywords
8. **Time-Based Greeting** - Different greetings for morning/evening
9. **Quick Reply Suggestions** - Shows suggested replies
10. **Activity Logger** - Logs all user activities

---

## Command Statistics

Admin can view:
- Total command usage count
- Top 15 most used commands
- Number of unique users per command
- Last used timestamp

Access via: `Admin Menu` → `Command Stats` button

---

## Language Support

All features work in:
- 🇧🇩 **Bangla** (Bengali in English letters)
- 🇮🇳 **Hindi** (Romanized Hindi)
- 🇬🇧 **English**

User selects language on first interaction.

---

## Setup Instructions

1. **Add Commands to BotFather:**
   - Open [@BotFather](https://t.me/BotFather)
   - Send `/setcommands`
   - Select your bot
   - Copy-paste the commands from above
   - Send the list

2. **Set Command Scope (Optional):**
   - `/setcommands` for default scope
   - `/setcommands` for group scope (admin commands)
   - `/setcommands` for private scope (user commands)

3. **Bot Description:**
   ```
   Advanced AI Assistant with music, weather, translation, image generation, and group management. Auto-detects requests - no commands needed!
   ```

4. **Bot Short Description:**
   ```
   Smart AI with music, weather, translation & more
   ```

---

## Version Info

- **Version:** 2.1.0
- **Status:** Production Ready ✅
- **Last Updated:** February 2026

---

## Support

For issues or questions:
- 💬 Telegram: [@Otakuosenpai](https://t.me/Otakuosenpai)
- 🐙 GitHub: [@salman-dev-app](https://github.com/salman-dev-app)
- 📧 Email: mdsalmanhelp0@gmail.com
