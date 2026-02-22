import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    default: null
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  language: {
    type: String,
    enum: ['bangla', 'hindi', 'english'],
    default: null
  },
  languageSelected: {
    type: Boolean,
    default: false
  },
  conversationContext: {
    type: String,
    default: ''
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  productClicks: {
    type: Map,
    of: Number,
    default: {}
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  spamScore: {
    type: Number,
    default: 0
  },
  lastMessages: [{
    content: String,
    timestamp: Date
  }],
  // New: feedback rating
  feedbackRating: {
    type: Number,
    default: null,
    min: 1,
    max: 5
  },
  // New: reminders
  reminders: [{
    text: String,
    remindAt: Date,
    sent: { type: Boolean, default: false }
  }],
  // New: join date
  joinedAt: {
    type: Date,
    default: Date.now
  },
  // New: total songs requested
  songsRequested: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ lastInteraction: -1 });

// Method to update conversation context
userSchema.methods.updateContext = function(newContext) {
  this.conversationContext = newContext.slice(-800);
  this.lastInteraction = Date.now();
  return this.save();
};

// Method to check spam
userSchema.methods.checkSpam = function(message) {
  const now = Date.now();
  const recentMessages = this.lastMessages.filter(
    msg => now - msg.timestamp < 60000
  );
  
  const sameMessages = recentMessages.filter(
    msg => msg.content === message
  ).length;
  
  return sameMessages >= 3;
};

// Method to add message to history
userSchema.methods.addMessage = function(content) {
  this.lastMessages.push({
    content,
    timestamp: Date.now()
  });
  
  if (this.lastMessages.length > 15) {
    this.lastMessages = this.lastMessages.slice(-15);
  }
  
  this.messageCount++;
  return this.save();
};

// Method to track product click
userSchema.methods.trackProductClick = function(productId) {
  const currentCount = this.productClicks.get(productId) || 0;
  this.productClicks.set(productId, currentCount + 1);
  this.lastInteraction = Date.now();
  return this.save();
};

export const User = mongoose.model('User', userSchema);
