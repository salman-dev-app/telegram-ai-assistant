import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  messageTimestamps: [{
    type: Date
  }],
  lastReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if user exceeded rate limit
rateLimitSchema.methods.isRateLimited = function(maxPerMinute = 5) {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Filter messages from last minute
  this.messageTimestamps = this.messageTimestamps.filter(
    timestamp => timestamp.getTime() > oneMinuteAgo
  );
  
  return this.messageTimestamps.length >= maxPerMinute;
};

// Method to add message timestamp
rateLimitSchema.methods.addMessage = function() {
  this.messageTimestamps.push(new Date());
  return this.save();
};

// Static method to check and update rate limit
rateLimitSchema.statics.checkLimit = async function(userId, maxPerMinute = 5) {
  let rateLimit = await this.findOne({ userId });
  
  if (!rateLimit) {
    rateLimit = await this.create({ userId, messageTimestamps: [] });
  }
  
  const isLimited = rateLimit.isRateLimited(maxPerMinute);
  
  if (!isLimited) {
    await rateLimit.addMessage();
  }
  
  return isLimited;
};

export const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
