_# Salman Dev - Telegram AI Assistant_

_A production-ready, human-like Telegram AI Assistant for the "Salman Dev" brand. This bot is designed to manage group conversations, provide intelligent assistance, and act as a digital representative for Salman Dev._

_---

_## 🔷 Features_

_This AI assistant comes with a comprehensive set of features designed for a real-world, production environment:_

_### 1. Intelligent Conversation Handling_
_- **Threaded Replies**: Always replies directly to a user's message thread using `reply_to_message`._
_- **Multi-User Support**: Manages multiple simultaneous conversations within a group chat seamlessly._

_### 2. Per-User Language Selection_
_- **Dynamic Language Choice**: New users are prompted to select their preferred language (Bangla, Hindi, or English) via inline buttons._
_- **Persistent Preference**: The user's language choice is saved to the database and the selection message is deleted to maintain a clean chat history._

_### 3. Human-Like AI Response System_
_- **Natural & Concise**: The bot is engineered to communicate in a short, human-like manner, avoiding a robotic or ChatGPT-like tone._
_- **Multi-Model Fallback**: Utilizes the OpenRouter API with a mandatory fallback system to ensure high availability._
  _- **Primary**: `openai/gpt-oss-120b:free`_
  _- **Backup**: `stepfun/step-3.5-flash:free`_
  _- **Final**: `meta-llama/llama-3.2-3b-instruct:free`_

_### 4. Brand & Product Management_
_- **Dynamic Brand Memory**: Admins can inject and update brand knowledge (about, services, offers, availability) using the `/update_memory` command. All data is stored permanently in MongoDB._
_- **Product Catalog**: Add and manage products with descriptions, prices, features, and demo URLs via the `/add_product` command._

_### 5. Admin & Security_
_- **Admin-Only Commands**: Critical commands like `/update_memory`, `/add_product`, and `/status` are restricted to the configured admin Telegram ID._
_- **Status Control**: Admins can set the bot's status to `online`, `busy`, or `away` to adapt its response behavior._

_### 6. Human Behavior & Anti-Spam_
_- **Typing Simulation**: Adds a realistic typing delay to avoid instant, robotic replies._
_- **Rate Limiting**: Prevents spam by limiting the number of replies per user per minute._
_- **Spam Detection**: Ignores repeated or flooding messages._

_## 🔶 Tech Stack_

_This project is built with a modern, robust, and scalable tech stack:_

_- **Runtime**: Node.js (Latest LTS)_
_- **Framework**: Telegraf.js_
_- **Database**: MongoDB with Mongoose_
_- **HTTP Client**: Axios_
_- **Environment**: dotenv_
_- **Logging**: Winston_

_The project follows a clean, modular architecture for maintainability:_

_```_
_/ai         # AI model integration_
_/config     # Environment and settings_
_/controllers# Command and message handlers_
_/database   # MongoDB connection and models_
_/middleware # Telegraf middleware (auth, rate limiting)_
_/services   # Business logic (user, product management)_
_/utils      # Utility functions (logger)_
_```_

_## ⚙️ Setup and Installation_

_Follow these steps to get the bot running locally._

_### 1. Clone the Repository_
_```bash_
git clone https://github.com/salman-dev-app/telegram-ai-assistant.git
cd telegram-ai-assistant
_```_

_### 2. Install Dependencies_
_```bash_
npm install
_```_

_### 3. Configure Environment Variables_
_Create a `.env` file in the root directory by copying the example file:_

_```bash_
cp .env.example .env
_```_

_Now, open the `.env` file and fill in the required values:_

_- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather._
_- `ADMIN_TELEGRAM_ID`: Your personal Telegram user ID. You can get this from a bot like @userinfobot._
_- `OPENROUTER_API_KEY`: Your API key from [OpenRouter.ai](https://openrouter.ai/)._
_- `MONGODB_URI`: Your MongoDB connection string._

_### 4. Run the Bot_
_```bash_
_# For production_
npm start

_# For development (with auto-restarting)_
npm run dev
_```_

_## 🚀 Deployment_

_This project is designed for easy deployment on platforms like Railway or Render._

_### Railway_
_1. **Fork this repository** to your own GitHub account._
_2. Create a new project on Railway and connect it to your forked repository._
_3. Add the required environment variables (`TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_ID`, `OPENROUTER_API_KEY`, `MONGODB_URI`) in the project settings._
_4. Railway will automatically detect the `package.json` and deploy the bot using the `npm start` command._

_### Render_
_1. **Fork this repository** to your own GitHub account._
_2. Create a new "Web Service" on Render and connect it to your forked repository._
_3. Set the environment to **Node**._
_4. Set the **Build Command** to `npm install`._
_5. Set the **Start Command** to `npm start`._
_6. Add the required environment variables in the "Environment" section._
_7. Deploy the service._

_## 🤖 Usage (Admin Commands)_

_- **`/start`**: Displays the welcome message._
_- **`/help`**: Shows the help and command list._
_- **`/update_memory [field] [value]`**: Updates the bot's brand knowledge._
  _- Example: `/update_memory about Salman Dev is a developer.`_
_- **`/add_product [name] | [desc] | [price] | [features] | [demo]`**: Adds a new product._
  _- Example: `/add_product My App | A great app | $100 | Feature A, Feature B`_
_- **`/status [online|busy|away]`**: Changes the bot's availability status._
_- **`/view_memory`**: Shows the current brand memory and product list._
_- **`/list_products`**: Lists all active products in detail._

_---

_This assistant is built to be more than just a chatbot—it's a digital extension of the Salman Dev brand, designed to be genuinely helpful and human-like._
