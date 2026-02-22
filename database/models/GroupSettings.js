import mongoose from 'mongoose';

const groupSettingsSchema = new mongoose.Schema({
  groupId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  groupName: String,
  
  // Auto-moderation settings
  autoModeration: {
    enabled: { type: Boolean, default: true },
    antiSpam: { type: Boolean, default: true },
    antiLinks: { type: Boolean, default: false },
    antiCaps: { type: Boolean, default: true },
    antiRepeated: { type: Boolean, default: true },
    maxWarnings: { type: Number, default: 3 },
    autoKickAfterWarnings: { type: Boolean, default: true }
  },
  
  // Welcome settings
  welcomeMessage: {
    enabled: { type: Boolean, default: true },
    text: String
  },
  
  // Rules
  rules: [String],
  
  // Banned words
  bannedWords: [String],
  
  // Moderators
  moderators: [Number],
  
  // Muted users
  mutedUsers: [{
    userId: Number,
    reason: String,
    mutedAt: Date,
    unmuteAt: Date
  }],
  
  // Warnings
  userWarnings: [{
    userId: Number,
    warningCount: Number,
    warnings: [{
      reason: String,
      date: Date
    }]
  }],
  
  // Statistics
  stats: {
    totalMembers: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 },
    spamBlocked: { type: Number, default: 0 },
    usersKicked: { type: Number, default: 0 },
    usersBanned: { type: Number, default: 0 }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add warning to user
groupSettingsSchema.methods.addWarning = async function(userId, reason) {
  let userWarning = this.userWarnings.find(w => w.userId === userId);
  
  if (!userWarning) {
    userWarning = { userId, warningCount: 0, warnings: [] };
    this.userWarnings.push(userWarning);
  }
  
  userWarning.warningCount += 1;
  userWarning.warnings.push({ reason, date: new Date() });
  
  return this.save();
};

// Get user warning count
groupSettingsSchema.methods.getUserWarnings = function(userId) {
  const userWarning = this.userWarnings.find(w => w.userId === userId);
  return userWarning?.warningCount || 0;
};

// Mute user
groupSettingsSchema.methods.muteUser = async function(userId, reason, durationMinutes = 60) {
  const unmuteAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  
  let mutedUser = this.mutedUsers.find(m => m.userId === userId);
  if (!mutedUser) {
    mutedUser = { userId, reason, mutedAt: new Date(), unmuteAt };
    this.mutedUsers.push(mutedUser);
  } else {
    mutedUser.unmuteAt = unmuteAt;
  }
  
  return this.save();
};

// Unmute user
groupSettingsSchema.methods.unmuteUser = async function(userId) {
  this.mutedUsers = this.mutedUsers.filter(m => m.userId !== userId);
  return this.save();
};

// Check if user is muted
groupSettingsSchema.methods.isUserMuted = function(userId) {
  const mutedUser = this.mutedUsers.find(m => m.userId === userId);
  if (!mutedUser) return false;
  
  if (new Date() > mutedUser.unmuteAt) {
    return false;
  }
  
  return true;
};

// Add moderator
groupSettingsSchema.methods.addModerator = async function(userId) {
  if (!this.moderators.includes(userId)) {
    this.moderators.push(userId);
    return this.save();
  }
  return this;
};

// Remove moderator
groupSettingsSchema.methods.removeModerator = async function(userId) {
  this.moderators = this.moderators.filter(id => id !== userId);
  return this.save();
};

// Check if user is moderator
groupSettingsSchema.methods.isModerator = function(userId) {
  return this.moderators.includes(userId);
};

export const GroupSettings = mongoose.model('GroupSettings', groupSettingsSchema);
