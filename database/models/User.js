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
  }]
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ lastInteraction: -1 });

// Method to update conversation context
userSchema.methods.updateContext = function(newContext) {
  this.conversationContext = newContext.slice(-500); // Keep last 500 chars
  this.lastInteraction = Date.now();
  return this.save();
};

// Method to check spam
userSchema.methods.checkSpam = function(message) {
  const now = Date.now();
  const recentMessages = this.lastMessages.filter(
    msg => now - msg.timestamp < 60000 // Last minute
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
  
  // Keep only last 10 messages
  if (this.lastMessages.length > 10) {
    this.lastMessages = this.lastMessages.slice(-10);
  }
  
  this.messageCount++;
  return this.save();
};

export const User = mongoose.model('User', userSchema);
